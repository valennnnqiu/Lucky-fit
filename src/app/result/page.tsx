"use client";

import Link from "next/link";
import { toPng } from "html-to-image";
import html2canvas from "html2canvas";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BrandLogoMark } from "@/components/brand-logo";
import { WeatherIcon } from "@/components/weather-icon";
import { getLuckyColorsFromBirthday } from "@/lib/lucky-color";
import { occasionsMoodLabel } from "@/lib/occasion-labels";
import { interpolate, strings } from "@/lib/strings";
import {
  SHARE_CARD_OUTFIT_ROWS_MIN_HEIGHT_PX,
  TICKET_CARD_DISPLAY_PX,
  TICKET_OVERLAY_INNER_PX,
} from "@/lib/page-layout";
import { garmentIdToImageBasename, hasGarmentImage } from "@/lib/garment-catalog";
import { generateOutfit } from "@/lib/outfit-engine";
import { prepareImagesForHtmlToImageCapture } from "@/lib/share-card-capture";
import {
  getOccasions,
  getOutfit,
  getOutfitRoll,
  getProfile,
  getWeather,
  saveOutfit,
  saveOutfitRoll,
  saveWeather,
} from "@/lib/storage";
import type { Occasion, OutfitRecommendation, UserProfile, WeatherSnapshot } from "@/lib/types";
import { fetchWeatherByCity } from "@/lib/weather";

/**
 * Machine frame art in `public/result/ticket-machine.png`.
 * Bump `TICKET_MACHINE_CACHE_KEY` after replacing the file to avoid browser / dev cache showing the old PNG.
 * Keep `TICKET_MACHINE_INTRINSIC` in sync with the PNG pixel size so the card height matches the art (no extra red band).
 * While the PNG loads successfully the frame stays `bg-transparent` so we don’t paint an extra solid behind transparent pixels.
 */
const TICKET_MACHINE_SRC = "/result/ticket-machine.png";
const TICKET_MACHINE_CACHE_KEY = "2";
const TICKET_MACHINE_INTRINSIC = { w: 1476, h: 2924 } as const;

/** Garment thumbs in `public/result/garment-slots/` — see `NAMING.txt` there. */
const GARMENT_SLOT_BASE = "/result/garment-slots";

/** Weather / stay-informed cards: solid white on #f3f5f6; width matches `#share-card` ticket art (`TICKET_CARD_DISPLAY_PX`). */
const resultGlassSection =
  "rounded-xl border border-[rgba(209,209,209,1)] bg-white px-4 py-3 shadow-[0_4px_24px_-8px_rgba(80,80,77,0.1)]";

const resultGlassSectionWidth = {
  width: TICKET_CARD_DISPLAY_PX,
  minWidth: TICKET_CARD_DISPLAY_PX,
} as const;

function display(value: string | undefined): string {
  if (!value) return "—";
  return value.replace("-", " ");
}

/** Local calendar date when the page is viewed (YYYY.MM.DD). */
function formatTodayDot(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function capWords(s: string): string {
  if (!s) return "";
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Weather-generated garment copy: hyphen → space, then title-case each word (per piece). */
function titleGarmentPiece(raw: string | undefined): string {
  const d = display(raw);
  if (d === "—") return d;
  return capWords(d);
}

/** Same as `titleGarmentPiece` for a value that may list several pieces separated by · */
function titleGarmentPhrase(raw: string): string {
  const parts = raw.split(/\s*·\s*/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return "—";
  return parts.map((p) => capWords(display(p))).join(" · ");
}

function topGarmentIds(o: OutfitRecommendation): string[] {
  const onePiece = o.onePiece === true;
  const ids: string[] = [o.topLayers.base];
  if (!onePiece && o.topLayers.mid) ids.push(o.topLayers.mid);
  if (o.topLayers.outer) ids.push(o.topLayers.outer);
  return ids.filter(hasGarmentImage).slice(0, 4);
}

function bottomGarmentIds(o: OutfitRecommendation): string[] {
  if (o.onePiece === true) return [];
  const parts = o.bottom.split(/\s*·\s*/).map((s) => s.trim()).filter(Boolean);
  return parts.filter(hasGarmentImage).slice(0, 4);
}

function shoeGarmentIds(o: OutfitRecommendation): string[] {
  const parts = o.shoes.split(/\s*·\s*/).map((s) => s.trim()).filter(Boolean);
  const raw = (parts.length > 0 ? parts : [o.shoes.trim() || "sneakers"]).slice(0, 4);
  return raw.filter(hasGarmentImage);
}

function waitForShareCardImages(root: HTMLElement, timeoutMs: number): Promise<void> {
  const imgs = [...root.querySelectorAll("img")] as HTMLImageElement[];
  const all = Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }),
    ),
  ).then(() => {});
  return Promise.race([
    all,
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    }),
  ]);
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error("timeout")), ms);
    }),
  ]);
}

