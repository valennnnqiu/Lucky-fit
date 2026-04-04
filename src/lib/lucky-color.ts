const zodiacHueAnchor: Record<string, number> = {
  aries: 18,
  taurus: 95,
  gemini: 52,
  cancer: 208,
  leo: 38,
  virgo: 98,
  libra: 328,
  scorpio: 278,
  sagittarius: 28,
  capricorn: 218,
  aquarius: 198,
  pisces: 242,
};

/** Parse `YYYY-MM-DD` as calendar date — avoids UTC shift from `new Date(...)`. */
function parseBirthdayParts(dateString: string): { month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString.trim());
  if (!m) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

function getZodiacFromBirthday(dateString: string): keyof typeof zodiacHueAnchor {
  const parts = parseBirthdayParts(dateString);
  if (!parts) return "pisces";
  const { month, day } = parts;

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return "gemini";
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return "cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return "libra";
  if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return "scorpio";
  if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return "sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "aquarius";
  return "pisces";
}

function hashToUint32(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const light = Math.max(0, Math.min(100, l)) / 100;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    const col = light - a * Math.max(-1, Math.min(Math.min(k - 3, 9 - k), 1));
    return Math.round(255 * col);
  };
  const r = f(0);
  const g = f(8);
  const b = f(4);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Deterministic lucky color for `birthday` (YYYY-MM-DD) on a **local** calendar day.
 * Uses HSL with high entropy from birthday + date so the same person rarely repeats
 * the exact same hex across many days (hue, saturation, and lightness all vary).
 * `variant` picks an independent second (or third) color for the same day when needed.
 */
export function getLuckyColorFromBirthday(
  birthday: string,
  forDate: Date = new Date(),
  variant: number = 0,
): string {
  const zodiac = getZodiacFromBirthday(birthday);
  const anchor = zodiacHueAnchor[zodiac] ?? 210;
  const dateKey = localDateKey(forDate);
  const v = variant > 0 ? `|${variant}` : "";
  const s1 = hashToUint32(`${birthday}|${dateKey}${v}`);
  const s2 = hashToUint32(`${dateKey}|${birthday}|ootd-lucky${v}`);
  const hue = (anchor * 5 + s1 + (s2 % 997) * 37) % 360;
  const sat = 58 + ((s1 >>> 8) % 32);
  const light = 46 + ((s2 >>> 10) % 20);
  return hslToHex(hue, sat, light);
}

/** Two distinct lucky colors for the ticket / share card (same day + birthday). */
export function getLuckyColorsFromBirthday(
  birthday: string,
  forDate: Date = new Date(),
): readonly [string, string] {
  const a = getLuckyColorFromBirthday(birthday, forDate, 0);
  let b = getLuckyColorFromBirthday(birthday, forDate, 1);
  if (b === a) b = getLuckyColorFromBirthday(birthday, forDate, 2);
  return [a, b];
}

/** Hue 0–360 from `#RRGGBB` for display bucketing. */
export function hexToHue(hex: string): number {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return 0;
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d < 1e-6) return 0;
  let hue = 0;
  if (max === r) hue = (((g - b) / d) % 6) * 60;
  else if (max === g) hue = ((b - r) / d + 2) * 60;
  else hue = ((r - g) / d + 4) * 60;
  return (hue + 360) % 360;
}

/**
 * Hue bucket id `b0`…`b11` (12 × 30° bins); map to labels in UI if needed.
 * Hue is nudged before binning so chartreuse / lime (~105–125°) maps to yellow-green
 * labels: saturated greens in that range were ending in the “Yellow” bin (90–120°)
 * and read as a mismatch next to the swatch.
 */
export function luckyColorHueBucketKey(hex: string): string {
  const hue = hexToHue(hex);
  const bucket = Math.min(11, Math.floor((hue + 15) / 30));
  return `b${bucket}`;
}
