import { db } from "@/server/db";
import { RecipeForm } from "@/components/admin/RecipeForm";

export const metadata = { title: "Add Recipe" };

export default async function NewRecipePage() {
  const brands = await db.brand.findMany({
    orderBy: { sortOrder: "asc" },
    include: { categories: { orderBy: { sortOrder: "asc" } }, tags: { orderBy: { name: "asc" } } },
  });

  const formBrands = brands.map((b) => ({
    id: b.id,
    name: b.name,
    categories: b.categories.map((c) => ({ id: c.id, name: c.name })),
    tags: b.tags.map((t) => ({ id: t.id, name: t.name })),
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Add recipe</h1>
      <RecipeForm brands={formBrands} />
    </div>
  );
}