/** Avoid iOS/WebKit canvas limits and long hangs from extremely tall `html2canvas` output. */
function capHtml2CanvasScale(el: HTMLElement, scale: number, coarsePointer: boolean): number {
  const w = Math.max(1, el.offsetWidth);
  const h = Math.max(1, Math.max(el.scrollHeight, el.offsetHeight));
  const maxSide = coarsePointer ? 2800 : 5600;
  return Math.min(scale, maxSide / w, maxSide / h, coarsePointer ? 2.75 : 8);
}

const SHARE_EXPORT_FILENAME = "luckyfit.png";

function isWeChatInApp(): boolean {
  return typeof navigator !== "undefined" && /MicroMessenger/i.test(navigator.userAgent);
}

/**
 * Use an in-page preview + long-press / manual link instead of a synthetic `<a download>` click
 * (ignored on many mobile WebViews, including iOS Safari and WeChat).
 */
function shouldUseMobileSaveSheet(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/MicroMessenger/i.test(ua)) return true;
  if (/Android/i.test(ua)) return true;
  if (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches) {
    return true;
  }
  return (
    /iP(hone|ad|od)/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      if (typeof fr.result === "string") resolve(fr.result);
      else reject(new Error("data-url"));
    };
    fr.onerror = () => reject(fr.error ?? new Error("read"));
    fr.readAsDataURL(blob);
  });
}

/**
 * `.phone-canvas-scale` uses CSS transform: scale(&lt;1) so the card looks smaller than
 * layout size; html2canvas follows the *drawn* size unless we bump `scale` by this factor.
 */
function layoutScaleCompensation(el: HTMLElement): number {
  const rect = el.getBoundingClientRect();
  const ow = el.offsetWidth;
  const oh = Math.max(el.scrollHeight, el.offsetHeight);
  const cx = rect.width > 1 ? ow / rect.width : 1;
  const cy = rect.height > 1 ? oh / rect.height : 1;
  const c = Math.max(cx, cy);
  if (!Number.isFinite(c) || c < 1 || c > 6) return 1;
  return c;
}

function blobFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b && b.size > 0) resolve(b);
        else reject(new Error("empty canvas blob"));
      },
      "image/png",
      1,
    );
  });
}

