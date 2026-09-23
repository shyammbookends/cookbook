"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/app/admin/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="mb-1 block text-xs text-white/60">Email</label>
        <input
          name="email"
          type="email"
          required
          autoFocus
          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#C6E86B]"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-white/60">Password</label>
        <input
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#C6E86B]"
        />
      </div>
      {state.error && <p className="text-sm text-red-300">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#C6E86B] py-2 font-semibold text-[#0A2399] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
