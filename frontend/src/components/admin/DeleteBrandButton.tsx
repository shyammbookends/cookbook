"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBrandAction } from "@/app/admin/actions/brand";

/**
 * Removes a brand for good — with its recipes, categories and tags — after the
 * admin types the brand's name to confirm.
 */
export function DeleteBrandButton({
  id,
  name,
  recipeCount,
  categoryCount,
  redirectTo,
  compact = false,
}: {
  id: string;
  name: string;
  recipeCount: number;
  categoryCount: number;
  /** Where to go after deleting (omit to stay and refresh). */
  redirectTo?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setTyped("");
    setError(null);
  }

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteBrandAction(id);
      if (!result.ok) return setError(result.error);
      close();
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold text-red-700 shadow ring-1 ring-black/10 hover:bg-red-600 hover:text-white"
            : "inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-base font-bold text-white shadow-lg hover:bg-red-700"
        }
      >
        <TrashIcon className={compact ? "h-3.5 w-3.5" : "h-5 w-5"} />
        Remove brand
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby={`del-${id}`}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-2xl">
            <h2 id={`del-${id}`} className="text-xl font-bold">Remove {name}?</h2>
            <p className="mt-2 text-sm text-slate-600">
              This permanently deletes the brand and everything in it —{" "}
              <strong>{recipeCount} recipe{recipeCount === 1 ? "" : "s"}</strong> and{" "}
              <strong>{categoryCount} categor{categoryCount === 1 ? "y" : "ies"}</strong>. This can&apos;t be undone.
            </p>
            <label htmlFor={`del-input-${id}`} className="mt-4 block text-sm font-semibold">
              Type <span className="font-mono">{name}</span> to confirm
            </label>
            <input
              id={`del-input-${id}`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={close} disabled={pending} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={pending || typed.trim() !== name}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40"
              >
                {pending ? "Removing…" : "Remove brand"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TrashIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}
