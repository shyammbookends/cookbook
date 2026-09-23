import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Adding missing categories...");
  const brands = await db.brand.findMany();
  for (const brand of brands) {
    const categories = [
      { slug: "main-menu", name: "Main Menu", sortOrder: 10 },
      { slug: "drinks", name: "Drinks", sortOrder: 11 },
      { slug: "desserts", name: "Desserts", sortOrder: 12 },
    ];
    for (const c of categories) {
      await db.category.upsert({
        where: { brandId_slug: { brandId: brand.id, slug: c.slug } },
        create: { brandId: brand.id, slug: c.slug, name: c.name, sortOrder: c.sortOrder },
        update: {},
      });
    }
  }
  console.log("Done adding missing categories.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
