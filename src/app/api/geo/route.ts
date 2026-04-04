import { NextResponse } from "next/server";
import { filterGeoSuggestionsForCityLevel } from "@/lib/geo";
import type { GeoCitySuggestion } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json([] as GeoCitySuggestion[]);
  }

  const apiKey = process.env.OPENWEATHER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "missing_api_key" }, { status: 503 });
  }

  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    q
  )}&limit=8&appid=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json([] as GeoCitySuggestion[]);
  }

  const data = (await res.json()) as GeoCitySuggestion[];
  const raw = Array.isArray(data) ? data : [];
  return NextResponse.json(filterGeoSuggestionsForCityLevel(raw, q));
}
