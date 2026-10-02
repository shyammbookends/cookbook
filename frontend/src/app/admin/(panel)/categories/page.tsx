import { listBrandsForTaxonomyManager } from "@/server/services/taxonomy";
import { CategoryTagManager } from "@/components/admin/CategoryTagManager";

export const metadata = { title: "Categories & Tags" };

export default async function CategoriesPage() {
  const brands = await listBrandsForTaxonomyManager();

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
