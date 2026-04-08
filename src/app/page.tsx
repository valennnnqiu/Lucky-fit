"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { CityCombobox } from "@/components/city-combobox";
import {
  buildBirthdayISO,
  formatBirthdayDisplayFromISO,
  formatBirthdayInputMask,
  parseBirthdayInput,
} from "@/lib/birthday-form";
import { getLuckyColorFromBirthday } from "@/lib/lucky-color";
import { generateOutfit } from "@/lib/outfit-engine";
import { strings } from "@/lib/strings";
import {
  getOccasions,
  getProfile,
  saveOccasions,
  saveOutfit,
  saveOutfitRoll,
  saveProfile,
  saveWeather,
} from "@/lib/storage";
import type { Gender, Occasion } from "@/lib/types";
import { fetchWeatherByCity, WeatherFetchError } from "@/lib/weather";

/**
 * Form panel art: intrinsic height of this image sets the form block height (`w-full` in layout).
 * File: `public/home/home-form-bg.png`. Bump `v` after replacing the asset.
 */
const HOME_FORM_BG_SRC = "/home/home-form-bg.png?v=1";

/**
 * Hero headline raster: `public/home/hero-title.png` (bump `v` after replacing the file).
 */
const HOME_HERO_TITLE_SRC = "/home/hero-title.png?v=2";

/** Intrinsic size of `hero-title.png` — used for layout aspect ratio only (CSS scales down). */
const HOME_HERO_TITLE_WIDTH = 1328;
const HOME_HERO_TITLE_HEIGHT = 688;

function homeHeroTitlePlainText(h: (typeof strings)["home"]): string {
  const line1 =
    `${h.heroTitleLine1Lead}${h.heroTitleLine1Accent}${h.heroTitleLine1Trail}`.trimEnd();
  const line2 =
    `${h.heroTitleLine2Lead}${h.heroTitleLine2AccentLucky}${h.heroTitleLine2Mid}${h.heroTitleLine2AccentColor}${h.heroTitleLine2Trail}`.replace(
      /\s+/g,
      " ",
    ).trim();
  return `${line1}. ${line2}.`;
}

const genderKeys: { value: Gender; key: "female" | "male" | "nonBinary" }[] = [
  { value: "female", key: "female" },
  { value: "male", key: "male" },
  { value: "non-binary", key: "nonBinary" },
];

type ActivityLabelKey =
  | "office"
  | "coffee"
  | "gym"
  | "party"
  | "brunch"
  | "meeting"
  | "school";

const activityGrid: { value: Occasion; labelKey: ActivityLabelKey }[] = [
  { value: "school", labelKey: "school" },
  { value: "office", labelKey: "office" },
  { value: "meeting", labelKey: "meeting" },
  { value: "party", labelKey: "party" },
  { value: "brunch", labelKey: "brunch" },
  { value: "coffee", labelKey: "coffee" },
  { value: "gym", labelKey: "gym" },
];

/**
 * Home form palette: warm paper surfaces + dusty rose accent. Typography leans
 * Handjet for a receipt/ticket feel on headings and hero; chips, gender
 * toggles, inputs, and error copy use Geist (see `.font-geist`).
 */
const darkInput =
  "box-border h-9 w-full rounded-[12px] border border-[#50504d]/30 bg-[#faf9f8] px-4 text-left text-[12px] leading-none text-[#40403d] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] outline-none placeholder:text-[#40403d]/45 focus-visible:border-[0.5px] focus-visible:border-[#7d5e61]/85 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#7d5e61]/28";
/** Matches focus-visible treatment when a field is invalid after submit */
const inputErrorRing = "border-[#c45555]/55 bg-white ring-2 ring-[#c45555]/40";
const darkList =
  "absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-52 overflow-auto rounded-2xl border border-[#50504d]/22 bg-[#faf9f8] py-1 text-left shadow-lg";
const darkItem =
  "flex h-9 w-full items-center px-4 text-left text-[12px] leading-none text-[#40403d] hover:bg-[#f0eeeb] active:bg-[#e5dedf]";

