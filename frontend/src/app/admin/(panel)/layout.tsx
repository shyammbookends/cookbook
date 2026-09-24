import Link from "next/link";
import { requireAdminOrRedirect, logoutAction } from "@/app/admin/actions/auth";
import { ADMIN_NAV } from "@/components/admin/navItems";
import { MobileNav } from "@/components/admin/MobileNav";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminOrRedirect();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 md:flex-row">
      <MobileNav />

      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white p-5 md:block shadow-sm z-10">
        <div className="mb-8 pb-4 border-b border-slate-100 flex flex-col items-center text-center">
          <Link href="/admin/recipes" className="flex flex-col items-center group">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none group-hover:opacity-90 transition-opacity">
              BOOK<span className="text-blue-600">ENDS</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 mt-2.5 rounded-full bg-blue-50 border border-blue-100 px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest text-blue-600">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
              Admin
            </span>
          </Link>
        </div>
        <nav className="space-y-1 text-sm">
          {ADMIN_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Exit to Public Portal Button */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <Link
            href="/"
            className="flex items-center justify-between w-full rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-600 hover:shadow-md transition-all group"
          >
            <span className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
              <span>Back to Portal</span>
            </span>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <p className="font-medium text-slate-700">{admin.name}</p>
          <p>{admin.email}</p>
          <p className="mt-1 uppercase text-slate-400">{admin.role}</p>
          <form action={logoutAction}>
            <button type="submit" className="mt-3 text-slate-500 underline hover:text-blue-600 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 md:p-10">
        <div className="mb-6 flex items-center justify-between pb-3 border-b border-slate-200/60">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Bookends</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Admin Panel</span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>Exit to Public Portal ↗</span>
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}
