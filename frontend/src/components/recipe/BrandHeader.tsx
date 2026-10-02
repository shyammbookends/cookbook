"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Brand } from "@/generated/prisma/client";

import { BeshakLogo } from "@/components/brand/BeshakLogo";
import { GhasletLogo } from "@/components/brand/GhasletLogo";

export function BrandHeader({ brand, base = "" }: { brand: Brand; base?: string }) {
  const pathname = usePathname();
  const brandHome = `${base}/${brand.slug}`;
  const isBrandHome = pathname === brandHome;
  const backHref = isBrandHome ? base || "/" : brandHome;
  const backLabel = isBrandHome ? "Portal" : brand.name;

  return (
    <header className="sticky top-0 z-30 bg-black text-white print:hidden">
      <div className="mx-auto flex w-full max-w-7xl items-center px-4 py-4 sm:px-6">
        <Link 
          href={backHref} 
          className="mr-6 flex items-center text-sm font-medium opacity-80 hover:opacity-100 transition-opacity"
          aria-label={isBrandHome ? "Back to Portal" : `Back to ${brand.name}`}
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">{backLabel}</span>
        </Link>
        <Link 
          href={brandHome}
          className="flex items-center"
        >
          {brand.slug === "beshak" ? (
            <BeshakLogo color="white" className="h-6 sm:h-7 w-auto" />
          ) : brand.slug === "ghaslet" ? (
            <GhasletLogo className="h-10 sm:h-12 w-auto" />
          ) : brand.slug === "capiche" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/brands/capiche-logo.png" alt="Capiche" className="h-9 w-auto sm:h-11" />
          ) : (
            <span
              className={`text-2xl sm:text-3xl font-bold ${
                brand.slug === "aiko" ? "font-[family-name:var(--font-marker)] tracking-wide" : "tracking-tight"
              }`}
              style={{
                color: brand.slug === "aiko" ? "var(--brand-bg, #EFB22C)" : "var(--brand-fg, #ffffff)",
              }}
            >
              {brand.name}
            </span>
          )}
        </Link>
        {/* Empty div for right-side balance if needed in future */}
        <div className="flex-1"></div>
      </div>
    </header>
  );
}
