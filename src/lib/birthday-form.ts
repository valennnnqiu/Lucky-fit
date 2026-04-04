export type BirthdayErrorCode =
  | "year_invalid"
  | "month_invalid"
  | "day_invalid"
  | "date_invalid"
  | "format_invalid";

export type ParseBirthdayResult =
  | { ok: true; year: string; month: string; day: string }
  | { ok: false; code: "format_invalid" };

/** Normalize saved ISO `YYYY-MM-DD` for a single text field. */
export function formatBirthdayDisplayFromISO(iso: string): string {
  const parts = splitISODate(iso);
  if (!parts.year) return "";
  const m = String(parts.month).padStart(2, "0");
  const d = String(parts.day).padStart(2, "0");
  return `${parts.year}-${m}-${d}`;
}

/**
 * Single-line birthday field: keep only digits (max 8), insert `-` after year and month.
 * So `19981111` → `1998-11-11`; paste or typing both work.
 */
export function formatBirthdayInputMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

/**
 * Parse one field into Y/M/D for `buildBirthdayISO`.
 * Accepts `YYYY-MM-DD`, `YYYY/MM/DD`, `MM/DD/YYYY` (slash/dot/dash),
 * `YYYYMMDD` (8 digits), `YYYY年M月D日`, and ambiguous `d/m/y` when one part is clearly a month.
 */
export function parseBirthdayInput(raw: string): ParseBirthdayResult {
  const s = raw.trim();
  if (!s) {
    return { ok: true, year: "", month: "", day: "" };
  }

  if (/^\d{8}$/.test(s)) {
    return {
      ok: true,
      year: s.slice(0, 4),
      month: s.slice(4, 6),
      day: s.slice(6, 8),
    };
  }

  let m: RegExpExecArray | null;

  m = /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/.exec(s);
  if (m) {
    return { ok: true, year: m[1], month: m[2], day: m[3] };
  }

  m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) {
    return { ok: true, year: m[1], month: m[2], day: m[3] };
  }

  m = /^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/.exec(s);
  if (m) {
    return { ok: true, year: m[1], month: m[2], day: m[3] };
  }

  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a > 12) {
      return { ok: true, year: m[3], month: String(b), day: String(a) };
    }
    if (b > 12) {
      return { ok: true, year: m[3], month: String(a), day: String(b) };
    }
    return { ok: true, year: m[3], month: m[1], day: m[2] };
  }

  return { ok: false, code: "format_invalid" };
}

/** Build `YYYY-MM-DD` from hand-entered parts; validates real calendar date. */
export function buildBirthdayISO(
  yearStr: string,
  monthStr: string,
  dayStr: string
): { ok: true; iso: string } | { ok: false; code: BirthdayErrorCode } {
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!yearStr.trim() || !Number.isFinite(year) || !Number.isInteger(year) || year < 1900 || year > 2100) {
    return { ok: false, code: "year_invalid" };
  }
  if (!monthStr.trim() || !Number.isFinite(month) || month < 1 || month > 12) {
    return { ok: false, code: "month_invalid" };
  }
  if (!dayStr.trim() || !Number.isFinite(day) || day < 1 || day > 31) {
    return { ok: false, code: "day_invalid" };
  }

  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) {
    return { ok: false, code: "date_invalid" };
  }

  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { ok: true, iso };
}

export function splitISODate(iso: string): { year: string; month: string; day: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return { year: "", month: "", day: "" };
  return { year: m[1], month: String(Number(m[2])), day: String(Number(m[3])) };
}
