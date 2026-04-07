"use client";

import { BrandLogoMark } from "@/components/brand-logo";
import { strings } from "@/lib/strings";

const instagramUrl =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_INSTAGRAM_URL
    ? process.env.NEXT_PUBLIC_INSTAGRAM_URL
    : "https://www.instagram.com/valennnnq/?hl=en";

/** Replace with your assets (same paths) or change `src` below. */
const FOOTER_ICON_INSTAGRAM = "/footer/icon-instagram.svg";

const iconCircleBtnClass =
  "inline-flex size-12 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[#50504d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c49a9e]";

export function AppFooter() {
  const t = strings.footer;

  return (
    <footer className="mt-auto w-full border-t border-[#50504d]/10 bg-[#f3f5f6] text-[#50504d]">
      <div className="mx-auto w-full max-w-none bg-[#f3f5f6] px-4 py-8 text-[rgba(80,80,77,1)] md:px-8 lg:px-12 lg:py-10">
        <div className="flex w-full flex-col items-center gap-4 text-center md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-4 md:gap-y-3 md:text-left">
          <div className="flex min-w-0 flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2 md:flex-1 md:justify-start">
            <BrandLogoMark variant="footer" alt={t.logoAlt} />
            <div className="min-w-0 space-y-1 text-sm text-[#50504d]">
              <p className="text-[#50504d]">{t.tagline}</p>
              <p className="text-xs text-[#50504d]">{t.copyright}</p>
            </div>
          </div>
          <nav
            className="flex shrink-0 flex-wrap items-center justify-center gap-3 md:justify-end"
            aria-label="Social"
          >
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={iconCircleBtnClass}
              aria-label={t.instagram}
            >
              <img
                src={FOOTER_ICON_INSTAGRAM}
                alt=""
                width={24}
                height={24}
                className="pointer-events-none size-6 object-contain"
                decoding="async"
              />
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
