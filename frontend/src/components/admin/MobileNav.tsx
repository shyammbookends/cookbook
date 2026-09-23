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
        <div>
          <p className="eyebrow text-blue-600">Bookends</p>
          <p className="text-sm font-semibold text-slate-800">Admin</p>
        </div>
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
      {open && (
        <nav className="space-y-1 border-t border-slate-200 px-4 py-3 text-sm bg-slate-50">
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
