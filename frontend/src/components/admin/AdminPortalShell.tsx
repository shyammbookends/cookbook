import type { ReactNode } from "react";
import Link from "next/link";
import { getPortalBrand } from "@/server/public/brands";
import { BrandThemeSchema, themeToCssVars } from "@/lib/schemas/theme";

/** Portal-themed frame for admin-portal tool pages (brands & categories), with a back link and title. */
export async function AdminPortalShell({
  title,
  back,
  actions,
  children,
}: {
  title: string;
  back: { href: string; label: string };
  actions?: ReactNode;
  children: ReactNode;
}) {
  const portal = await getPortalBrand();
  const cssVars = portal ? themeToCssVars(BrandThemeSchema.parse(portal.theme)) : {};

  return (
    <div data-brand={portal?.slug} style={cssVars as React.CSSProperties} className="min-h-screen bg-brand-bg pb-24 text-brand-fg">
      <div className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <Link href={back.href} className="inline-flex items-center text-sm font-medium text-brand-fg/70 transition-colors hover:text-brand-accent">
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {back.label}
        </Link>
        <div className="mb-6 mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          {actions}
        </div>
        {/* Admin forms are built for a light surface. */}
        <div className="text-slate-900">{children}</div>
      </div>
    </div>
  );
}
