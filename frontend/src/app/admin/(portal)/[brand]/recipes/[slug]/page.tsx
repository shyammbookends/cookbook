import { notFound } from "next/navigation";
import { getActiveBrandBySlug } from "@/server/public/brands";
import { getRecipeBySlug } from "@/server/public/recipes";
import { RecipeDetailView } from "@/components/views/RecipeDetailView";

export default async function AdminRecipeDetailPage(props: PageProps<"/admin/[brand]/recipes/[slug]">) {
  const { brand: brandSlug, slug } = await props.params;
  const brand = await getActiveBrandBySlug(brandSlug);
  if (!brand) notFound();
  const recipe = await getRecipeBySlug(brand.id, slug);
  if (!recipe) notFound();

  return <RecipeDetailView brand={brand} recipe={recipe} base="/admin" />;
}
