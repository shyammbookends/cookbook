/**
 * Adds the 4 Capiche DESSERT SOP recipes (from "rec 8.pdf", one recipe per page) with their photos.
 * Photos are cropped from each PDF page into backend/data/capiche-desserts/photo-N-*.jpg.
 * Idempotent: recipes are matched on (brand, externalId = dish code) and updated in place.
 *
 * Run: npx tsx --conditions=react-server --tsconfig tsconfig.json backend/scripts/seed_capiche_desserts.ts
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/server/db";
import { uploadImage } from "@/server/media/upload";
import { RecipeInputSchema } from "@/lib/schemas/recipe";
import { Prisma } from "@/generated/prisma/client";

const IMAGE_DIR = path.join(process.cwd(), "backend/data/capiche-desserts");

type Ing = [name: string, quantity: number | null, unit: string, groupLabel?: string];

interface Dish {
  photo: string;
  dishCode: string;
  /** Unique import key when two PDFs reuse a dish code (defaults to dishCode). */
  externalId?: string;
  title: string;
  description: string;
  summary: string | null;
  author: string;
  approvedBy: string;
  version?: string;
  effective?: string;
  nextReview?: string;
  garnish?: string[];
  station: string;
  yieldText: string;
  prepMinutes: number;
  cookMinutes: number;
  restMinutes?: number;
  totalMinutes: number;
  timeText?: { prep?: string; cook?: string; total?: string };
  dietary: string[];
  miseEnPlace: string[];
  equipment: string[];
  ingredients: Ing[];
  steps: string[];
  qualityCheck?: string[];
  plating: string;
  holding: string;
  allergens: string;
  notes?: string | null;
  /** Desserts card extras (lib/sop/dessert.ts). */
  card?: { storeAt?: string; chillTime?: string; serveTitle?: string; serveText?: string };
}

const BC = "Bookends Culinary";
const HK = "Husen Khan";
const ALG = "Contains: Gluten, Milk, Tree nuts.";

