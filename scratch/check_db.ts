import "dotenv/config";
import { PrismaClient } from "../frontend/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function check() {
  const brands = await db.brand.findMany({ include: { categories: true, recipes: true } });
  for (const b of brands) {
    console.log(`BRAND: ${b.slug} (Status: ${b.status})`);
    console.log(`  CATEGORIES (${b.categories.length}):`, b.categories.map(c => c.slug));
    console.log(`  RECIPES (${b.recipes.length}):`, b.recipes.map(r => ({ slug: r.slug, status: r.status, categoryId: r.categoryId })));
  }
  await db.$disconnect();
}

check().catch(console.error);
