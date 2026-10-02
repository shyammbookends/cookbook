import Link from "next/link";
import { RecipeImage } from "@/components/media/RecipeImage";
import { TiltCard } from "@/components/motion/TiltCard";
import { formatMinutes } from "@/lib/duration";
import type { RecipeCardData } from "@/server/public/recipes";

export function RecipeCard({
  brandSlug,
  recipe,
  priority = false,
  href,
  editHref,
  draft = false,
}: {
  brandSlug: string;
  recipe: RecipeCardData;
  priority?: boolean;
  /** Overrides the public recipe link (admin portal). */
  href?: string;
  /** Admin portal: an Edit button pinned to the card's top corner. */
  editHref?: string;
  draft?: boolean;
}) {
  return (
    <TiltCard className="group h-full">
      <Link
        href={href ?? `/${brandSlug}/recipes/${recipe.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl bg-brand-card-bg text-brand-card-fg shadow-lg shadow-black/10 transition-shadow hover:shadow-2xl"
      >
        <RecipeImage media={recipe.heroImage} alt={recipe.heroImage?.alt || recipe.title} aspect="4 / 3" priority={priority} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
        <div className="flex flex-1 flex-col gap-2 p-4">
          {recipe.category && <span className="eyebrow text-brand-accent">{recipe.category.name}</span>}
          <h3 className="text-lg font-bold leading-snug">{recipe.title}</h3>
          {recipe.excerpt && <p className="quote-serif text-sm text-brand-card-fg/70 line-clamp-2">{recipe.excerpt}</p>}
          <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-brand-card-fg/60">
            {recipe.totalMinutes ? <span>{formatMinutes(recipe.totalMinutes)}</span> : null}
            {recipe.difficulty ? <span className="capitalize">{recipe.difficulty.toLowerCase()}</span> : null}
            {recipe.servings ? <span>Serves {recipe.servings}</span> : null}
          </div>
        </div>
      </Link>
      {draft && (
        <span className="pointer-events-none absolute left-3 top-3 z-20 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-950 shadow">
          Draft
        </span>
      )}
      {editHref && (
        // A sibling of the card link (links can't nest), laid over its top-right corner.
        <Link
          href={editHref}
          aria-label={`Edit ${recipe.title}`}
          className="absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-900 shadow-md ring-1 ring-black/10 transition-colors hover:bg-slate-900 hover:text-white"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
          Edit
        </Link>
      )}
    </TiltCard>
  );
}

export function RecipeGrid({
  brandSlug,
  recipes,
  base = "",
  editable = false,
  draftIds,
}: {
  brandSlug: string;
  recipes: RecipeCardData[];
  /** "/admin" when rendered inside the admin portal. */
  base?: string;
  /** Admin portal: every card gets an Edit button. */
  editable?: boolean;
  draftIds?: Set<string>;
}) {
  if (recipes.length === 0) {
    return <p className="quote-serif py-16 text-center text-brand-fg/60">No recipes here yet — check back soon.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {recipes.map((r, i) => {
        const draft = draftIds?.has(r.id) ?? false;
        const editHref = editable ? `${base}/${brandSlug}/manage/${r.id}` : undefined;
        return (
          <RecipeCard
            key={r.id}
            brandSlug={brandSlug}
            recipe={r}
            priority={i < 4}
            // Drafts have no recipe page yet, so the whole card opens the editor.
            href={draft ? editHref : base ? `${base}/${brandSlug}/recipes/${r.slug}` : undefined}
            editHref={editHref}
            draft={draft}
          />
        );
      })}
    </div>
  );
}
