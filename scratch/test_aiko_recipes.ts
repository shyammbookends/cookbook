import "dotenv/config";
import { PrismaClient } from "../frontend/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function test() {
  const brand = await db.brand.findFirst({ where: { slug: "aiko" } });
  console.log("Brand:", brand?.id, brand?.name);
  if (!brand) return;
  const recipes = await db.recipe.findMany({ where: { brandId: brand.id, status: "PUBLISHED" } });
  console.log("Recipes count:", recipes.length);
  console.log("Titles:", recipes.map(r => r.title));
  await db.$disconnect();
}

test().catch(console.error);
