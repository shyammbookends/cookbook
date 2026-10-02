import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActiveBrandBySlug } from "@/server/public/brands";
import { getBrandCategoryBySlug } from "@/server/public/taxonomy";
import { listRecipes } from "@/server/public/recipes";
import { listCategoryDrafts } from "@/server/services/recipe-form";
import { requireAdminOrRedirect } from "@/app/admin/actions/auth";
import { CategoryView } from "@/components/views/CategoryView";

export async function generateMetadata(props: PageProps<"/admin/[brand]/category/[slug]">): Promise<Metadata> {
  const { brand: brandSlug, slug } = await props.params;
  const brand = await getActiveBrandBySlug(brandSlug);
  if (!brand) return {};
  const category = await getBrandCategoryBySlug(brand.id, slug);
  return { title: category?.name };
}

export default async function AdminCategoryPage(props: PageProps<"/admin/[brand]/category/[slug]">) {
  const { brand: brandSlug, slug } = await props.params;
  const brand = await getActiveBrandBySlug(brandSlug);
  if (!brand) notFound();
  const category = await getBrandCategoryBySlug(brand.id, slug);
  if (!category) notFound();

  await requireAdminOrRedirect(`/admin/${brandSlug}/category/${slug}`);
  const [{ items }, drafts] = await Promise.all([
    listRecipes(brand.id, { categorySlug: slug, take: 40 }),
    // Drafts are listed too, so a saved draft is never lost from view.
    listCategoryDrafts(brand.id, category.id),
  ]);

  return (
    <CategoryView
      brand={brand}
      category={category}
      recipes={[...drafts, ...items]}
      base="/admin"
      admin={{ draftIds: new Set(drafts.map((d) => d.id)) }}
    />
  );
}
