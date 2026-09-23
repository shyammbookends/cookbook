import "dotenv/config";
import { PrismaClient } from "../frontend/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function check() {
  const brands = await db.brand.findMany({ where: { slug: "aiko" }, include: { categories: true, recipes: true } });
  console.log("Aiko Brands count:", brands.length);
  for (const b of brands) {
    console.log("Brand ID:", b.id, "Slug:", b.slug, "Status:", b.status);
    console.log("Categories:", b.categories.map(c => ({ id: c.id, slug: c.slug, name: c.name })));
    console.log("Recipes:", b.recipes.map(r => ({ id: r.id, slug: r.slug, catId: r.categoryId, status: r.status })));
  }
  await db.$disconnect();
}

check().catch(console.error);
