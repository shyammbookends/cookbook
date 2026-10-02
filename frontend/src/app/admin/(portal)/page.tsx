import Link from "next/link";
import { PortalHomeView } from "@/components/views/PortalHomeView";

export const metadata = { title: "Admin" };

const topBtn =
  "inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-lg ring-1 ring-black/10 transition-colors hover:bg-slate-900 hover:text-white sm:text-base";

export default function AdminPortalHomePage() {
  return (
    <>
      <PortalHomeView base="/admin" />
      {/* Top-left, opposite the layout's Main Portal button. */}
      <div className="fixed left-4 top-3 z-50 flex flex-wrap gap-2 sm:left-6">
        <Link href="/admin/brands-categories" className={topBtn}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M17.5 14v7M14 17.5h7" /></svg>
          Brands &amp; Categories
        </Link>
        <Link href="/admin/media" className={topBtn}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
          Media Library
        </Link>
        <Link href="/admin/delete-recipes" className={topBtn}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5" /></svg>
          Delete Recipes
        </Link>
      </div>
    </>
  );
}
