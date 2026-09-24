"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { DeleteRecipeButton } from "@/components/admin/DeleteRecipeButton";
import { bulkTrashRecipesAction } from "@/app/admin/actions/recipe";

type RecipeItem = {
  id: string;
  title: string;
  status: string;
  heroImageId: string | null;
  updatedAt: Date;
  brand: { name: string };
  category: { name: string } | null;
};

export function RecipeListTable({ recipes }: { recipes: RecipeItem[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(recipes.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleBulkTrash = () => {
    if (!selectedIds.size) return;
    if (confirm(`Are you sure you want to trash ${selectedIds.size} recipes?`)) {
      startTransition(async () => {
        const res = await bulkTrashRecipesAction(Array.from(selectedIds));
        if (!res.ok) alert("Failed to trash recipes: " + res.error);
        else setSelectedIds(new Set());
      });
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
      {selectedIds.size > 0 && (
        <div className="bg-slate-50 p-3 flex justify-between items-center border-b border-slate-200">
          <span className="text-sm font-semibold text-blue-600">{selectedIds.size} selected</span>
          <button
            onClick={handleBulkTrash}
            disabled={isPending}
            className="rounded bg-red-50 px-3 py-1 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Trashing..." : "Trash Selected"}
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-3 w-10">
                <input 
                  type="checkbox" 
                  checked={recipes.length > 0 && selectedIds.size === recipes.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 bg-white accent-blue-600 w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="p-3">Title</th>
              <th className="p-3">Brand</th>
              <th className="p-3">Category</th>
              <th className="p-3">Status</th>
              <th className="p-3">Updated</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-3">
                  <input 
                    type="checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={(e) => handleSelect(r.id, e.target.checked)}
                    className="rounded border-slate-300 bg-white accent-blue-600 w-4 h-4 cursor-pointer"
                  />
                </td>
                <td className="p-3">
                  <Link href={`/admin/recipes/${r.id}`} className="hover:underline font-medium text-slate-800 hover:text-blue-600">
                    {!r.heroImageId && <span className="mr-1 text-amber-600" title="Missing hero image">⚠</span>}
                    {r.title}
                  </Link>
                </td>
                <td className="p-3">{r.brand.name}</td>
                <td className="p-3">{r.category?.name ?? "—"}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "PUBLISHED" ? "bg-green-100 text-green-700" : r.status === "DRAFT" ? "bg-slate-100 text-slate-600" : "bg-red-100 text-red-700"}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="p-3 text-slate-500 font-medium">{new Date(r.updatedAt).toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  <DeleteRecipeButton id={r.id} />
                </td>
              </tr>
            ))}
            {recipes.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-slate-500">No recipes match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
