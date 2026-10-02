import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActiveBrandBySlug } from "@/server/public/brands";
import { getRecipeBySlug } from "@/server/public/recipes";

export async function generateMetadata(props: PageProps<"/[brand]/recipes/[slug]">): Promise<Metadata> {
  const { brand: brandSlug, slug } = await props.params;
  const brand = await getActiveBrandBySlug(brandSlug);
  if (!brand) return {};
  const recipe = await getRecipeBySlug(brand.id, slug);
  if (!recipe) return {};

  const title = recipe.seoTitle || recipe.title;
  const description = recipe.seoDescription || recipe.excerpt || undefined;
  const image = recipe.heroImage ? { url: `/media/${recipe.heroImage.id}` } : undefined;

  return {
    title,
    description,
    robots: recipe.noindex ? { index: false, follow: false } : undefined,
    alternates: { canonical: `/${brand.slug}/recipes/${recipe.slug}` },
    openGraph: { title, description, images: image ? [image] : undefined, type: "article" },
  };
}

import { RecipeDetailView } from "@/components/views/RecipeDetailView";

export default async function RecipeDetailPage(props: PageProps<"/[brand]/recipes/[slug]">) {
  const { brand: brandSlug, slug } = await props.params;
  const brand = await getActiveBrandBySlug(brandSlug);
  if (!brand) notFound();

  const recipe = await getRecipeBySlug(brand.id, slug);
  if (!recipe) notFound();

  return <RecipeDetailView brand={brand} recipe={recipe} />;
}
