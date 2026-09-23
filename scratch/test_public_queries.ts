import "dotenv/config";
import { getActiveBrandBySlug } from "../frontend/src/server/public/brands";
import { getBrandCategories } from "../frontend/src/server/public/taxonomy";
import { listRecipes } from "../frontend/src/server/public/recipes";

async function run() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
  const brand = await getActiveBrandBySlug("capiche");
  console.log("Brand:", brand?.id, brand?.slug);
  if (brand) {
    const categories = await getBrandCategories(brand.id);
    console.log("Categories count:", categories.length);
    console.log("Category names:", categories.map(c => c.name));
    const { items } = await listRecipes(brand.id, { take: 12 });
    console.log("Recipes count:", items.length);
    console.log("Recipe titles:", items.map(r => r.title));
  }
}

run().catch(console.error);
