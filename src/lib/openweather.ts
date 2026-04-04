import type { WeatherCondition, WeatherSnapshot } from "./types";

export function mapCondition(main: string): WeatherCondition {
  const key = main.toLowerCase();
  if (key.includes("clear")) return "clear";
  if (key.includes("cloud")) return "clouds";
  if (key.includes("rain") || key.includes("drizzle") || key.includes("thunder"))
    return "rain";
  if (key.includes("snow")) return "snow";
  return "other";
}

/** Precipitation rate in mm/h (OpenWeather may return 1h or 3h totals). */
export function extractPrecipitationMmPerH(data: {
  rain?: Record<string, number>;
  snow?: Record<string, number>;
}): number {
  const rain1h = Number(data.rain?.["1h"] ?? 0);
  const snow1h = Number(data.snow?.["1h"] ?? 0);
  const rain3h = Number(data.rain?.["3h"] ?? 0);
  const snow3h = Number(data.snow?.["3h"] ?? 0);
  if (rain1h > 0 || snow1h > 0) return rain1h + snow1h;
  if (rain3h > 0 || snow3h > 0) return (rain3h + snow3h) / 3;
  return 0;
}

export type OpenWeatherPayload = {
  name?: string;
  main?: {
    temp?: number;
    feels_like?: number;
    temp_min?: number;
    temp_max?: number;
  };
  weather?: Array<{ main?: string; description?: string }>;
  rain?: Record<string, number>;
  snow?: Record<string, number>;
};

export function snapshotFromOpenWeatherPayload(
  fallbackCity: string,
  data: OpenWeatherPayload
): WeatherSnapshot {
  const weatherMain = data.weather?.[0]?.main ?? "Other";
  const description = data.weather?.[0]?.description ?? "";
  const tMin = data.main?.temp_min;
  const tMax = data.main?.temp_max;
  return {
    city: data.name ?? fallbackCity,
    temp: Math.round(data.main?.temp ?? 0),
    feelsLike: Math.round(data.main?.feels_like ?? 0),
    tempMin: tMin !== undefined ? Math.round(tMin) : undefined,
    tempMax: tMax !== undefined ? Math.round(tMax) : undefined,
    precipitation: extractPrecipitationMmPerH(data),
    condition: mapCondition(weatherMain),
    description,
  };
}
