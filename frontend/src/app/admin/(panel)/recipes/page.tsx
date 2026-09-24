import Link from "next/link";
import { db } from "@/server/db";
import { AdminRecipeExplorer } from "@/components/admin/AdminRecipeExplorer";

export const metadata = { title: "Recipes" };

export default async function AdminRecipesPage(props: PageProps<"/admin/recipes">) {
  const sp = await props.searchParams;
  const brandId = typeof sp.brand === "string" ? sp.brand : undefined;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const [recipes, brands] = await Promise.all([
    db.recipe.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 500,
      include: { brand: true, category: true, heroImage: true },
    }),
    db.brand.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recipes</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage and organize all cookbook recipes</p>
        </div>
        <Link href="/admin/recipes/new" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
          + Add recipe
        </Link>
      </div>

      <AdminRecipeExplorer
        recipes={recipes}
        brands={brands}
        initialQuery={q ?? ""}
        initialBrand={brandId ?? ""}
        initialStatus={status ?? ""}
      />
    </div>
  );
}
