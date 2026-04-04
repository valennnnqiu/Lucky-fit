import type { WeatherSnapshot } from "./types";

function withOpenWeatherKeyHints(message: string): string {
  if (!/invalid api key/i.test(message)) return message;
  return `${message} 排查：① 在 https://home.openweathermap.org/api_keys 复制整段 Key，勿多空格/换行；② 保存 .env.local 后务必重启终端里的 npm run dev；③ 新 Key 最长约 2 小时才生效，请稍后再试。`;
}

export class WeatherFetchError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message);
    this.name = "WeatherFetchError";
  }
}

/**
 * Fetches weather via `/api/weather` (server holds OPENWEATHER_API_KEY — not exposed to the client).
 */
export async function fetchWeatherByCity(city: string): Promise<WeatherSnapshot> {
  const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
  const body = (await res.json()) as { error?: string; message?: string } & WeatherSnapshot;

  if (!res.ok) {
    const raw =
      typeof body.message === "string"
        ? body.message
        : body.error === "missing_api_key"
          ? "未配置 OPENWEATHER_API_KEY，请在 .env.local 中设置。"
          : "无法获取天气数据。";
    const msg = withOpenWeatherKeyHints(raw);
    throw new WeatherFetchError(msg, body.error);
  }

  return {
    city: body.city,
    temp: body.temp,
    feelsLike: body.feelsLike,
    tempMin: body.tempMin,
    tempMax: body.tempMax,
    precipitation: body.precipitation,
    condition: body.condition,
    description: body.description,
  };
}
