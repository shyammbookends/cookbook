"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteBrandsAction } from "@/app/admin/actions/brand";

export interface BrandTile {
  id: string;
  name: string;
  slug: string;
  number: number;
  status: string;
  theme: { bg?: string; fg?: string; accent?: string };
  recipes: number;
  categories: number;
}

/** The portal's own brand; it can't be removed. */
const PORTAL_BRAND_SLUG = "bookends";
const CONFIRM_WORD = "DELETE";

/**
 * Brand tiles for the admin portal. "Select to remove" (beside the heading)
 * switches the tiles into checkboxes; the chosen brands are deleted together
 * after typing DELETE.
 */
export function BrandSelectGrid({ brands }: { brands: BrandTile[] }) {
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const chosen = brands.filter((b) => selected.has(b.id));
  const totals = chosen.reduce((t, b) => ({ recipes: t.recipes + b.recipes, categories: t.categories + b.categories }), { recipes: 0, categories: 0 });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function stopSelecting() {
    setSelecting(false);
    setSelected(new Set());
    setConfirming(false);
    setTyped("");
    setError(null);
  }

  function deleteSelected() {
    setError(null);
    startTransition(async () => {
      const result = await deleteBrandsAction([...selected]);
      if (!result.ok) return setError(result.error);
      stopSelecting();
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-brand-fg">Brands</h2>
        {selecting ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-brand-fg/80">{selected.size} selected</span>
            <button type="button" onClick={stopSelecting} className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-brand-fg hover:bg-white/25">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={selected.size === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-red-700 disabled:opacity-40"
            >
              <TrashIcon />
              Delete selected
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSelecting(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-brand-fg ring-1 ring-white/25 hover:bg-white/25"
          >
            <TrashIcon />
            Select to remove
          </button>
        )}
      </div>

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {brands.map((b) => {
          const locked = b.slug === PORTAL_BRAND_SLUG;
          const isSelected = selected.has(b.id);
          const body = (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: b.theme.accent }}>
                Brand {String(b.number).padStart(2, "0")} · {b.status}
              </p>
              <p className="mt-2 text-2xl font-bold">{b.name}</p>
              <p className="mt-3 text-sm font-semibold opacity-80">
                {selecting ? (locked ? "Can't be removed" : isSelected ? "Selected" : "Click to select") : "Edit brand →"}
              </p>
            </>
          );
          const tileCls = "relative block h-full w-full rounded-2xl p-5 text-left shadow-md ring-1 ring-black/10 transition";
          const style = { background: b.theme.bg, color: b.theme.fg };

          if (!selecting) {
            return (
              <Link key={b.id} href={`/admin/brands-categories/${b.id}`} className={`${tileCls} hover:-translate-y-0.5 hover:shadow-xl`} style={style}>
                {body}
              </Link>
            );
          }
          return (
            <button
              key={b.id}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              disabled={locked}
              onClick={() => toggle(b.id)}
              className={`${tileCls} ${locked ? "cursor-not-allowed opacity-40" : ""} ${isSelected ? "ring-4 ring-red-500" : ""}`}
              style={style}
            >
              {!locked && (
                <span
                  aria-hidden
                  className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-md border-2 ${isSelected ? "border-red-500 bg-red-500 text-white" : "border-current bg-white/20"}`}
                >
                  {isSelected && (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  )}
                </span>
              )}
              {body}
            </button>
          );
        })}
      </div>

      {confirming && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="del-brands-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-2xl">
            <h2 id="del-brands-title" className="text-xl font-bold">
              Remove {chosen.length} brand{chosen.length === 1 ? "" : "s"}?
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-800">{chosen.map((b) => b.name).join(", ")}</p>
            <p className="mt-2 text-sm text-slate-600">
              This permanently deletes {chosen.length === 1 ? "this brand" : "these brands"} and everything in them —{" "}
              <strong>{totals.recipes} recipe{totals.recipes === 1 ? "" : "s"}</strong> and{" "}
              <strong>{totals.categories} categor{totals.categories === 1 ? "y" : "ies"}</strong>. This can&apos;t be undone.
            </p>
            <label htmlFor="del-brands-input" className="mt-4 block text-sm font-semibold">
              Type <span className="font-mono">{CONFIRM_WORD}</span> to confirm
            </label>
            <input
              id="del-brands-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => { setConfirming(false); setTyped(""); setError(null); }} disabled={pending} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteSelected}
                disabled={pending || typed.trim() !== CONFIRM_WORD}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40"
              >
                {pending ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}
