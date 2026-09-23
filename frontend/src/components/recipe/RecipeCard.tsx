import Link from "next/link";
import { RecipeImage } from "@/components/media/RecipeImage";
import { TiltCard } from "@/components/motion/TiltCard";
import { formatMinutes } from "@/lib/duration";
import type { RecipeCardData } from "@/server/public/recipes";

export function RecipeCard({ brandSlug, recipe, priority = false }: { brandSlug: string; recipe: RecipeCardData; priority?: boolean }) {
  return (
    <TiltCard className="group h-full">
      <Link
        href={`/${brandSlug}/recipes/${recipe.slug}`}
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
    </TiltCard>
  );
}

export function RecipeGrid({ brandSlug, recipes }: { brandSlug: string; recipes: RecipeCardData[] }) {
  if (recipes.length === 0) {
    return <p className="quote-serif py-16 text-center text-brand-fg/60">No recipes here yet — check back soon.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {recipes.map((r, i) => (
        <RecipeCard key={r.id} brandSlug={brandSlug} recipe={r} priority={i < 4} />
      ))}
    </div>
  );
}
