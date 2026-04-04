import type { ReactNode } from "react";

const PAD = "px-4 py-5";

export function WireShell({
  step,
  title,
  rightSlot,
  children,
}: {
  step: 1 | 2 | 3;
  title: string;
  rightSlot?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#d6d6d6] text-neutral-900">
      <div className={`mx-auto min-h-screen w-full max-w-md border-neutral-900 sm:max-w-md sm:border-x-2`}>
        <header className="border-b-2 border-neutral-900 bg-[#d6d6d6] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-900">
                OOTD Oracle
              </p>
              <h1 className="mt-2 font-mono text-sm font-bold uppercase tracking-wide text-neutral-900">
                {title}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {rightSlot}
              <ol className="flex gap-0.5" aria-label="Flow step">
                {([1, 2, 3] as const).map((s) => (
                  <li
                    key={s}
                    className={`flex h-7 w-7 items-center justify-center border-2 border-neutral-900 font-mono text-[11px] font-bold tabular-nums ${
                      s === step
                        ? "bg-neutral-900 text-[#d6d6d6]"
                        : "bg-[#d6d6d6] text-neutral-900"
                    }`}
                  >
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </header>
        <div className={PAD}>{children}</div>
      </div>
    </div>
  );
}

export function WireCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-2 border-neutral-900 bg-white ${className}`}>
      {title ? (
        <div className="border-b-2 border-neutral-900 bg-[#ececec] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wide text-neutral-900">
          {title}
        </div>
      ) : null}
      <div className="p-3">{children}</div>
    </section>
  );
}

export const wireInputClass =
  "h-9 w-full border-2 border-neutral-900 bg-white px-2 font-mono text-sm leading-none outline-none placeholder:text-neutral-500 focus:bg-neutral-50";

export const wireBtnPrimary =
  "h-9 w-full border-2 border-neutral-900 bg-neutral-900 font-mono text-xs font-bold uppercase tracking-wide leading-none text-white disabled:cursor-not-allowed disabled:opacity-40";

export const wireBtnGhost =
  "font-mono text-[10px] font-bold uppercase tracking-wide text-neutral-900 underline decoration-2 underline-offset-2";

export const wireChip =
  "inline-flex h-9 items-center border-2 border-neutral-900 bg-white px-2.5 font-mono text-[10px] font-bold uppercase tracking-wide leading-none text-neutral-900";

export const wireChipActive = "bg-neutral-900 text-white";
