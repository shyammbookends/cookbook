"use client";

import { useState } from "react";
import { secretLoginAction } from "@/app/admin/actions/auth";
import { IdInput, PasswordInput } from "@/components/portal/LoginFields";

export function LoginForm({ next }: { next: string }) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const res = await secretLoginAction(id, password, next);
    // On success the action redirects, so we only get here on failure.
    if (res?.error) {
      setError(res.error);
      setPending(false);
    }
  }

  const input = "w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#C6E86B]";

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label className="mb-1 block text-xs text-white/60">ID</label>
        <IdInput value={id} onChange={(v) => { setId(v); setError(""); }} autoFocus placeholder="" className={input} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-white/60">Password</label>
        <PasswordInput value={password} onChange={(v) => { setPassword(v); setError(""); }} placeholder="" className={input} />
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-[#C6E86B] py-2 font-semibold text-[#0A2399] disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
