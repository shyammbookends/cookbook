import Link from "next/link";
import { db } from "@/server/db";
import { listBrandsForTaxonomyManager } from "@/server/services/taxonomy";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { CategoryTagManager } from "@/components/admin/CategoryTagManager";
import { BrandSelectGrid } from "@/components/admin/BrandSelectGrid";

export const metadata = { title: "Brands & Categories" };

export default async function AdminBrandsCategoriesPage() {
  const [brands, taxonomy] = await Promise.all([
    db.brand.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { recipes: true, categories: true } } } }),
    listBrandsForTaxonomyManager(),
  ]);

  return (
    <AdminPortalShell
      title="Brands & Categories"
      back={{ href: "/admin", label: "Back to Admin Portal" }}
      actions={
        <Link
          href="/admin/brands-categories/new"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-base font-bold text-slate-900 shadow-lg ring-1 ring-black/10 transition-colors hover:bg-slate-900 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Add Brand
        </Link>
      }
    >
      <BrandSelectGrid
        brands={brands.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          number: b.number,
          status: b.status,
          theme: b.theme as { bg?: string; fg?: string; accent?: string },
          recipes: b._count.recipes,
          categories: b._count.categories,
        }))}
      />

      <h2 className="mb-3 text-xl font-bold text-brand-fg">Categories</h2>
      <div className="space-y-6">
        {taxonomy.map((brand) => (
          <div key={brand.id} className="rounded-2xl bg-white p-5 shadow-lg">
            <CategoryTagManager brand={brand} />
          </div>
        ))}
      </div>
    </AdminPortalShell>
  );
}