const DISHES: Dish[] = [
  {
    photo: "photo-1-sticky-toffee-pudding.jpg", dishCode: "DS-01", title: "Sticky Toffee Pudding",
    description: "A warm, moist date pudding smothered in rich toffee sauce, served with pecan ice cream for the perfect balance of sweetness and crunch.",
    summary: null, author: BC, approvedBy: HK, station: "Hot / Pastry",
    yieldText: "1 portion", prepMinutes: 10, cookMinutes: 25, totalMinutes: 35, dietary: ["Vegetarian (Eggless)"],
    miseEnPlace: ["Prepare pudding batter", "Bake puddings", "Caramel sauce ready", "Pecan ice cream ready"],
    equipment: ["Deck oven", "Mixing bowls", "Digital scale", "Dessert plate"],
    ingredients: [["Sticky toffee pudding", 105, "g"], ["Caramel sauce", 50, "g"], ["Pecan ice cream", 60, "g"]],
    steps: ["Bake pudding.", "Warm pudding before service.", "Plate pudding.", "Pour caramel sauce.", "Add pecan ice cream.", "Serve immediately."],
    qualityCheck: ["Pudding moist and warm", "Toffee sauce rich and glossy", "Ice cream firm and well-scooped", "Balanced sweetness and texture", "Clean, elegant presentation"],
    plating: "Dessert plate • Drizzle caramel.", holding: "Keep pudding chilled;\nice cream at −18 °C.", allergens: ALG,
    notes: "For the best texture, serve warm pudding immediately with cold pecan ice cream. The contrast in temperatures elevates the rich toffee flavour.",
    card: { storeAt: "−18 °C" },
  },
  {
    photo: "photo-2-brownie-with-ice-cream.jpg", dishCode: "DS-04", title: "Brownie with Ice Cream",
    description: "Warm, fudgy brownie topped with a scoop of cookies & cream ice cream, drizzled with Nutella sauce and finished with a delicate caramel tuile.",
    summary: null, author: BC, approvedBy: HK, station: "Hot & Cold / Pastry",
    yieldText: "1 portion", prepMinutes: 10, cookMinutes: 25, totalMinutes: 35, dietary: ["Vegetarian (Eggless)"],
    miseEnPlace: ["Prepare brownie batter", "Bake brownies", "Nutella sauce ready", "Ice cream ready", "Caramel tuile ready"],
    equipment: ["Deck oven", "Mixing bowls", "Dessert plate"],
    ingredients: [["Brownie", 100, "g"], ["Cookies & cream ice cream", 60, "g"], ["Nutella sauce", 20, "g"], ["Caramel tuile", 5, "g"]],
    steps: ["Bake and portion brownies.", "Warm before serving.", "Plate brownie.", "Add ice cream scoop.", "Drizzle Nutella.", "Garnish tuile."],
    qualityCheck: ["Brownie warm and fudgy", "Ice cream scoop firm and well-shaped", "Nutella sauce smooth and glossy", "Tuile crisp and delicate", "Presentation clean and appetizing"],
    plating: "Dessert plate • Upright tuile.", holding: "Store chilled or frozen;\nice cream at −18 °C.", allergens: ALG,
    notes: "For the best texture, use a dense, fudgy brownie. Let the brownie rest for 2–3 minutes after warming so it holds its shape. A warm base with cold ice cream creates the perfect contrast.",
    card: { storeAt: "−18 °C", serveTitle: "Serve immediately", serveText: "Enjoy at its best while warm." },
  },
  {
    photo: "photo-3-pistachio-mousse-cake.jpg", dishCode: "DS-02", title: "Pistachio Mousse Cake",
    description: "A delicate pistachio layered cake with airy mousse, soft sponge, and a crisp kunafa base — finished with white chocolate décor and pistachio crumble for the perfect balance of texture and flavour.",
    summary: null, author: BC, approvedBy: HK, station: "Cold / Pastry",
    yieldText: "1 portion", prepMinutes: 20, cookMinutes: 10, totalMinutes: 30, dietary: ["Vegetarian (Eggless)"],
    miseEnPlace: ["Kunafa base baked", "Pistachio sponge", "Pistachio mousse", "White chocolate garnish ready"],
    equipment: ["Moulds", "Whisk", "Spatula", "Dessert plate"],
    ingredients: [["Kunafa base", 40, "g"], ["Pistachio sponge", 30, "g"], ["Pistachio mousse", 60, "g"], ["White chocolate décor", 10, "g"]],
    steps: ["Place kunafa base.", "Add sponge layer.", "Pipe mousse.", "Garnish with white chocolate décor.", "Add pistachio crumble if available.", "Serve chilled."],
    qualityCheck: ["Kunafa base crisp and even", "Sponge soft and moist", "Mousse light, smooth, and well-set", "Flavours balanced and not overly sweet", "Clean, elegant presentation"],
    plating: "Dessert plate • Pistachio crumble garnish.", holding: "Keep chilled (0–5 °C).", allergens: ALG,
    notes: "The kunafa base adds a beautiful crunch to balance the light and creamy pistachio mousse. Use high-quality pistachio paste for the best colour and flavour.",
    card: { storeAt: "0–5 °C", serveTitle: "Serve chilled", serveText: "Enjoy immediately." },
  },
  {
    photo: "photo-4-tiramisu-3-0.jpg", dishCode: "DS-05", title: "Tiramisu 3.0",
    description: "A modern take on the classic Italian dessert with light coffee cream, velvety mascarpone mousse, soft sponge layers, and a delicate tuile — elevated in texture and balance.",
    summary: null, author: BC, approvedBy: HK, station: "Cold / Pastry",
    yieldText: "1 portion", prepMinutes: 20, cookMinutes: 25, restMinutes: 120, totalMinutes: 45, dietary: ["Vegetarian (Eggless)"],
    miseEnPlace: ["Coffee cream prepared", "Mascarpone mousse ready", "Sponge baked", "Tuile garnish ready"],
    equipment: ["Moulds", "Whisk", "Spatula", "Dessert plate"],
    ingredients: [["Coffee sponge", 40, "g"], ["Mascarpone mousse", 40, "g"], ["Coffee cream", 20, "g"], ["Sable", 10, "g"], ["Tuile décor", 5, "g"]],
    steps: ["Layer sponge.", "Add mascarpone mousse.", "Add coffee cream.", "Top with sable and tuile.", "Chill to set.", "Serve chilled."],
    qualityCheck: ["Sponge moist and even", "Mousse smooth and airy", "Coffee cream light and stable", "Tuile crisp and delicate", "Layering neat and well-defined"],
    plating: "Dessert plate • Tuile and sable garnish.", holding: "Keep refrigerated 0–5 °C.\nConsume within 24 h.", allergens: "Contains: Gluten, Milk.",
    notes: "The balance of coffee, cream, and mascarpone is key. Allow the dessert to chill well for clean slices and enhanced flavour.",
    card: { chillTime: "2 h", serveTitle: "Serve chilled", serveText: "Enjoy at its best." },
  },
];

