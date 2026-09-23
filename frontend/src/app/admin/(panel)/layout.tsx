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
        <p className="eyebrow text-blue-600">Bookends</p>
        <p className="mb-8 text-sm font-semibold text-slate-800">Admin</p>
        <nav className="space-y-1 text-sm">
          {ADMIN_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-500">
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

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 md:p-10">{children}</main>
    </div>
  );
}
