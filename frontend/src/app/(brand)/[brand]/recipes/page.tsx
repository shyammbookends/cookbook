import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveBrandBySlug } from "@/server/public/brands";
import { listRecipes } from "@/server/public/recipes";
import { getBrandCategories } from "@/server/public/taxonomy";
import { RecipeGrid } from "@/components/recipe/RecipeCard";
import type { Metadata } from "next";

export async function generateMetadata(props: PageProps<"/[brand]/recipes">): Promise<Metadata> {
  const { brand: slug } = await props.params;
  const brand = await getActiveBrandBySlug(slug);
  return { title: brand ? "Recipes" : undefined };
}

export default async function RecipesPage(props: PageProps<"/[brand]/recipes">) {
  const { brand: slug } = await props.params;
  const sp = await props.searchParams;
  const brand = await getActiveBrandBySlug(slug);
  if (!brand) notFound();

  const q = typeof sp.q === "string" ? sp.q : undefined;
  const categorySlug = typeof sp.category === "string" ? sp.category : undefined;
  const difficulty = typeof sp.difficulty === "string" ? (sp.difficulty as "EASY" | "MEDIUM" | "HARD") : undefined;
  const sort = typeof sp.sort === "string" ? (sp.sort as "newest" | "quickest" | "az") : undefined;
  const cursor = typeof sp.cursor === "string" ? sp.cursor : undefined;

  const [{ items, nextCursor }, categories] = await Promise.all([
    listRecipes(brand.id, { query: q, categorySlug, difficulty, sort, cursor, take: 16 }),
    getBrandCategories(brand.id),
  ]);

  const nextParams = new URLSearchParams();
  if (q) nextParams.set("q", q);
  if (categorySlug) nextParams.set("category", categorySlug);
  if (difficulty) nextParams.set("difficulty", difficulty);
  if (sort) nextParams.set("sort", sort);
  if (nextCursor) nextParams.set("cursor", nextCursor);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">All recipes</h1>

      <form className="mb-8 flex flex-wrap items-center gap-3" action={`/${brand.slug}/recipes`}>
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search recipes…"
          className="rounded-full border border-brand-fg/20 bg-transparent px-4 py-2 text-sm placeholder:text-brand-fg/40 focus:border-brand-accent focus:outline-none"
        />
        <select name="category" defaultValue={categorySlug ?? ""} className="rounded-full border border-brand-fg/20 bg-transparent px-4 py-2 text-sm">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select name="difficulty" defaultValue={difficulty ?? ""} className="rounded-full border border-brand-fg/20 bg-transparent px-4 py-2 text-sm">
          <option value="">Any difficulty</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
        <select name="sort" defaultValue={sort ?? "newest"} className="rounded-full border border-brand-fg/20 bg-transparent px-4 py-2 text-sm">
          <option value="newest">Newest</option>
          <option value="quickest">Quickest</option>
          <option value="az">A–Z</option>
        </select>
        <button type="submit" className="rounded-full bg-brand-accent px-5 py-2 text-sm font-semibold text-brand-bg">
          Filter
        </button>
      </form>

      <RecipeGrid brandSlug={brand.slug} recipes={items} />

      {nextCursor && (
        <div className="mt-12 text-center">
          <Link
            href={`/${brand.slug}/recipes?${nextParams.toString()}`}
            className="inline-block rounded-full border border-brand-fg/20 px-6 py-3 text-sm hover:border-brand-accent"
          >
            Load more
          </Link>
        </div>
      )}
    </div>
  );
}
