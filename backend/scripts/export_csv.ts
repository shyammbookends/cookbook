import "dotenv/config";
import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";
import { IMPORT_COLUMNS } from "./src/server/import/columns";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function generateCSV() {
  const recipes = await db.recipe.findMany({
    include: {
      brand: true,
      category: true,
      ingredients: { orderBy: { position: "asc" } },
      steps: { orderBy: { position: "asc" } },
      heroImage: true,
      tags: { include: { tag: true } }
    }
  });

  const headers = IMPORT_COLUMNS.map(c => c.label);
  const rows = [headers.join(",")];

  for (const r of recipes) {
    const row = IMPORT_COLUMNS.map(col => {
      let val: any = "";
      switch (col.key) {
        case "external_id": val = r.externalId; break;
        case "title": val = r.title; break;
        case "brand": val = r.brand?.name; break;
        case "category": val = r.category?.name; break;
        case "slug": val = r.slug; break;
        case "excerpt": val = r.excerpt; break;
        case "description": val = r.description; break;
        case "ingredients": 
          val = r.ingredients.map(i => i.raw).join("\n");
          break;
        case "prep_steps":
          val = r.steps.filter(s => s.phase === "PREP").map(s => s.body).join("\n");
          break;
        case "cook_steps":
          val = r.steps.filter(s => s.phase === "COOK" || s.phase === "FINISH").map(s => s.body).join("\n");
          break;
        case "prep_time": val = r.prepMinutes; break;
        case "cook_time": val = r.cookMinutes; break;
        case "rest_time": val = r.restMinutes; break;
        case "total_time": val = r.totalMinutes; break;
        case "servings": val = r.servings; break;
        case "yield": val = r.yieldText; break;
        case "difficulty": val = r.difficulty ? r.difficulty.charAt(0) + r.difficulty.slice(1).toLowerCase() : ""; break;
        case "cuisine": val = r.cuisine; break;
        case "course": val = r.course; break;
        case "dietary": val = (r.dietary as string[])?.join(", "); break;
        case "spice_level": val = r.spiceLevel; break;
        case "tags": val = r.tags.map(t => t.tag.name).join(", "); break;
        case "hero_image": val = r.heroImage ? `http://localhost:3000/media/${r.heroImage.id}` : ""; break;
        case "gallery_images": val = ""; break;
        case "calories": val = (r.nutrition as any)?.calories || ""; break;
        case "protein_g": val = (r.nutrition as any)?.proteinG || ""; break;
        case "carbs_g": val = (r.nutrition as any)?.carbsG || ""; break;
        case "fat_g": val = (r.nutrition as any)?.fatG || ""; break;
        case "fiber_g": val = (r.nutrition as any)?.fiberG || ""; break;
        case "sugar_g": val = (r.nutrition as any)?.sugarG || ""; break;
        case "sodium_mg": val = (r.nutrition as any)?.sodiumMg || ""; break;
        case "notes": val = r.notes; break;
        case "tips": val = r.tips; break;
        case "equipment": val = (r.equipment as string[])?.join(", "); break;
        case "seo_title": val = r.seoTitle; break;
        case "seo_description": val = r.seoDescription; break;
        case "status": val = r.status === "PUBLISHED" ? "Published" : "Draft"; break;
        case "featured": val = r.featured ? "Yes" : "No"; break;
        case "dish_code": val = r.dishCode; break;
        case "version": val = r.version; break;
        case "author": val = r.author; break;
        case "approved_by": val = r.approvedBy; break;
        case "effective_date": val = r.effectiveDate ? r.effectiveDate.toISOString().split("T")[0] : ""; break;
        case "next_review_date": val = r.nextReviewDate ? r.nextReviewDate.toISOString().split("T")[0] : ""; break;
        case "mise_en_place": val = (r.miseEnPlace as string[])?.join("\n"); break;
        case "plating": val = r.plating; break;
        case "holding": val = r.holding; break;
        case "allergens": val = r.allergens; break;
      }
      
      const strVal = String(val || "");
      // Escape quotes and wrap in quotes if there's a comma or newline
      if (strVal.includes(",") || strVal.includes("\n") || strVal.includes('"')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    });

    rows.push(row.join(","));
  }

  const csvPath = path.join(process.cwd(), "public", "recipes_export.csv");
  fs.writeFileSync(csvPath, rows.join("\n"), "utf-8");
  console.log(`Exported ${recipes.length} recipes to ${csvPath}`);
}

generateCSV()
  .catch(console.error)
  .finally(() => db.$disconnect());
