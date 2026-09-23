"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategoryAction, deleteCategoryAction, createTagAction, deleteTagAction } from "@/app/admin/actions/taxonomy";

interface Category { id: string; name: string; slug: string; _count: { recipes: number } }
interface Tag { id: string; name: string; slug: string; _count: { recipeTags: number } }
interface Brand { id: string; name: string; categories: Category[]; tags: Tag[] }

export function CategoryTagManager({ brand }: { brand: Brand }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addCategory() {
    if (!newCategory.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createCategoryAction({ brandId: brand.id, name: newCategory.trim(), sortOrder: brand.categories.length });
      if (!result.ok) setError(result.error);
      else { setNewCategory(""); router.refresh(); }
    });
  }

  function removeCategory(id: string) {
    if (!confirm("Delete this category?")) return;
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  function addTag() {
    if (!newTag.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createTagAction({ brandId: brand.id, name: newTag.trim() });
      if (!result.ok) setError(result.error);
      else { setNewTag(""); router.refresh(); }
    });
  }

  function removeTag(id: string) {
    if (!confirm("Delete this tag?")) return;
    startTransition(async () => {
      const result = await deleteTagAction(id);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="mb-4 text-lg font-semibold">{brand.name}</h2>
      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs uppercase text-white/50">Categories</p>
          <ul className="mb-3 space-y-1 text-sm">
            {brand.categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-1.5">
                <span>{c.name} <span className="text-white/40">({c._count.recipes})</span></span>
                <button disabled={pending} onClick={() => removeCategory(c.id)} className="text-white/40 hover:text-red-400">✕</button>
              </li>
            ))}
            {brand.categories.length === 0 && <li className="text-white/40">No categories yet.</li>}
          </ul>
          <div className="flex gap-2">
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category" className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm" />
            <button disabled={pending} onClick={addCategory} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">Add</button>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase text-white/50">Tags</p>
          <ul className="mb-3 flex flex-wrap gap-2">
            {brand.tags.map((t) => (
              <li key={t.id} className="flex items-center gap-1 rounded-full bg-black/20 px-3 py-1 text-xs">
                {t.name} ({t._count.recipeTags})
                <button disabled={pending} onClick={() => removeTag(t.id)} className="text-white/40 hover:text-red-400">✕</button>
              </li>
            ))}
            {brand.tags.length === 0 && <li className="text-white/40 text-sm">No tags yet.</li>}
          </ul>
          <div className="flex gap-2">
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="New tag" className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm" />
            <button disabled={pending} onClick={addTag} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}