/** Idle: opaque surface + border for contrast on the form illustration. Disabled (max 3): translucent white + muted label. */
const homeFormToggleIdle =
  "border border-[#50504d]/26 bg-[#f2f0ed] text-[#40403d] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] hover:border-[#50504d]/34 hover:bg-[#E4DEDD]";
const homeFormToggleActive =
  "border border-[#7d5e61]/40 bg-[#c49a9e] text-[#1f1e1d] shadow-sm";
const homeFormToggleDisabled =
  "cursor-not-allowed border border-dashed border-[#50504d]/25 bg-white/50 text-[#40403d]/50 shadow-none";

/** Section headings — matches globals --foreground */
const homeFormSectionHeadingText = "text-[#50504D]";
const homeFormFocusOutline =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c49a9e]";

type SyncFieldKey = "birthday" | "city" | "occasions";

const syncFieldOrder: SyncFieldKey[] = ["birthday", "city", "occasions"];

export default function Home() {
  const router = useRouter();
  const t = strings;
  const [birthdayInput, setBirthdayInput] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [city, setCity] = useState("");
  const [occasions, setOccasions] = useState<Occasion[]>(["office"]);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<SyncFieldKey, string>>>({});
  const [invalidCity, setInvalidCity] = useState(false);
  const [invalidBirthday, setInvalidBirthday] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** When the home BG asset loads, form height follows the image; on missing file, fall back to content height. */
  const [homeFormBgOk, setHomeFormBgOk] = useState(true);

  function clearCityFieldError() {
    setInvalidCity(false);
    setFieldErrors((prev) => {
      const { city: _, ...rest } = prev;
      return rest;
    });
    setSubmitError(null);
  }

  function clearBirthdayFieldError() {
    setInvalidBirthday(false);
    setFieldErrors((prev) => {
      const { birthday: _, ...rest } = prev;
      return rest;
    });
    setSubmitError(null);
  }

  function clearOccasionsFieldError() {
    setFieldErrors((prev) => {
      const { occasions: _, ...rest } = prev;
      return rest;
    });
    setSubmitError(null);
  }

  useEffect(() => {
    const p = getProfile();
    if (!p) return;
    setBirthdayInput(formatBirthdayDisplayFromISO(p.birthday));
    setGender(p.gender);
    setCity(p.city);
  }, []);

  useEffect(() => {
    const saved = getOccasions();
    if (saved.length === 0) return;
    const filtered = saved.filter((o) => o !== "casual-day");
    setOccasions(filtered.length > 0 ? filtered : ["office"]);
  }, []);

  function labelForActivity(labelKey: ActivityLabelKey): string {
    return t.home.activities[labelKey];
  }

  function toggleOccasion(value: Occasion) {
    clearOccasionsFieldError();
    setOccasions((prev) => {
      if (prev.includes(value)) {
        if (prev.length <= 1) return prev;
        return prev.filter((o) => o !== value);
      }
      if (prev.length >= 3) return prev;
      return [...prev, value];
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setInvalidCity(false);
    setInvalidBirthday(false);
    setSubmitError(null);

    const nextFieldErrors: Partial<Record<SyncFieldKey, string>> = {};
    let birthdayIso: string | null = null;

    const cityMissing = !city.trim();
    const birthdayEmpty = !birthdayInput.trim();

    if (cityMissing && birthdayEmpty) {
      nextFieldErrors.city = t.errors.enterCityAndBirthday;
      if (occasions.length === 0) {
        nextFieldErrors.occasions = t.errors.occasionsRequired;
      }
      setFieldErrors(nextFieldErrors);
      setInvalidCity(true);
      setInvalidBirthday(true);
      return;
    }

    if (cityMissing) {
      nextFieldErrors.city = t.errors.enterCity;
    }

    if (birthdayEmpty) {
      nextFieldErrors.birthday = t.errors.enterBirthday;
    } else {
      const parsed = parseBirthdayInput(birthdayInput);
      if (!parsed.ok) {
        nextFieldErrors.birthday = t.birthdayErrors[parsed.code];
      } else {
        const built = buildBirthdayISO(parsed.year, parsed.month, parsed.day);
        if (!built.ok) {
          nextFieldErrors.birthday = t.birthdayErrors[built.code];
        } else {
          birthdayIso = built.iso;
        }
      }
    }

    if (occasions.length === 0) {
      nextFieldErrors.occasions = t.errors.occasionsRequired;
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setInvalidBirthday(!!nextFieldErrors.birthday);
      setInvalidCity(!!nextFieldErrors.city);
      return;
    }

    if (!birthdayIso) return;

    const luckyColor = getLuckyColorFromBirthday(birthdayIso);
    setBusy(true);
    try {
      saveProfile({
        birthday: birthdayIso,
        gender,
        city: city.trim(),
        luckyColor,
      });
      saveOccasions(occasions);
      const weather = await fetchWeatherByCity(city.trim());
      saveWeather(weather);
      const outfit = generateOutfit(weather, occasions, luckyColor, gender);
      saveOutfit(outfit);
      saveOutfitRoll(0);
      router.push("/result");
    } catch (err: unknown) {
      if (err instanceof WeatherFetchError) {
        setSubmitError(t.errors.weather);
      } else {
        setSubmitError(t.errors.generic);
      }
    } finally {
      setBusy(false);
    }
  }

  const validationMessages = syncFieldOrder
    .map((k) => fieldErrors[k])
    .filter((msg): msg is string => Boolean(msg));

  return (
    <div className="phone-canvas-stage">
      <div className="phone-canvas-scale">
      <div className="mb-8 text-center">
        <h1 className="px-2">
          <img
            src={HOME_HERO_TITLE_SRC}
            alt={homeHeroTitlePlainText(t.home)}
            width={HOME_HERO_TITLE_WIDTH}
            height={HOME_HERO_TITLE_HEIGHT}
            decoding="async"
            className="mx-auto block h-fit w-[400px] object-contain object-center py-[80px]"
          />
        </h1>
        {t.home.heroSubtitle.trim() ? (
          <p className="font-handjet mt-2 text-sm font-normal tracking-wide text-[#50504d]/55">
            {t.home.heroSubtitle}
          </p>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className={`relative w-full overflow-hidden rounded-none bg-transparent ${
          homeFormBgOk ? "" : "px-5 pb-6 pt-[44px]"
        }`}
        noValidate
      >
        {homeFormBgOk ? (
          <img
            src={HOME_FORM_BG_SRC}
            alt=""
            className="pointer-events-none block h-auto w-full max-w-full select-none"
            draggable={false}
            decoding="async"
            onError={() => setHomeFormBgOk(false)}
            aria-hidden
          />
        ) : null}
        <div
          className={
            homeFormBgOk
              ? "absolute inset-0 z-10 flex min-h-0 flex-col overflow-y-auto overscroll-y-contain px-5 pb-6 pt-[44px]"
              : "relative z-10"
          }
        >
        <section className="mb-5" aria-labelledby="activity-heading">
          <p
            id="activity-heading"
            className={`font-handjet mb-2 text-[16px] font-semibold uppercase tracking-[0.12em] ${homeFormSectionHeadingText}`}
          >
            {t.home.activityTitle}
          </p>
          <div
            className="grid h-fit w-full auto-rows-min grid-cols-3 gap-2"
            role="group"
            aria-labelledby="activity-heading"
          >
            {activityGrid.map((item) => (
              <ActivityChip
                key={item.value}
                active={occasions.includes(item.value)}
                disabled={occasions.length >= 3 && !occasions.includes(item.value)}
                label={labelForActivity(item.labelKey)}
                onClick={() => toggleOccasion(item.value)}
              />
            ))}
          </div>
        </section>

        <section className="mb-[30px]">
          <label
            htmlFor="city"
            className={`font-handjet mb-2 block text-[16px] font-semibold uppercase tracking-[0.12em] ${homeFormSectionHeadingText}`}
          >
            {t.home.cityLabel}
          </label>
          <CityCombobox
            id="city"
            value={city}
            onChange={(v) => {
              clearCityFieldError();
              setCity(v);
            }}
            placeholder={t.home.cityPlaceholder}
            inputClassName={`${darkInput} ${invalidCity ? inputErrorRing : ""}`}
            listClassName={darkList}
            itemClassName={darkItem}
            ariaLabel={t.home.cityLabel}
            ariaInvalid={invalidCity}
          />
        </section>

        <section className="mb-5" aria-labelledby="birthday-heading">
          <label
            id="birthday-heading"
            htmlFor="birthday"
            className={`font-handjet mb-2 block text-[16px] font-semibold uppercase tracking-[0.12em] ${homeFormSectionHeadingText}`}
          >
            {t.home.birthdayLabel}
          </label>
          <input
            id="birthday"
            type="text"
            name="birthday"
            inputMode="text"
            autoComplete="bday"
            value={birthdayInput}
            onChange={(e) => {
              clearBirthdayFieldError();
              setBirthdayInput(formatBirthdayInputMask(e.target.value));
            }}
            placeholder={t.home.birthdayPlaceholder}
            className={`${darkInput} ${invalidBirthday ? inputErrorRing : ""}`}
            aria-invalid={invalidBirthday}
            aria-label={t.home.birthdayLabel}
          />
        </section>

        <section className="mb-9" aria-labelledby="gender-heading">
          <p
            id="gender-heading"
            className={`font-handjet mb-2 text-[16px] font-semibold uppercase tracking-[0.12em] ${homeFormSectionHeadingText}`}
          >
            {t.home.genderLabel}
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.home.genderLabel}>
            {genderKeys.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={gender === opt.value}
                onClick={() => setGender(opt.value)}
                className={`font-geist flex h-9 items-center justify-center rounded-[12px] px-4 text-center text-[11px] font-medium leading-none tracking-wide transition ${homeFormFocusOutline} ${
                  gender === opt.value
                    ? homeFormToggleActive
                    : homeFormToggleIdle
                }`}
              >
                {t.home.gender[opt.key]}
              </button>
            ))}
          </div>
        </section>

        <div className="relative mx-auto w-full max-w-[260px]">
          {(validationMessages.length > 0 || submitError) ? (
            <div
              className="absolute bottom-[calc(100%+6px)] left-0 right-0 z-10 text-center"
              role="alert"
            >
              <div className="space-y-1.5">
                {validationMessages.map((msg, i) => (
                  <p key={`val-${i}`} className={`text-xs leading-relaxed ${homeFormSectionHeadingText}`}>
                    {msg}
                  </p>
                ))}
                {submitError ? (
                  <p className={`text-xs leading-relaxed ${homeFormSectionHeadingText}`}>{submitError}</p>
                ) : null}
              </div>
            </div>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            aria-busy={busy}
            className={`flex h-12 w-full items-center justify-center rounded-[12px] border border-white/40 bg-[#bfafb4] px-4 text-center shadow-sm transition hover:border-[#9d7278]/55 hover:bg-[#c49a9e] disabled:opacity-60 ${homeFormFocusOutline}`}
          >
            <span className="font-handjet text-2xl font-medium leading-none text-[#1f1e1d]">
              {busy ? t.home.submitBusy : t.home.submit}
            </span>
          </button>
        </div>
        </div>
      </form>
      </div>
    </div>
  );
}

function ActivityChip({
  active,
  disabled,
  label,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`font-geist flex h-9 min-w-0 w-full items-center justify-center rounded-[12px] px-4 text-center text-[11px] font-medium leading-none tracking-wide transition ${homeFormFocusOutline} ${
        disabled
          ? homeFormToggleDisabled
          : active
            ? homeFormToggleActive
            : homeFormToggleIdle
      }`}
    >
      {label}
    </button>
  );
}