export default function ResultPage() {
  const t = strings.result;
  const footer = strings.footer;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [outfit, setOutfit] = useState<OutfitRecommendation | null>(null);
  const [occasions, setOccasions] = useState<Occasion[]>(["office"]);
  const [isSharing, setIsSharing] = useState(false);
  const [isTryAgain, setIsTryAgain] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [saveImagePreviewSrc, setSaveImagePreviewSrc] = useState<string | null>(null);
  const [ticketMachineOk, setTicketMachineOk] = useState(true);

  useEffect(() => {
    setProfile(getProfile());
    setWeather(getWeather());
    setOutfit(getOutfit());
    const o = getOccasions();
    setOccasions(o.length > 0 ? o : ["office"]);
  }, []);

  const mood = useMemo(() => occasionsMoodLabel(occasions), [occasions]);

  async function handleShareImage() {
    const node = document.getElementById("share-card");
    if (!node) return;
    setShareFeedback(null);
    setSaveImagePreviewSrc(null);
    setIsSharing(true);
    const filename = SHARE_EXPORT_FILENAME;
    const coarsePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    const inWeChat = isWeChatInApp();
    /** `html2canvas` often stalls on mobile WebKit; lower `pixelRatio` reduces memory pressure. */
    const pixelRatio = coarsePointer ? (inWeChat ? 1.5 : 2) : 3;
    const captureMs = coarsePointer ? 28_000 : 42_000;
    /** Restore raster swaps on the real card — off-screen clones often report 0×0 layout → blank PNG. */
    let restoreRaster: (() => void) | undefined;
    try {
      await document.fonts?.ready?.catch(() => {});

      await waitForShareCardImages(node, 12_000);
      restoreRaster = await prepareImagesForHtmlToImageCapture(node, pixelRatio);
      void node.offsetHeight;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );

      const el = node as HTMLElement;
      const compensation = layoutScaleCompensation(el);
      const rawScale = pixelRatio * compensation;
      const html2canvasScale = capHtml2CanvasScale(
        el,
        coarsePointer ? Math.min(rawScale, 3) : Math.min(rawScale, 9),
        coarsePointer,
      );

      async function blobFromToPng(): Promise<Blob> {
        const dataUrl = await toPng(el, {
          pixelRatio,
          cacheBust: true,
          backgroundColor: "#f3f5f6",
        });
        const blob = await (await fetch(dataUrl)).blob();
        return blob.type === "image/png" ? blob : new Blob([blob], { type: "image/png" });
      }

      async function blobFromHtml2Canvas(): Promise<Blob> {
        const canvas = await html2canvas(el, {
          scale: html2canvasScale,
          useCORS: true,
          allowTaint: false,
          foreignObjectRendering: false,
          backgroundColor: "#f3f5f6",
          logging: false,
        });
        return blobFromCanvas(canvas);
      }

      let png: Blob;
      try {
        /**
         * Always prefer `html2canvas` after raster swaps: on iOS, `toPng` clones `<canvas>` via
         * `toDataURL()`, which is empty for tainted canvases (often breaking when not — see
         * share-card-capture). `html2canvas` paints live canvas pixels reliably.
         */
        try {
          png = await withTimeout(blobFromHtml2Canvas(), captureMs);
        } catch {
          png = await withTimeout(blobFromToPng(), captureMs);
        }
        if (!png || png.size < 1) {
          throw new Error("empty png");
        }
      } catch {
        setShareFeedback(t.sharePicCaptureFailed);
        return;
      }

      const file = new File([png], filename, { type: "image/png" });
      const nav = typeof navigator !== "undefined" ? navigator : undefined;

      let shareAttemptFailed = false;

      // 1) Web Share with file — iOS often reports canShare false even when share(files) works.
      const sharePayload = {
        files: [file],
        title: t.sharePicTitle,
        text: t.sharePicText,
      };
      let tryFileShare = false;
      if (file.size > 0 && nav?.share) {
        if (typeof nav.canShare === "function") {
          try {
            tryFileShare = nav.canShare(sharePayload);
          } catch {
            tryFileShare = coarsePointer;
          }
        } else {
          tryFileShare = coarsePointer;
        }
        if (!tryFileShare && coarsePointer) tryFileShare = true;
      }
      if (tryFileShare && nav?.share) {
        try {
          await withTimeout(nav.share(sharePayload), 90_000);
          return;
        } catch (e) {
          const name = e instanceof Error ? e.name : "";
          if (name !== "AbortError") shareAttemptFailed = true;
          /* User dismissed the share sheet — still offer clipboard / mobile save fallback below. */
        }
      }

      // 2) Copy image — usually blocked or misleading inside WeChat’s WebView; skip there.
      if (!inWeChat) {
        try {
          if (nav?.clipboard?.write && typeof ClipboardItem !== "undefined") {
            await nav.clipboard.write([
              new ClipboardItem({
                "image/png": png,
              }),
            ]);
            setShareFeedback(t.sharePicCopiedHint);
            window.setTimeout(() => setShareFeedback(null), 5000);
            return;
          }
        } catch {
          /* fall through to file download */
        }
      }

      // 3) Save file — last resort when share + clipboard aren’t available.
      if (shouldUseMobileSaveSheet()) {
        try {
          const dataUrl = await blobToDataUrl(png);
          setSaveImagePreviewSrc(dataUrl);
          setShareFeedback(
            shareAttemptFailed ? `${t.sharePicShareFailed} ${t.saveImageMobileHint}` : t.saveImageMobileHint,
          );
          window.setTimeout(() => setShareFeedback(null), 14_000);
        } catch {
          setShareFeedback(t.sharePicCaptureFailed);
        }
        return;
      }

      const url = URL.createObjectURL(png);
      if (shareAttemptFailed) {
        setShareFeedback(t.sharePicShareFailed);
        window.setTimeout(() => setShareFeedback(null), 7000);
      }

      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
    } finally {
      restoreRaster?.();
      setIsSharing(false);
    }
  }

  async function handleTryAgain() {
    if (!profile || !weather) return;
    setIsTryAgain(true);
    try {
      const nextRoll = getOutfitRoll() + 1;
      let w: WeatherSnapshot = weather;
      try {
        const fresh = await fetchWeatherByCity(profile.city.trim());
        w = fresh;
        saveWeather(fresh);
        setWeather(fresh);
      } catch {
        /* keep cached snapshot; outfit still respects last known weather */
      }
      const next = generateOutfit(w, occasions, profile.luckyColor, profile.gender, nextRoll);
      setOutfit(next);
      saveOutfit(next);
      saveOutfitRoll(nextRoll);
    } finally {
      setIsTryAgain(false);
    }
  }

  const shell = "min-h-0 w-full bg-transparent pb-10 pt-4 text-[#50504d] lg:pb-12";

  if (!profile || !weather || !outfit) {
    return (
      <div className="phone-canvas-stage">
        <div className="phone-canvas-scale phone-canvas-scale--result">
          <div className={shell}>
            <div className="py-12 text-center">
              <p className="text-sm text-[#50504d]/70">{t.missing}</p>
              <Link
                href="/"
                className="mt-4 inline-flex h-9 items-center justify-center rounded-full border border-[#40403d]/22 bg-[#4a4846] px-6 text-sm font-semibold leading-none text-[#f7f6f5] shadow-sm hover:bg-[#3f3d3b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c49a9e]"
              >
                {t.backHome}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hiLo =
    weather.tempMin !== undefined && weather.tempMax !== undefined
      ? interpolate(t.hiLo, { high: weather.tempMax, low: weather.tempMin })
      : t.hiLoUnknown;

  const topLine = [
    titleGarmentPiece(outfit.topLayers.base),
    outfit.topLayers.mid ? titleGarmentPiece(outfit.topLayers.mid) : null,
    outfit.topLayers.outer ? titleGarmentPiece(outfit.topLayers.outer) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const desc = capWords(weather.description);

  const luckyColorsToday = getLuckyColorsFromBirthday(profile.birthday);

  function dismissSaveImageSheet() {
    setSaveImagePreviewSrc(null);
  }

  return (
    <>
    <div className="phone-canvas-stage">
      <div className="phone-canvas-scale phone-canvas-scale--result">
        <div className={shell}>
          <div className="flex w-full flex-col gap-3">
        {/* Weather card */}
        <section
          className={`${resultGlassSection} mx-auto flex shrink-0 items-start justify-between gap-3`}
          style={resultGlassSectionWidth}
          aria-label={weather.city}
        >
          <div className="flex min-w-0 flex-col gap-2 text-[#50504d]">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-normal leading-normal text-[#50504d]/90">{weather.city}</p>
              <p className="text-2xl font-semibold tabular-nums leading-normal text-[#50504d]">
                {weather.temp}°
              </p>
              <p className="text-xs font-normal leading-normal text-[#50504d]/90">
                {t.weatherFeels}: {weather.feelsLike}°
              </p>
            </div>
            <p className="text-xs font-normal leading-normal whitespace-pre-wrap text-[#50504d]/90">{hiLo}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-3">
            <p className="font-geist text-right text-[20px] leading-normal whitespace-nowrap text-[#50504d]">
              {desc}
            </p>
            <WeatherIcon weather={weather} className="size-[50px] object-contain" />
          </div>
        </section>

        {/* Stay informed — only when weather/travel reminders exist */}
        {outfit.reminder.length > 0 ? (
          <section
            className={`${resultGlassSection} mx-auto flex shrink-0 items-start gap-3`}
            style={resultGlassSectionWidth}
            aria-labelledby="result-stay-heading"
          >
            <img
              src="/result/stay-informed/icon.png"
              alt=""
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-[30px] object-contain"
              loading="lazy"
              decoding="async"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p
                id="result-stay-heading"
                className="font-sans text-sm leading-normal text-[#50504d]"
              >
                {t.stayInformed}
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-[18px] text-xs font-normal leading-normal text-[#50504d]/90">
                {outfit.reminder.map((line) => (
                  <li key={line}>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {/* Ticket / dispenser — PNG keeps full height at display width (no object-cover crop). */}
        <div className="flex w-full justify-center">
          <div
            className="mt-1 flex shrink-0 flex-col items-center gap-3"
            style={{ width: TICKET_CARD_DISPLAY_PX }}
          >
          {/* #share-card = export root: ticket PNG + overlay (date, logo, mood, rows, thumbs, made-by). */}
          <div
            id="share-card"
            className={`relative shrink-0 overflow-hidden rounded-none ${
              ticketMachineOk
                ? "bg-transparent"
                : "bg-gradient-to-b from-[#9c3b2e] via-[#8f362b] to-[#6d2a22]"
            }`}
            style={{
              width: TICKET_CARD_DISPLAY_PX,
              ...(!ticketMachineOk && {
                aspectRatio: `${TICKET_MACHINE_INTRINSIC.w} / ${TICKET_MACHINE_INTRINSIC.h}`,
              }),
            }}
          >
            {ticketMachineOk ? (
              <img
                src={`${TICKET_MACHINE_SRC}?v=${TICKET_MACHINE_CACHE_KEY}`}
                alt=""
                width={TICKET_MACHINE_INTRINSIC.w}
                height={TICKET_MACHINE_INTRINSIC.h}
                data-share-ticket=""
                className="pointer-events-none relative z-0 block h-auto w-full max-w-full select-none"
                draggable={false}
                onError={() => setTicketMachineOk(false)}
              />
            ) : null}
            {ticketMachineOk ? (
              <>
            <div className="absolute inset-0 z-[2] flex min-h-0 flex-col rounded-none p-2">
            <div
              className="relative mx-auto mt-[24px] rounded-none bg-transparent px-2 pb-8 pt-3 shadow-inner"
              style={{ width: TICKET_OVERLAY_INNER_PX, maxWidth: TICKET_OVERLAY_INNER_PX }}
            >
              <div className="-mt-[10px] box-content flex w-full items-center justify-between gap-4 py-2 px-0">
                <div className="h-fit w-[200px] shrink-0 rounded-lg border border-solid border-[#d1d1d1] bg-[#bfafb4] py-1 pl-3.5 pr-5">
                  <p className="font-handjet text-base leading-normal font-medium text-[#2e302d]">
                    {formatTodayDot()}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <p className="font-handjet text-base leading-normal font-medium text-[#2e302d]">
                      {t.luckyColor}:
                    </p>
                    <div className="flex flex-wrap items-center gap-1">
                      {luckyColorsToday.map((hex) => (
                        <span
                          key={hex}
                          className="size-4 shrink-0 rounded-[10px] border border-[#2e302d]/25"
                          style={{ backgroundColor: hex }}
                          aria-hidden
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-center">
                  <BrandLogoMark variant="shareCard" alt={t.luckyFitBadge} />
                </div>
              </div>

              <div className="mx-auto mt-[30px] flex w-full max-w-[270px] flex-col items-center gap-4 px-1 pt-2">
                <p className="font-give-glory text-center text-2xl leading-normal text-[#d1a8a9]">
                  {mood}
                </p>

                <div className="flex w-full flex-col items-center gap-3.5">
                  <div
                    className="flex w-full flex-col gap-3"
                    style={{ minHeight: SHARE_CARD_OUTFIT_ROWS_MIN_HEIGHT_PX }}
                  >
                    <OutfitRow
                      garmentIds={topGarmentIds(outfit)}
                      label={
                        <span className="font-handjet text-[15px] font-medium text-[#2e302d]">
                          {outfit.onePiece === true ? t.slotOnePiece : t.slotTop}: {topLine}
                        </span>
                      }
                    />
                    {outfit.onePiece !== true ? (
                      <OutfitRow
                        garmentIds={bottomGarmentIds(outfit)}
                        label={
                          <span className="font-handjet text-[15px] font-medium text-[#2e302d]">
                            {t.slotBottom}: {titleGarmentPhrase(outfit.bottom)}
                          </span>
                        }
                      />
                    ) : null}
                    <OutfitRow
                      garmentIds={shoeGarmentIds(outfit)}
                      label={
                        <span className="font-handjet text-[15px] font-medium text-[#2e302d]">
                          {t.slotShoes}: {titleGarmentPhrase(outfit.shoes)}
                        </span>
                      }
                    />
                  </div>
                  <p className="mt-[26px] font-handjet w-full text-center text-[14px] font-normal text-[#2e302d]/85">
                    {interpolate(t.madeBy, { author: footer.authorName })}
                  </p>
                </div>
              </div>
            </div>
            </div>
              </>
            ) : null}
          </div>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[324px] flex-col gap-2">
          <div className="flex flex-row gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleTryAgain}
            disabled={isTryAgain || isSharing}
            aria-busy={isTryAgain}
            className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-[12px] border border-[#50504d]/22 bg-white px-2 text-center shadow-sm transition hover:border-[#9d7278]/45 hover:bg-[#faf9f8] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c49a9e] sm:px-3"
          >
            <span className="font-handjet text-lg font-medium leading-none text-[#1f1e1d] sm:text-2xl">
              {isTryAgain ? t.tryAgainBusy : t.tryAgainCta}
            </span>
          </button>
          <button
            type="button"
            onClick={handleShareImage}
            disabled={isSharing || isTryAgain}
            aria-busy={isSharing}
            className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-[12px] border border-white/40 bg-[#bfafb4] px-2 text-center shadow-sm transition hover:border-[#9d7278]/55 hover:bg-[#c49a9e] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c49a9e] sm:px-3"
          >
            <span className="font-handjet text-lg font-medium leading-none text-[#1f1e1d] sm:text-2xl">
              {isSharing ? t.downloadBusy : t.downloadCta}
            </span>
          </button>
          </div>
          {shareFeedback ? (
            <p className="text-center text-xs leading-snug text-[#50504d]/85" role="status">
              {shareFeedback}
            </p>
          ) : null}
        </div>
          </div>
        </div>
      </div>
    </div>

    {saveImagePreviewSrc ? (
      <div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-end gap-3 bg-black/65 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-image-sheet-title"
      >
        <div className="flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-3 overflow-hidden min-h-0">
          {isWeChatInApp() ? (
            <p className="max-w-[min(100%,24rem)] text-center text-xs leading-snug text-white/90">
              {t.saveImageWeChatHint}
            </p>
          ) : null}
          <p
            id="save-image-sheet-title"
            className="max-w-[min(100%,24rem)] text-center text-sm leading-snug text-white/95"
          >
            {t.saveImageMobileHint}
          </p>
          {/* data: URL — WeChat / Android WebView often won’t display blob: in <img> */}
          {/* eslint-disable-next-line @next/next/no-img-element — export preview for long-press save */}
          <img
            src={saveImagePreviewSrc}
            alt=""
            className="max-h-[min(72dvh,520px)] w-auto max-w-full shrink object-contain shadow-lg"
          />
        </div>
        <a
          href={saveImagePreviewSrc}
          download={SHARE_EXPORT_FILENAME}
          className="flex h-11 w-full max-w-xs shrink-0 items-center justify-center rounded-xl bg-[#bfafb4] px-4 text-center font-handjet text-lg font-medium text-[#1f1e1d] shadow-md no-underline"
        >
          {t.saveImageDownloadLink}
        </a>
        <button
          type="button"
          onClick={dismissSaveImageSheet}
          className="h-11 w-full max-w-xs shrink-0 rounded-xl bg-white px-4 text-center font-handjet text-lg font-medium text-[#1f1e1d] shadow-md"
        >
          {t.saveImageSheetClose}
        </button>
      </div>
    ) : null}
    </>
  );
}

function GarmentSlotThumb({ garmentId }: { garmentId: string }) {
  const src = `${GARMENT_SLOT_BASE}/${garmentIdToImageBasename(garmentId)}.png`;
  const [broken, setBroken] = useState(false);

  if (broken) return null;

  return (
    <img
      src={src}
      alt=""
      width={60}
      height={60}
      data-share-inline=""
      className="size-[60px] shrink-0 rounded-none object-cover"
      draggable={false}
      onError={() => setBroken(true)}
    />
  );
}

function OutfitRow({
  garmentIds,
  label,
}: {
  garmentIds: string[];
  label: ReactNode;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-2.5 overflow-hidden rounded-[16px] border border-dashed border-[#d1a8a9] px-1.5 py-2.5">
      <div className="flex w-full min-w-0 flex-wrap justify-center gap-[6px]">
        {garmentIds.map((id, i) => (
          <GarmentSlotThumb key={`${i}-${garmentIdToImageBasename(id)}`} garmentId={id} />
        ))}
      </div>
      <div className="w-full min-w-0 text-center">{label}</div>
    </div>
  );
}
