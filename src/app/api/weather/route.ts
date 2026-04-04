import { NextResponse } from "next/server";
import {
  snapshotFromOpenWeatherPayload,
  type OpenWeatherPayload,
} from "@/lib/openweather";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim();
  if (!city) {
    return NextResponse.json({ error: "missing_city" }, { status: 400 });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "missing_api_key",
        message:
          "在项目根目录的 .env.local 中设置 OPENWEATHER_API_KEY（OpenWeather 免费 key 即可）。",
      },
      { status: 503 }
    );
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${apiKey}&units=metric`;

  const res = await fetch(url);
  if (!res.ok) {
    let detail = "无法获取天气数据。";
    try {
      const err = (await res.json()) as { message?: string };
      if (err.message) detail = err.message;
    } catch {
      /* ignore */
    }
    return NextResponse.json({ error: "openweather_error", message: detail }, { status: 502 });
  }

  const data = (await res.json()) as OpenWeatherPayload;
  return NextResponse.json(snapshotFromOpenWeatherPayload(city, data));
}