const slugify = (s: string) => s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function main() {
  const brand = await db.brand.findUniqueOrThrow({ where: { slug: "capiche" } });
  const category = await db.category.findUniqueOrThrow({ where: { brandId_slug: { brandId: brand.id, slug: "desserts" } } });
  const owner = await db.admin.findFirst({ where: { role: "OWNER", isActive: true } });

  // Listing is newest-first, so publish in reverse to keep the PDF order.
  const baseTime = Date.now();

  for (const [index, d] of DISHES.entries()) {
    const slug = slugify(d.title);
    const existing = await db.recipe.findFirst({ where: { brandId: brand.id, externalId: d.externalId ?? d.dishCode, deletedAt: null } });

    let heroImageId = existing?.heroImageId ?? null;
    if (!heroImageId) {
      const media = await uploadImage({
        buffer: await readFile(path.join(IMAGE_DIR, d.photo)),
        originalName: d.photo,
        alt: d.title,
        brandId: brand.id,
        uploadedById: owner?.id ?? null,
      });
      heroImageId = media.id;
    }

    const input = RecipeInputSchema.parse({
      brandId: brand.id,
      categoryId: category.id,
      externalId: d.externalId ?? d.dishCode,
      slug,
      title: d.title,
      excerpt: (d.description || d.summary || "").slice(0, 200) || null,
      description: d.description || null,
      heroImageId,
      prepMinutes: d.prepMinutes,
      cookMinutes: d.cookMinutes,
      restMinutes: d.restMinutes ?? null,
      totalMinutes: d.totalMinutes,
      servings: 1,
      yieldText: d.yieldText,
      course: "Dessert",
      dietary: d.dietary,
      equipment: d.equipment,
      notes: d.notes ?? null,
      dishCode: d.dishCode,
      author: d.author,
      approvedBy: d.approvedBy,
      effectiveDate: new Date(`${d.effective ?? "2026-04-16"}T12:00:00Z`),
      nextReviewDate: new Date(`${d.nextReview ?? "2027-03-16"}T12:00:00Z`),
      miseEnPlace: d.miseEnPlace,
      plating: d.plating,
      holding: d.holding,
      allergens: d.allergens,
      station: d.station,
      summary: d.summary,
      sopVersion: d.version ?? "1.0",
      qualityCheck: d.qualityCheck ?? [],
      customFields: { ...(d.timeText ? { timeText: d.timeText } : {}), ...(d.garnish?.length ? { garnish: d.garnish } : {}), ...(d.card ? { card: d.card } : {}) },
      ingredients: d.ingredients.map(([name, quantity, unit, groupLabel], position) => ({
        position,
        groupLabel: groupLabel ?? null,
        quantity,
        unit,
        name,
        raw: `${name} ${quantity ?? ""} ${unit}`.replace(/\s+/g, " ").trim(),
      })),
      steps: d.steps.map((body, position) => ({ phase: "COOK", position, body })),
      status: "PUBLISHED",
    });

    const data = {
      categoryId: input.categoryId,
      externalId: input.externalId,
      slug,
      title: input.title,
      excerpt: input.excerpt ?? null,
      description: input.description ?? null,
      heroImageId: input.heroImageId,
      prepMinutes: input.prepMinutes ?? null,
      cookMinutes: input.cookMinutes ?? null,
      restMinutes: input.restMinutes ?? null,
      totalMinutes: input.totalMinutes ?? null,
      servings: input.servings ?? null,
      yieldText: input.yieldText ?? null,
      course: input.course ?? null,
      dietary: input.dietary,
      equipment: input.equipment,
      notes: input.notes ?? null,
      dishCode: input.dishCode ?? null,
      author: input.author ?? null,
      approvedBy: input.approvedBy ?? null,
      effectiveDate: input.effectiveDate ?? null,
      nextReviewDate: input.nextReviewDate ?? null,
      miseEnPlace: input.miseEnPlace,
      plating: input.plating ?? null,
      holding: input.holding ?? null,
      allergens: input.allergens ?? null,
      station: input.station ?? null,
      summary: input.summary ?? null,
      sopVersion: input.sopVersion ?? null,
      qualityCheck: input.qualityCheck,
      customFields: input.customFields as Prisma.InputJsonValue,
      ingredientText: input.ingredients.map((i) => i.name).join(" "),
      status: "PUBLISHED" as const,
      publishedAt: new Date(baseTime - index * 1000),
      updatedById: owner?.id ?? null,
    } satisfies Prisma.RecipeUncheckedUpdateInput;

    const recipe = await db.$transaction(async (tx) => {
      if (existing) {
        await tx.recipeIngredient.deleteMany({ where: { recipeId: existing.id } });
        await tx.recipeStep.deleteMany({ where: { recipeId: existing.id } });
        return tx.recipe.update({
          where: { id: existing.id },
          data: { ...data, version: { increment: 1 }, ingredients: { create: input.ingredients }, steps: { create: input.steps } },
        });
      }
      return tx.recipe.create({
        data: { ...data, brandId: brand.id, createdById: owner?.id ?? null, ingredients: { create: input.ingredients }, steps: { create: input.steps } },
      });
    });

    console.log(`${existing ? "Updated" : "Created"} ${d.dishCode} ${d.title} → /capiche/recipes/${recipe.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
