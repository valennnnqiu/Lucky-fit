import type { GeoCitySuggestion } from "@/lib/types";

function countryCodeDisplay(country: string): string {
  return country.trim().toUpperCase();
}

export function formatCityQuery(c: GeoCitySuggestion): string {
  return `${c.name}, ${countryCodeDisplay(c.country)}`;
}

export function formatCityLabel(c: GeoCitySuggestion): string {
  return `${c.name}, ${countryCodeDisplay(c.country)}`;
}

function isLikelyDistrictName(name: string): boolean {
  const n = name.trim();
  if (!n) return true;
  if (/区/.test(n)) return true;
  if (/district$/i.test(n)) return true;
  return false;
}

/** Drop district-level hits, order best city match first, then dedupe. */
export function filterGeoSuggestionsForCityLevel(
  items: GeoCitySuggestion[],
  query: string
): GeoCitySuggestion[] {
  const filtered = items.filter((item) => !isLikelyDistrictName(item.name));
  const q = query.trim().toLowerCase();
  const ranked = [...filtered].sort((a, b) => {
    const score = (name: string) => {
      const n = name.toLowerCase();
      if (!q) return 0;
      if (n === q) return 4;
      if (n.startsWith(q)) return 3;
      if (n.includes(q)) return 2;
      return 1;
    };
    return score(b.name) - score(a.name);
  });
  const seen = new Set<string>();
  const out: GeoCitySuggestion[] = [];
  for (const item of ranked) {
    const key = `${item.name}|${item.country}|${item.state ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export async function fetchCitySuggestions(query: string): Promise<GeoCitySuggestion[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  const res = await fetch(`/api/geo?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data as GeoCitySuggestion[];
}
