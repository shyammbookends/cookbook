import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrRedirect } from "@/app/admin/actions/auth";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * The admin portal: the same brand → category → recipe interface as the public
 * site, under /admin, with Add / Edit recipe on each category page.
 */
export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  await requireAdminOrRedirect("/admin");

  return (
    <>
      {children}
      {/* Top-right, over the empty end of the brand header (and the portal home's hero). */}
      <Link
        href="/"
        className="fixed right-4 top-3 z-50 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-lg ring-1 ring-black/10 transition-colors hover:bg-slate-900 hover:text-white sm:right-6 sm:text-base print:hidden"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l9-9 9 9" /><path d="M5 10v10h14V10" /></svg>
        Main Portal
      </Link>
    </>
  );
}
