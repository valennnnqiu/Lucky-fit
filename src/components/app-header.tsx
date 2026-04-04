"use client";

import Link from "next/link";
import { BrandLogoMark } from "@/components/brand-logo";
import { strings } from "@/lib/strings";

export function AppHeader() {
  const t = strings;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#50504d]/10 bg-[#f3f5f6] text-[#50504d]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:border focus:border-[#50504d] focus:bg-[#f3f5f6] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#50504d] focus:outline-none focus:ring-2 focus:ring-[#c49a9e]"
      >
        {t.skipToMain}
      </a>
      <div className="mx-auto flex min-h-[60px] w-full max-w-none items-center justify-between gap-3 bg-[#f3f5f6] px-4 sm:min-h-16 md:px-8 lg:px-12">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-[#50504D] sm:gap-3">
          <Link
            href="/"
            className="flex min-w-0 items-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c49a9e]"
            aria-label={t.header.siteName}
          >
            <BrandLogoMark variant="header" alt="" />
          </Link>
        </div>
      </div>
    </header>
  );
}
