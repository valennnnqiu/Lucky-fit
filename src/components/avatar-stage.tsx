"use client";

import type { OutfitRecommendation } from "@/lib/types";

function labelize(value: string): string {
  return value.replace("-", " ").replace(/\b\w/g, (s) => s.toUpperCase());
}

export function AvatarStage({
  outfit,
  luckyColor,
}: {
  outfit: OutfitRecommendation;
  luckyColor: string;
}) {
  return (
    <div className="relative w-full overflow-hidden border-2 border-dashed border-neutral-900 bg-neutral-100">
      <div className="flex items-center justify-between border-b-2 border-neutral-900 bg-[#ececec] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wide">
        <span>Avatar placeholder</span>
        <span className="flex items-center gap-1.5">
          Color
          <span
            className="inline-block h-4 w-4 border-2 border-neutral-900"
            style={{ backgroundColor: luckyColor }}
          />
        </span>
      </div>
      <div className="relative h-72 border-b-2 border-neutral-900 bg-white">
        <div className="absolute left-1/2 top-8 h-20 w-20 -translate-x-1/2 border-2 border-neutral-900 bg-neutral-200" />
        <div className="absolute left-1/2 top-28 h-32 w-32 -translate-x-1/2 border-2 border-neutral-900 bg-neutral-300" />
      </div>
      <div className="space-y-0 border-neutral-900 bg-white font-mono text-[10px]">
        <p className="border-b-2 border-neutral-900 px-3 py-2 text-neutral-900">
          Top · {labelize(outfit.topLayers.base)}
          {outfit.onePiece !== true && outfit.topLayers.mid
            ? ` + ${labelize(outfit.topLayers.mid)}`
            : ""}
          {outfit.topLayers.outer ? ` + ${labelize(outfit.topLayers.outer)}` : ""}
        </p>
        <p className="px-3 py-2 text-neutral-900">
          {outfit.onePiece !== true ? (
            <>
              Bottom · {labelize(outfit.bottom)} · Shoes · {labelize(outfit.shoes)}
            </>
          ) : (
            <>One-piece · Shoes · {labelize(outfit.shoes)}</>
          )}
        </p>
      </div>
    </div>
  );
}
