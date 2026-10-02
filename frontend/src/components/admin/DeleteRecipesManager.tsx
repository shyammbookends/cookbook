"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkTrashRecipesAction, restoreRecipeAction } from "@/app/admin/actions/recipe";

interface Row { id: string; name: string; brandId: string; brandName: string; category: string | null; categoryId?: string | null; status: string }

export function DeleteRecipesManager({
  recipes,
  trashed,
  brands,
}: {
  recipes: Row[];
  trashed: Row[];
  brands: { id: string; name: string; categories: { id: string; name: string }[] }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return recipes.filter((r) => (!brandId || r.brandId === brandId) && (!categoryId || r.categoryId === categoryId) && (!needle || r.name.toLowerCase().includes(needle)));
  }, [recipes, brandId, categoryId, q]);
  const categories = brands.find((b) => b.id === brandId)?.categories ?? [];

  const allSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) visible.forEach((r) => next.delete(r.id));
      else visible.forEach((r) => next.add(r.id));
      return next;
    });
  }

  function deleteSelected() {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} recipe(s)? They move to Recently deleted, where you can restore them.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await bulkTrashRecipesAction(ids);
      if (!res.ok) setError(res.error);
      else {
        setSelected(new Set());
        router.refresh();
      }
    });
  }

  function restore(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await restoreRecipeAction(id);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-5 shadow-lg">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select value={brandId} onChange={(e) => { setBrandId(e.target.value); setCategoryId(""); }} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <option value="">All brands</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={!brandId}
            title={brandId ? "Filter by category" : "Pick a brand first"}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="">{brandId ? "All categories" : "Category"}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search recipes…"
            className="min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={pending || selected.size === 0}
            onClick={deleteSelected}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-40"
          >
            Delete selected ({selected.size})
          </button>
        </div>
        {error && <p className="mb-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        {visible.length === 0 ? (
          <p className="py-10 text-center text-slate-400">No recipes found.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            <label className="flex cursor-pointer items-center gap-3 py-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4" />
              Select all ({visible.length})
            </label>
            {visible.map((r) => (
              <label key={r.id} className="flex cursor-pointer items-center gap-3 py-2.5 hover:bg-slate-50">
                <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="h-4 w-4" />
                <span className="flex-1 font-medium text-slate-900">{r.name}</span>
                <span className="text-xs text-slate-500">{r.brandName}{r.category ? ` · ${r.category}` : ""}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{r.status}</span>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-lg">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Recently deleted ({trashed.length})</h2>
        {trashed.length === 0 ? (
          <p className="py-4 text-sm text-slate-400">Nothing deleted.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {trashed.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-2.5">
                <span className="flex-1 font-medium text-slate-700">{r.name}</span>
                <span className="text-xs text-slate-500">{r.brandName}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => restore(r.id)}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium hover:bg-slate-200 disabled:opacity-40"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
