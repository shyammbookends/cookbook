"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCategoryAction,
  deleteCategoryAction,
  createTagAction,
  deleteTagAction,
} from "@/app/admin/actions/taxonomy";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { recipes: number };
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count: { recipeTags: number };
}

interface Brand {
  id: string;
  name: string;
  categories: Category[];
  tags: Tag[];
}

export function CategoryTagManager({ brand }: { brand: Brand }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addCategory() {
    if (!newCategory.trim() || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await createCategoryAction({
        brandId: brand.id,
        name: newCategory.trim(),
        sortOrder: brand.categories.length,
      });
      if (!result.ok) setError(result.error);
      else {
        setNewCategory("");
        router.refresh();
      }
    });
  }

  function removeCategory(id: string, name: string) {
    if (!confirm(`Delete category "${name}"?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (!result.ok) {
        setError(result.error);
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function addTag() {
    if (!newTag.trim() || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await createTagAction({ brandId: brand.id, name: newTag.trim() });
      if (!result.ok) setError(result.error);
      else {
        setNewTag("");
        router.refresh();
      }
    });
  }

  function removeTag(id: string, name: string) {
    if (!confirm(`Delete tag "${name}"?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteTagAction(id);
      if (!result.ok) {
        setError(result.error);
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">{brand.name}</h2>
        <span className="text-xs text-slate-500 font-medium">
          {brand.categories.length} categories · {brand.tags.length} tags
        </span>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Categories Section */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Categories</p>
          <ul className="mb-4 space-y-2 text-sm">
            {brand.categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-sm hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{c.name}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {c._count.recipes} {c._count.recipes === 1 ? "recipe" : "recipes"}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => removeCategory(c.id, c.name)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Delete category"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
            {brand.categories.length === 0 && (
              <li className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
                No categories yet.
              </li>
            )}
          </ul>
          <div className="flex gap-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
              placeholder="New category name (press Enter to add)…"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button
              type="button"
              disabled={pending || !newCategory.trim()}
              onClick={addCategory}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Tags Section */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Tags</p>
          <ul className="mb-4 flex flex-wrap gap-2">
            {brand.tags.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm hover:border-slate-300 transition-colors"
              >
                <span className="font-medium text-slate-800">{t.name}</span>
                <span className="text-[10px] font-semibold text-slate-400">({t._count.recipeTags})</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => removeTag(t.id, t.name)}
                  className="ml-1 rounded-full p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Delete tag"
                >
                  ✕
                </button>
              </li>
            ))}
            {brand.tags.length === 0 && (
              <li className="w-full py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
                No tags yet.
              </li>
            )}
          </ul>
          <div className="flex gap-2">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="New tag name (press Enter to add)…"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button
              type="button"
              disabled={pending || !newTag.trim()}
              onClick={addTag}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
