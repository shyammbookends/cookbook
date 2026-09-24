import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActiveBrandBySlug } from "@/server/public/brands";
import { getBrandCategoryBySlug } from "@/server/public/taxonomy";
import { listRecipes } from "@/server/public/recipes";
import { RecipeGrid } from "@/components/recipe/RecipeCard";
import { DownloadCategoryPdfButton } from "@/components/recipe/DownloadCategoryPdfButton";

export async function generateMetadata(props: PageProps<"/[brand]/category/[slug]">): Promise<Metadata> {
  const { brand: brandSlug, slug } = await props.params;
  const brand = await getActiveBrandBySlug(brandSlug);
  if (!brand) return {};
  const category = await getBrandCategoryBySlug(brand.id, slug);
  return { title: category?.name };
}

export default async function CategoryPage(props: PageProps<"/[brand]/category/[slug]">) {
  const { brand: brandSlug, slug } = await props.params;
  const brand = await getActiveBrandBySlug(brandSlug);
  if (!brand) notFound();

  // Resolved by (brandId, slug) — a category slug that exists on another
  // brand can never match here. This is the brand wall applied to categories.
  const category = await getBrandCategoryBySlug(brand.id, slug);
  if (!category) notFound();

  const { items } = await listRecipes(brand.id, { categorySlug: slug, take: 40 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-brand-accent">Category</p>
          <h1 className="mb-8 text-3xl font-bold">{category.name}</h1>
        </div>
        <DownloadCategoryPdfButton
          brandSlug={brand.slug}
          categorySlug={slug}
          categoryName={category.name}
        />
      </div>
      {category.description && <p className="quote-serif mb-8 max-w-2xl text-brand-fg/70">{category.description}</p>}
      <RecipeGrid brandSlug={brand.slug} recipes={items} />
    </div>
  );
}
