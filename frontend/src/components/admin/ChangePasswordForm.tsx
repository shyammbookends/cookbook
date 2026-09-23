"use client";

import { useActionState } from "react";
import { changePasswordAction, type ActionState } from "@/app/admin/actions/auth";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(changePasswordAction, {});
  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none";

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-6 max-w-md">
      <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Current password</label><input name="current" type="password" required className={inputCls} /></div>
      <div><label className="mb-1.5 block text-sm font-medium text-slate-700">New password</label><input name="next" type="password" required className={inputCls} /></div>
      <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm new password</label><input name="confirm" type="password" required className={inputCls} /></div>
      {state.error && <p className="text-sm font-medium text-red-500 bg-red-50 p-2 rounded border border-red-100">{state.error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition-colors">
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
