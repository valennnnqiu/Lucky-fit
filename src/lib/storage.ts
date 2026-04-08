import { normalizeGender } from "@/lib/gender";
import type { Occasion, OutfitRecommendation, UserProfile, WeatherSnapshot } from "./types";

const PROFILE_KEY = "ootd-oracle-profile";
const WEATHER_KEY = "ootd-oracle-weather";
const OCCASION_KEY = "ootd-oracle-occasion";
const OUTFIT_KEY = "ootd-oracle-outfit";
/** Last `roll` passed to `generateOutfit` for the saved outfit (0 = first run from home). */
const OUTFIT_ROLL_KEY = "ootd-oracle-outfit-roll";

const VALID_OCCASION = new Set<string>([
  "meeting",
  "office",
  "coffee",
  "networking",
  "party",
  "gym",
  "brunch",
  "casual-day",
  "rave",
  "school",
]);

function isOccasion(v: string): v is Occasion {
  return VALID_OCCASION.has(v);
}

function normalizeOccasionList(raw: unknown): Occasion[] {
  if (!Array.isArray(raw)) return [];
  const out: Occasion[] = [];
  for (const x of raw) {
    if (typeof x === "string" && isOccasion(x) && !out.includes(x)) out.push(x);
    if (out.length >= 3) break;
  }
  return out;
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getProfile(): UserProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  const p = JSON.parse(raw) as UserProfile;
  return {
    ...p,
    gender: normalizeGender(p.gender),
  };
}

export function saveWeather(weather: WeatherSnapshot): void {
  localStorage.setItem(WEATHER_KEY, JSON.stringify(weather));
}

export function getWeather(): WeatherSnapshot | null {
  const raw = localStorage.getItem(WEATHER_KEY);
  return raw ? (JSON.parse(raw) as WeatherSnapshot) : null;
}

const MAX_OCCASIONS = 3;

export function saveOccasions(occasions: Occasion[]): void {
  const next = normalizeOccasionList(occasions).slice(0, MAX_OCCASIONS);
  localStorage.setItem(OCCASION_KEY, JSON.stringify(next));
}

export function getOccasions(): Occasion[] {
  const raw = localStorage.getItem(OCCASION_KEY);
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      return normalizeOccasionList(JSON.parse(raw) as unknown);
    } catch {
      return [];
    }
  }
  return isOccasion(raw) ? [raw] : [];
}

export function saveOutfit(outfit: OutfitRecommendation): void {
  localStorage.setItem(OUTFIT_KEY, JSON.stringify(outfit));
}

export function getOutfit(): OutfitRecommendation | null {
  const raw = localStorage.getItem(OUTFIT_KEY);
  return raw ? (JSON.parse(raw) as OutfitRecommendation) : null;
}

export function saveOutfitRoll(roll: number): void {
  if (!Number.isFinite(roll) || roll < 0) {
    localStorage.removeItem(OUTFIT_ROLL_KEY);
    return;
  }
  localStorage.setItem(OUTFIT_ROLL_KEY, String(Math.floor(roll)));
}

export function getOutfitRoll(): number {
  const raw = localStorage.getItem(OUTFIT_ROLL_KEY);
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
