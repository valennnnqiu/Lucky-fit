import type { Metadata } from "next";
import {
  Caveat,
  Geist,
  Geist_Mono,
  Gloria_Hallelujah,
  Handjet,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "@/components/providers";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["600", "700"],
});

const gloriaHallelujah = Gloria_Hallelujah({
  subsets: ["latin"],
  variable: "--font-gloria-hallelujah",
  weight: "400",
});

const handjet = Handjet({
  subsets: ["latin"],
  variable: "--font-handjet",
});

export const metadata: Metadata = {
  title: "Lucky Fit",
  description: "Mobile-first outfit oracle to generate your daily look.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} ${gloriaHallelujah.variable} ${handjet.variable} bg-[#f3f5f6] text-[#50504d] antialiased`}
      >
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
