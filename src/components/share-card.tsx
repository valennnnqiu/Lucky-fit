import type { OutfitRecommendation, WeatherSnapshot } from "@/lib/types";

function nice(value: string): string {
  return value.replace("-", " ");
}

export function ShareCard({
  weather,
  outfit,
  luckyColor,
}: {
  weather: WeatherSnapshot;
  outfit: OutfitRecommendation;
  luckyColor: string;
}) {
  return (
    <div
      id="share-card"
      className="mx-auto flex aspect-[4/5] w-full max-w-sm flex-col justify-between border-2 border-neutral-900 bg-white p-4"
    >
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-800">
          OOTD Oracle
        </p>
        <h2 className="mt-3 font-mono text-lg font-bold uppercase tracking-tight text-neutral-900">
          Today
        </h2>
        <p className="mt-1 font-mono text-xs text-neutral-800">
          {weather.city} · {weather.temp}°C · {weather.description}
        </p>
      </div>

      <div className="border-2 border-neutral-900 bg-neutral-100 p-3 font-mono text-xs text-neutral-900">
        <p>Top · {nice(outfit.topLayers.base)}</p>
        {outfit.onePiece !== true ? (
          <p>Bottom · {nice(outfit.bottom)}</p>
        ) : (
          <p className="text-neutral-600">One-piece look</p>
        )}
        <p>Shoes · {nice(outfit.shoes)}</p>
      </div>

      <div className="flex items-center justify-between border-t-2 border-neutral-900 pt-3">
        <span className="font-mono text-[10px] font-bold uppercase text-neutral-700">Accent</span>
        <span className="h-6 w-6 border-2 border-neutral-900" style={{ backgroundColor: luckyColor }} />
      </div>
    </div>
  );
}
