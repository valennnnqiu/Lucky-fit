import type { WeatherSnapshot } from "./types";

const BASE = "/weather";

function isLocalNight(): boolean {
  const h = new Date().getHours();
  return h < 7 || h >= 19;
}

function partlyCloudyDesc(description: string): boolean {
  const d = description.toLowerCase();
  return (
    /\b(few|scattered|broken)\s+clouds?\b/i.test(description) ||
    /\bpartly\b/i.test(d) ||
    /少云|多云间晴|晴间多云/.test(description)
  );
}

function overcastDesc(description: string): boolean {
  const d = description.toLowerCase();
  return /\bovercast\b/i.test(d) || /阴|阴天|密布/.test(description);
}

/**
 * Picks a PNG under `public/weather/` from {@link WeatherSnapshot.condition} and API `description`.
 */
export function weatherIconSrc(w: WeatherSnapshot): string {
  const desc = w.description;
  const d = desc.toLowerCase();
  const night = isLocalNight();

  if (w.condition === "clear") {
    return `${BASE}/${night ? "weather_clear_night" : "weather_clear_day"}.png`;
  }

  if (w.condition === "clouds") {
    if (overcastDesc(desc)) return `${BASE}/weather_cloudy.png`;
    if (partlyCloudyDesc(desc)) {
      return `${BASE}/${night ? "weather_partly_cloudy_night" : "weather_partly_cloudy_day"}.png`;
    }
    return `${BASE}/weather_cloudy.png`;
  }

  if (w.condition === "rain") {
    if (/\bthunder|thunderstorm\b/i.test(d) || /雷暴|雷雨/.test(desc)) {
      return `${BASE}/weather_thunderstorm.png`;
    }
    if (/\bsleet|freezing rain\b/i.test(d) || /雨夹雪|冻雨/.test(desc)) {
      return `${BASE}/weather_sleet.png`;
    }
    if (/\b(very heavy|extreme|heavy intensity)\b/i.test(d) || /暴雨|大雨|强雨/.test(desc)) {
      return `${BASE}/weather_rain_heavy.png`;
    }
    if (/\b(light intensity|light drizzle|drizzle)\b/i.test(d) || /小雨|毛毛雨|细雨/.test(desc)) {
      return `${BASE}/weather_rain_light.png`;
    }
    return `${BASE}/weather_rain.png`;
  }

  if (w.condition === "snow") {
    if (/\bheavy|blizzard\b/i.test(d) || /大雪|暴雪/.test(desc)) {
      return `${BASE}/weather_snow_heavy.png`;
    }
    return `${BASE}/weather_snow.png`;
  }

  if (/\btornado|hurricane\b/i.test(d) || /龙卷风|飓风/.test(desc)) {
    return `${BASE}/weather_tornado.png`;
  }
  if (/\bwind|squall\b/i.test(d) || /风|飑/.test(desc)) {
    return `${BASE}/weather_windy.png`;
  }
  if (/rainbow/i.test(d) || /彩虹/.test(desc)) {
    return `${BASE}/weather_rainbow.png`;
  }

  return `${BASE}/weather_cloudy.png`;
}
