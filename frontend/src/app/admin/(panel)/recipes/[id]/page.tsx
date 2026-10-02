import { notFound } from "next/navigation";
import Link from "next/link";
import { RecipeForm } from "@/components/admin/RecipeForm";
import { loadFormBrands, loadRecipeForEdit } from "@/server/services/recipe-form";
import { RecipeActions } from "./RecipeActions";

export const metadata = { title: "Edit Recipe" };

export default async function EditRecipePage(props: PageProps<"/admin/recipes/[id]">) {
  const { id } = await props.params;
  const [loaded, brands] = await Promise.all([loadRecipeForEdit(id), loadFormBrands()]);
  if (!loaded) notFound();
  const { recipe, initial } = loaded;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{recipe.title}</h1>
          <p className="text-sm text-slate-500">
            {recipe.brand.name} · {recipe.status}
            {recipe.status === "PUBLISHED" && (
              <>
                {" · "}
                <Link href={`/${recipe.brand.slug}/recipes/${recipe.slug}`} className="underline" target="_blank">
                  View live ↗
                </Link>
              </>
            )}
          </p>
        </div>
        <RecipeActions id={recipe.id} status={recipe.status} brandId={recipe.brandId} brands={brands.map((b) => ({ id: b.id, name: b.name }))} />
      </div>

      <RecipeForm brands={brands} initial={initial} />
    </div>
  );
}
