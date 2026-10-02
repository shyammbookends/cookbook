/**
 * Adds the Aiko Kitchen categories (with photos) in menu order:
 * Sides, Mains, Dim Sum, Sushi, Rice, Noodles, Drinks, Desserts, Beverage.
 * Photos: backend/data/aiko-categories (see CREDITS.txt there).
 * Idempotent: existing categories are kept (name, order and photo are only filled in).
 *
 * Run: npx tsx --conditions=react-server --tsconfig tsconfig.json backend/scripts/add_aiko_categories.ts
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/server/db";
import { uploadImage } from "@/server/media/upload";

const DIR = path.join(process.cwd(), "backend/data/aiko-categories");

const CATEGORIES: { slug: string; name: string; photo: string }[] = [
  { slug: "sides", name: "SIDES", photo: "sides.jpg" },
  { slug: "mains", name: "MAINS", photo: "mains.jpg" },
  { slug: "dim-sum", name: "DIM SUM", photo: "dim-sum.jpg" },
  { slug: "sushi", name: "SUSHI", photo: "sushi.jpg" },
  { slug: "rice", name: "RICE", photo: "rice.jpg" },
  { slug: "noodles", name: "NOODLES", photo: "noodles.jpg" },
  { slug: "drinks", name: "DRINKS", photo: "drinks.jpeg" },
  { slug: "desserts", name: "DESSERTS", photo: "desserts.jpg" },
  { slug: "beverage", name: "BEVERAGE", photo: "beverage.jpeg" },
];

async function main() {
  const brand = await db.brand.findUniqueOrThrow({ where: { slug: "aiko" } });
  const owner = await db.admin.findFirst({ where: { role: "OWNER", isActive: true } });

  for (const [i, c] of CATEGORIES.entries()) {
    const existing = await db.category.findUnique({ where: { brandId_slug: { brandId: brand.id, slug: c.slug } } });
    let imageId = existing?.imageId ?? null;
    if (!imageId) {
      const media = await uploadImage({
        buffer: await readFile(path.join(DIR, c.photo)),
        originalName: c.photo,
        alt: c.name,
        brandId: brand.id,
        uploadedById: owner?.id ?? null,
      });
      imageId = media.id;
    }
    const row = await db.category.upsert({
      where: { brandId_slug: { brandId: brand.id, slug: c.slug } },
      create: { brandId: brand.id, slug: c.slug, name: c.name, sortOrder: i + 1, imageId },
      update: { sortOrder: i + 1, imageId },
    });
    console.log(`${existing ? "Updated" : "Created"} ${String(i + 1).padStart(2, "0")} ${row.name} (${row.slug})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
