import "dotenv/config";
import { PrismaClient } from "../frontend/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

function scope(brandId: string) {
  return {
    brandId,
    status: "PUBLISHED" as const,
    deletedAt: null,
    OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
  };
}

async function test() {
  const brand = await db.brand.findFirst({ where: { slug: "aiko" } });
  if (!brand) return;
  const where = {
    ...scope(brand.id)
  };
  const items = await db.recipe.findMany({ where });
  console.log("Scope query items count for Aiko:", items.length);
  const capiche = await db.brand.findFirst({ where: { slug: "capiche" } });
  if (capiche) {
    const capItems = await db.recipe.findMany({ where: scope(capiche.id) });
    console.log("Scope query items count for Capiche:", capItems.length);
  }
  await db.$disconnect();
}

test().catch(console.error);
