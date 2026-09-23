import Link from "next/link";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { RecipeListTable } from "@/components/admin/RecipeListTable";

export const metadata = { title: "Recipes" };

export default async function AdminRecipesPage(props: PageProps<"/admin/recipes">) {
  const sp = await props.searchParams;
  const brandId = typeof sp.brand === "string" ? sp.brand : undefined;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const missingImage = sp.missingImage === "1";
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const where: Prisma.RecipeWhereInput = {
    deletedAt: null,
    ...(brandId ? { brandId } : {}),
    ...(status ? { status: status as never } : {}),
    ...(missingImage ? { heroImageId: null } : {}),
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
  };

  const [recipes, brands] = await Promise.all([
    db.recipe.findMany({ where, orderBy: { updatedAt: "desc" }, take: 100, include: { brand: true, category: true, heroImage: true } }),
    db.brand.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Recipes</h1>
        <Link href="/admin/recipes/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
          + Add recipe
        </Link>
      </div>

      <form className="mb-6 flex flex-wrap gap-2 text-sm" action="/admin/recipes">
        <input name="q" defaultValue={q} placeholder="Search title…" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900" />
        <select name="brand" defaultValue={brandId ?? ""} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm focus:border-blue-500 focus:outline-none text-slate-900">
          <option value="">All brands</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select name="status" defaultValue={status ?? ""} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm focus:border-blue-500 focus:outline-none text-slate-900">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button type="submit" className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-1.5 font-medium text-slate-700 hover:bg-slate-200 transition-colors shadow-sm">Filter</button>
      </form>

      <RecipeListTable recipes={recipes} />
    </div>
  );
}
