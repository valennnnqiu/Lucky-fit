import type { WeatherSnapshot } from "@/lib/types";
import { weatherIconSrc } from "@/lib/weather-icon";

export function WeatherIcon({
  weather,
  className,
}: {
  weather: WeatherSnapshot;
  className?: string;
}) {
  return (
    <img
      src={weatherIconSrc(weather)}
      alt=""
      className={className}
      width={50}
      height={50}
      loading="lazy"
      decoding="async"
    />
  );
}
