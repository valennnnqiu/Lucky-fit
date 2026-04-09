"use client";

import { useState } from "react";

const brandLogoSrc =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_BRAND_LOGO_SRC
    ? process.env.NEXT_PUBLIC_BRAND_LOGO_SRC
    : "/brand/logo.png";

type BrandLogoMarkProps = {
  variant: "header" | "footer" | "shareCard";
  /** Footer / shareCard: visible to screen readers. Header: use "" — parent link has aria-label. */
  alt: string;
};

const headerImgClass =
  "h-[40px] w-fit shrink-0 rounded-lg object-contain object-center";
const footerImgClass =
  "h-[60px] w-fit shrink-0 rounded-full object-contain object-center";
const shareCardImgClass =
  "h-9 w-[100px] shrink-0 rounded-md object-contain object-center";

const headerPlaceholderClass =
  "h-[40px] min-w-9 w-fit shrink-0 rounded-lg border border-[#50504d] bg-[#f3f5f6] shadow-sm";
const footerPlaceholderClass =
  "h-[60px] min-w-[60px] w-fit shrink-0 rounded-full border border-[#50504d] bg-[#f3f5f6] shadow-sm";
const shareCardPlaceholderClass =
  "h-9 w-[100px] shrink-0 rounded-md bg-[#2e302d]/15";

export function BrandLogoMark({ variant, alt }: BrandLogoMarkProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    if (variant === "header") {
      return <span className={headerPlaceholderClass} aria-hidden />;
    }
    if (variant === "shareCard") {
      return (
        <span
          className={shareCardPlaceholderClass}
          role="img"
          aria-label={alt}
        />
      );
    }
    return (
      <span
        className={footerPlaceholderClass}
        role="img"
        aria-label={alt}
      />
    );
  }

  const className =
    variant === "header"
      ? headerImgClass
      : variant === "shareCard"
        ? shareCardImgClass
        : footerImgClass;

  const heightPx =
    variant === "header" ? 40 : variant === "shareCard" ? 36 : 60;

  return (
    <img
      src={brandLogoSrc}
      alt={alt}
      height={heightPx}
      className={className}
      decoding="async"
      {...(variant === "shareCard" ? { "data-share-inline": "" } : {})}
      aria-hidden={alt === "" ? true : undefined}
      onError={() => setFailed(true)}
    />
  );
}
