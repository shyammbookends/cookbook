import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActiveBrandBySlug } from "@/server/public/brands";
import { getBrandCategoryBySlug } from "@/server/public/taxonomy";
import { listRecipes } from "@/server/public/recipes";
import { CategoryView } from "@/components/views/CategoryView";

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

  return <CategoryView brand={brand} category={category} recipes={items} />;
}
