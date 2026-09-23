"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setRecipeStatusAction, duplicateRecipeAction, trashRecipeAction } from "@/app/admin/actions/recipe";

export function RecipeActions({
  id, status, brandId, brands,
}: {
  id: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  brandId: string;
  brands: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dupBrand, setDupBrand] = useState(brandId);
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.error ?? "Something went wrong.");
      else router.refresh();
    });
  }

  return (
    <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
      <div className="flex flex-wrap gap-2">
        {status !== "PUBLISHED" ? (
          <button disabled={pending} onClick={() => run(() => setRecipeStatusAction(id, "PUBLISHED"))} className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs text-green-300 hover:bg-green-500/30">
            Publish
          </button>
        ) : (
          <button disabled={pending} onClick={() => run(() => setRecipeStatusAction(id, "DRAFT"))} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20">
            Unpublish
          </button>
        )}
        <select value={dupBrand} onChange={(e) => setDupBrand(e.target.value)} className="rounded-lg border border-white/15 bg-white/5 px-2 text-xs">
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await duplicateRecipeAction(id, dupBrand);
              if (result.ok) router.push(`/admin/recipes/${result.data.id}`);
              else setError(result.error);
            })
          }
          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
        >
          Duplicate
        </button>
        <button
          disabled={pending}
          onClick={() => {
            if (confirm("Move this recipe to trash?")) {
              run(() => trashRecipeAction(id));
              router.push("/admin/recipes");
            }
          }}
          className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/30"
        >
          Trash
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
