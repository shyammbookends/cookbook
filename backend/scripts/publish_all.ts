import "dotenv/config";
import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "fs";
import { join } from "path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  // Try to find a media file to use, or create a dummy one
  let media = await db.media.findFirst();
  
  if (!media) {
    // Look for an image in public folder, or create a dummy media record
    // We will just create a dummy record pointing to nothing if there are no images on disk,
    // but ideally we should upload an image.
    // For now, let's create a media record with a placeholder URL
    media = await db.media.create({
      data: {
        storageKey: "placeholder",
        originalName: "placeholder.jpg",
        mime: "image/jpeg",
        bytes: 1000,
        brandId: (await db.brand.findFirst())?.id || "",
        uploadedById: (await db.admin.findFirst())?.id || "",
        dominantColor: "#D4B572",
        sha256: "fakehash123",
      }
    });
  }

  // Update all recipes
  await db.recipe.updateMany({
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      heroImageId: media.id,
    }
  });

  console.log("Updated all recipes to PUBLISHED and assigned a hero image.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
