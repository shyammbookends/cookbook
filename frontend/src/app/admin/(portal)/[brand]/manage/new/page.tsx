import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/app/admin/actions/auth";
import { getActiveBrandBySlug } from "@/server/public/brands";
import { getBrandCategoryBySlug } from "@/server/public/taxonomy";
import { loadFormBrands } from "@/server/services/recipe-form";
import { RecipeWorkspace } from "@/components/admin/RecipeWorkspace";

export const metadata: Metadata = { title: "Add Recipe" };

export default async function AdminNewRecipePage(props: PageProps<"/admin/[brand]/manage/new">) {
  const { brand: brandSlug } = await props.params;
  const sp = await props.searchParams;
  const categorySlug = typeof sp.category === "string" ? sp.category : null;
  await requireAdminOrRedirect(`/admin/${brandSlug}/manage/new${categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : ""}`);

  const brand = await getActiveBrandBySlug(brandSlug);
  if (!brand) notFound();
  const [category, brands] = await Promise.all([
    categorySlug ? getBrandCategoryBySlug(brand.id, categorySlug) : null,
    loadFormBrands(),
  ]);

  return (
    <RecipeWorkspace
      brandSlug={brand.slug}
      brands={brands}
      initial={{ brandId: brand.id, categoryId: category?.id ?? null }}
      title="Add Recipe"
      back={category ? { href: `/admin/${brand.slug}/category/${category.slug}`, label: category.name } : { href: `/admin/${brand.slug}`, label: brand.name }}
    />
  );
}
