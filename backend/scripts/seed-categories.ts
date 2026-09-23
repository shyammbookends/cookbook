import { db } from "./src/server/db";
import { toSlug } from "./src/lib/slug";

async function main() {
  const brand = await db.brand.findFirst({ where: { name: "Capiche" } });
  if (!brand) {
    console.log("Capiche brand not found!");
    return;
  }

  const categories = ["Main Menu", "Drinks", "Desserts"];
  for (const cat of categories) {
    await db.category.upsert({
      where: { brandId_slug: { brandId: brand.id, slug: toSlug(cat) } },
      create: { brandId: brand.id, name: cat, slug: toSlug(cat) },
      update: {}
    });
    console.log(`Created category: ${cat}`);
  }
}

main().catch(console.error).finally(() => db.$disconnect());
