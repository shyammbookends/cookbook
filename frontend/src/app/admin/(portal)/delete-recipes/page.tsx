import { db } from "@/server/db";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { DeleteRecipesManager } from "@/components/admin/DeleteRecipesManager";

export const metadata = { title: "Delete Recipes" };

export default async function DeleteRecipesPage() {
  const include = { brand: true, category: true } as const;
  const [recipes, trashed, brands] = await Promise.all([
    db.recipe.findMany({ where: { deletedAt: null }, orderBy: [{ brandId: "asc" }, { title: "asc" }], include }),
    db.recipe.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: "desc" }, take: 200, include }),
    db.brand.findMany({ orderBy: { sortOrder: "asc" }, include: { categories: { orderBy: { sortOrder: "asc" } } } }),
  ]);

  const toRow = (r: (typeof recipes)[number]) => ({
    id: r.id,
    name: r.title,
    brandId: r.brandId,
    brandName: r.brand.name,
    category: r.category?.name ?? null,
    categoryId: r.categoryId,
    status: r.status,
  });

  return (
    <AdminPortalShell title="Delete Recipes" back={{ href: "/admin", label: "Back to Admin Portal" }}>
      <DeleteRecipesManager
        recipes={recipes.map(toRow)}
        trashed={trashed.map(toRow)}
        brands={brands.map((b) => ({ id: b.id, name: b.name, categories: b.categories.map((c) => ({ id: c.id, name: c.name })) }))}
      />
    </AdminPortalShell>
  );
}
