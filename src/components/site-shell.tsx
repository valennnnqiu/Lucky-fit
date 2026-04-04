"use client";

import type { ReactNode } from "react";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f3f5f6]">
      <AppHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="w-full flex-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c49a9e]/40"
      >
        <div className="w-full py-6 lg:py-10">{children}</div>
      </main>
      <AppFooter />
    </div>
  );
}
