import "dotenv/config";
import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const brands = await db.brand.findMany();
  
  for (const brand of brands) {
    if (brand.slug === "bookends") continue;
    
    // Get the Main Menu category
    const mainMenuCat = await db.category.findUnique({
      where: { brandId_slug: { brandId: brand.id, slug: "main-menu" } }
    });
    
    if (mainMenuCat) {
      // Assign all recipes in this brand to the Main Menu category
      await db.recipe.updateMany({
        where: { brandId: brand.id },
        data: { categoryId: mainMenuCat.id }
      });
      console.log(`Updated recipes for ${brand.slug} to Main Menu`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
