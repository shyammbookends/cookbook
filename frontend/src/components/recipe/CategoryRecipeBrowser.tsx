"use client";

import { useMemo, useState } from "react";
import type { RecipeCardData } from "@/server/public/recipes";
import { RecipeGrid } from "@/components/recipe/RecipeCard";

/**
 * A category's recipe grid with a live search bar: results narrow on every
 * keystroke ("t" shows every title containing t, "tof" narrows further).
 * Titles that start with the query come first.
 */
export function CategoryRecipeBrowser({
  brandSlug,
  recipes,
  base = "",
  editable = false,
  draftIds,
}: {
  brandSlug: string;
  recipes: RecipeCardData[];
  base?: string;
  editable?: boolean;
  draftIds?: string[];
}) {
  const [query, setQuery] = useState("");
  const drafts = useMemo(() => (draftIds ? new Set(draftIds) : undefined), [draftIds]);

  const needle = query.trim().toLowerCase();
  const shown = useMemo(() => {
    if (!needle) return recipes;
    const hits = recipes.filter((r) => r.title.toLowerCase().includes(needle));
    const rank = (r: RecipeCardData) => {
      const t = r.title.toLowerCase();
      if (t.startsWith(needle)) return 0;
      return t.split(/\s+/).some((w) => w.startsWith(needle)) ? 1 : 2;
    };
    return hits
      .map((r, i) => ({ r, i, k: rank(r) }))
      .sort((a, b) => a.k - b.k || a.i - b.i)
      .map((x) => x.r);
  }, [recipes, needle]);

  return (
    <>
      <div className="relative mb-8">
        <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipe…"
          aria-label="Search recipes in this category"
          className="w-full rounded-2xl border-0 bg-white py-3.5 pl-12 pr-24 text-base text-slate-900 shadow-md outline-none ring-1 ring-black/5 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-accent"
        />
        {needle && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {shown.length} found
          </span>
        )}
      </div>

      {needle && shown.length === 0 ? (
        <p className="quote-serif py-16 text-center text-brand-fg/60">No recipes match &ldquo;{query.trim()}&rdquo;.</p>
      ) : (
        <RecipeGrid brandSlug={brandSlug} recipes={shown} base={base} editable={editable} draftIds={drafts} />
      )}
    </>
  );
}
