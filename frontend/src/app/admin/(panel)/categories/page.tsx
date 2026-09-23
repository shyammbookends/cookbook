import { db } from "@/server/db";
import { CategoryTagManager } from "@/components/admin/CategoryTagManager";

export const metadata = { title: "Categories & Tags" };

export default async function CategoriesPage() {
  const brands = await db.brand.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      categories: { orderBy: { sortOrder: "asc" }, include: { _count: { select: { recipes: true } } } },
      tags: { orderBy: { name: "asc" }, include: { _count: { select: { recipeTags: true } } } },
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Categories & Tags</h1>
      <div className="space-y-10">
        {brands.map((brand) => (
          <CategoryTagManager key={brand.id} brand={brand} />
        ))}
      </div>
    </div>
  );
}
