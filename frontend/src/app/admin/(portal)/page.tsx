import Link from "next/link";
import { PortalHomeView } from "@/components/views/PortalHomeView";

export const metadata = { title: "Admin" };

const tools = [
  {
    href: "/admin/brands-categories",
    label: "Brands & Categories",
    icon: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M17.5 14v7M14 17.5h7" /></>,
  },
  {
    href: "/admin/media",
    label: "Media Library",
    icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>,
  },
  {
    href: "/admin/delete-recipes",
    label: "Delete Recipes",
    icon: <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5" />,
  },
];

/**
 * Admin tools toolbar. Phones and tablets: an in-flow row of three equal tiles below
 * the layout's fixed "Main Portal" button, so nothing overlaps the BOOKENDS hero.
 * Desktop: the original pinned top-left buttons, with a spacer pushing the hero
 * below them.
 */
function AdminTools() {
  return (
    <>
      <nav aria-label="Admin tools" className="relative z-40 grid grid-cols-3 gap-2 px-4 pt-18 lg:fixed lg:left-6 lg:top-3 lg:flex lg:gap-2 lg:p-0">
        {tools.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-white px-2 py-3 text-center text-xs font-bold leading-tight text-slate-900 shadow-lg ring-1 ring-black/10 transition-colors hover:bg-slate-900 hover:text-white sm:text-sm lg:flex-row lg:gap-2 lg:px-5 lg:text-base"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
            {t.label}
          </Link>
        ))}
      </nav>
      {/* Desktop: keep the hero clear of the pinned buttons. */}
      <div className="hidden h-14 lg:block" aria-hidden />
    </>
  );
}

export default function AdminPortalHomePage() {
  return <PortalHomeView base="/admin" top={<AdminTools />} />;
}
