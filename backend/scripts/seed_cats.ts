import "dotenv/config";
import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const brands = await db.brand.findMany();
  
  for (const brand of brands) {
    if (brand.slug === "bookends") continue;
    
    const categories = ["Main Menu", "Drinks", "Desserts"];
    
    for (const [i, name] of categories.entries()) {
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      await db.category.upsert({
        where: { brandId_slug: { brandId: brand.id, slug } },
        create: { brandId: brand.id, slug, name, sortOrder: i + 10 },
        update: { name, sortOrder: i + 10 },
      });
      console.log(`Upserted category ${name} for ${brand.slug}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
