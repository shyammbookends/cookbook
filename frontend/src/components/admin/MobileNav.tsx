"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "@/components/admin/navItems";
import { logoutAction } from "@/app/admin/actions/auth";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="border-b border-slate-200 bg-white md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/admin/recipes" className="flex items-center gap-2.5">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
            BOOK<span className="text-blue-600">ENDS</span>
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
            Admin
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Portal ↗
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span className="sr-only">Menu</span>
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {open && (
        <nav className="space-y-1 border-t border-slate-200 px-4 py-3 text-sm bg-slate-50">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-600 transition-all mb-3"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              Back to Public Portal
            </span>
            <span className="text-slate-400">↗</span>
          </Link>
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 ${pathname === item.href ? "bg-blue-100 text-blue-700 font-semibold" : "text-slate-600 hover:bg-blue-50 hover:text-blue-600 font-medium"}`}
            >
              {item.label}
            </Link>
          ))}
          <form action={logoutAction} className="pt-2 border-t border-slate-200 mt-2">
            <button type="submit" className="block w-full rounded-lg px-3 py-2 text-left text-slate-500 hover:bg-slate-100 hover:text-slate-800 font-medium">
              Sign out
            </button>
          </form>
        </nav>
      )}
    </div>
  );
}
