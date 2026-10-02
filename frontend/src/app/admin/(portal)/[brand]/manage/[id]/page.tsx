import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/app/admin/actions/auth";
import { getActiveBrandBySlug } from "@/server/public/brands";
import { loadFormBrands, loadRecipeForEdit } from "@/server/services/recipe-form";
import { RecipeWorkspace } from "@/components/admin/RecipeWorkspace";

export const metadata: Metadata = { title: "Edit Recipe" };

export default async function AdminEditRecipePage(props: PageProps<"/admin/[brand]/manage/[id]">) {
  const { brand: brandSlug, id } = await props.params;
  await requireAdminOrRedirect(`/admin/${brandSlug}/manage/${id}`);

  const brand = await getActiveBrandBySlug(brandSlug);
  if (!brand) notFound();
  const [loaded, brands] = await Promise.all([loadRecipeForEdit(id), loadFormBrands()]);
  if (!loaded || loaded.recipe.deletedAt) notFound();
  const { recipe, initial } = loaded;
  // Moved to another brand while editing — follow it there.
  if (recipe.brandId !== brand.id) redirect(`/admin/${recipe.brand.slug}/manage/${recipe.id}`);

  return (
    <RecipeWorkspace
      brandSlug={brand.slug}
      brands={brands}
      initial={initial}
      title={`Edit: ${recipe.title}`}
      back={recipe.category ? { href: `/admin/${brand.slug}/category/${recipe.category.slug}`, label: recipe.category.name } : { href: `/admin/${brand.slug}`, label: brand.name }}
    />
  );
}
