/**
 * Adds the five Capiche SALADS SOP recipes (from rec2.pdf) with their photos.
 * Idempotent: recipes are matched on (brand, externalId = dish code) and updated in place.
 *
 * Run: npx tsx --conditions=react-server --tsconfig tsconfig.json backend/scripts/seed_capiche_salads.ts
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/server/db";
import { uploadImage } from "@/server/media/upload";
import { RecipeInputSchema } from "@/lib/schemas/recipe";
import { Prisma } from "@/generated/prisma/client";

const IMAGE_DIR = path.join(process.cwd(), "backend/data/capiche-salads");
const EFFECTIVE = new Date("2026-04-16T12:00:00Z");
const NEXT_REVIEW = new Date("2027-03-16T12:00:00Z");

type Ing = [name: string, quantity: number | null, unit: string, groupLabel?: string];

interface SaladSop {
  dishCode: string;
  slug: string;
  image: string;
  title: string;
  description: string | null;
  summary: string | null;
  author: string;
  approvedBy: string;
  yieldText: string;
  prepMinutes: number;
  cookMinutes: number | null;
  totalMinutes: number;
  dietary: string[];
  miseEnPlace: string[];
  equipment: string[];
  ingredients: Ing[];
  steps: string[];
  qualityCheck: string[];
  plating: string | null;
  holding: string | null;
  allergens: string;
  notes: string | null;
}

const SALADS: SaladSop[] = [
  {
    dishCode: "SL-01",
    slug: "caesar-salad",
    image: "caesar-salad-sl-01.png",
    title: "Caesar Salad",
    description: null,
    summary: null,
    author: "Bookends Culinary",
    approvedBy: "Husen Khan",
    yieldText: "1 portion\n(~200 g)",
    prepMinutes: 5,
    cookMinutes: 0,
    totalMinutes: 5,
    dietary: ["V"],
    miseEnPlace: ["Wash and dry lettuce", "Prepare Caesar mayo", "Cut onion rings", "Croutons ready"],
    equipment: ["Mixing bowl", "Tongs", "Digital scale", "Salad bowl"],
    ingredients: [
      ["Romaine", 50, "g"],
      ["Iceberg", 50, "g"],
      ["Onion", 20, "g"],
      ["Salt", 1, "g"],
      ["Black pepper", 0.5, "g"],
      ["Parmesan (grated)", 6, "g"],
      ["Crispy croutons", 10, "g"],
      ["Caesar mayo", 50, "g"],
    ],
    steps: [
      "Tear leaves.",
      "Slice onion rings.",
      "Toss lettuce with mayo, salt, pepper.",
      "Add parmesan and croutons.",
      "Check seasoning.",
      "Plate; garnish with onion rings.",
    ],
    qualityCheck: [],
    plating: "Serve in salad bowl.\nTop with croutons and grated parmesan.",
    holding: "Assemble to order.\nDo not pre-dress leaves.",
    allergens: "Contains: Gluten, Milk\nCross-contact: kitchen handles tree nuts, peanuts, sesame.",
    notes: null,
  },
  {
    dishCode: "SL-02",
    slug: "burrata-salad-sl-02",
    image: "burrata-salad-sl-02.png",
    title: "Burrata Salad",
    description:
      "Creamy burrata with fresh greens, citrus, cherry tomatoes, olives and toasted pine nuts, finished with olive oil and hot honey.",
    summary:
      "Fresh, vibrant salad with creamy burrata at the centre, balanced with citrus, toasted nuts and a touch of hot honey.",
    author: "Bookends Culinary",
    approvedBy: "Husen Khan",
    yieldText: "1 portion\n(~250 g)",
    prepMinutes: 6,
    cookMinutes: 0,
    totalMinutes: 6,
    dietary: ["V"],
    miseEnPlace: ["Wash/dry lettuce & arugula", "Cut cherry tomatoes", "Segment grapefruit", "Toast pine nuts"],
    equipment: ["Mixing bowl", "Tongs", "Pasta bowl", "Digital scale"],
    ingredients: [
      ["Arugula", 10, "g"],
      ["Iceberg", 10, "g"],
      ["Romaine", 10, "g"],
      ["Curly romaine", 10, "g"],
      ["Cherry tomato", 30, "g"],
      ["Grapefruit", 30, "g"],
      ["Pine nuts", 5, "g"],
      ["Black olives", 40, "g"],
      ["Vinaigrette", 4, "g"],
      ["Olive oil", 2, "g"],
      ["Sea salt", 2, "g"],
      ["Hot honey", 2, "g"],
      ["Edible flower", 1, "g"],
      ["Baby burrata", 80, "g"],
    ],
    steps: [
      "Toss leaves with vinaigrette & salt.",
      "Add cherry tomato, grapefruit, olives.",
      "Place burrata in centre.",
      "Arrange salad mix around.",
      "Sprinkle pine nuts; drizzle olive oil & hot honey.",
      "Garnish with edible flowers.",
    ],
    qualityCheck: [],
    plating: "Serve in a pasta bowl.\nBurrata centred; greens around; flowers garnish.",
    holding: "Assemble to order.\nKeep burrata chilled.",
    allergens: "Contains: Gluten, Milk, Tree nuts (pine nuts).\nCross-contact possible.",
    notes: null,
  },
  {
    dishCode: "SL-03",
    slug: "burrata-salad-sl-03",
    image: "burrata-salad-sl-03.png",
    title: "Burrata Salad",
    description:
      "Creamy burrata on a bed of sundried tomato pesto, topped with confit cherry tomatoes, toasted hazelnuts and fresh salad greens.",
    summary: "Vibrant tomato pesto base with creamy burrata, sweet confit tomatoes, toasted hazelnuts and crisp greens.",
    author: "Bookends Culinary",
    approvedBy: "Husen Khan",
    yieldText: "1 portion\n(~250 g)",
    prepMinutes: 10,
    cookMinutes: null,
    totalMinutes: 10,
    dietary: ["V"],
    miseEnPlace: [
      "Prepare sundried tomato pesto",
      "Toast hazelnuts",
      "Prep burrata & salad greens",
      "Confit cherry tomatoes ready",
    ],
    equipment: ["Blender", "Mixing bowl", "Knife & board", "Flat serving plate"],
    ingredients: [
      ["Burrata cheese", 127, "g"],
      ["Iceberg, romaine, purple cabbage, arugula", 30, "g"],
      ["Sundried tomato pesto", 90, "g"],
      ["Confit cherry tomato", 25, "g"],
      ["Hazelnut", 5, "g"],
      ["Fried fettuccine chip", 5, "g"],
      ["Seasoning TT", null, "to taste"],
      ["Olive oil", 8, "g", "Sundried Tomato Pesto:"],
      ["Whole red chilli", 4, "g", "Sundried Tomato Pesto:"],
      ["Pomodoro sauce", 125, "g", "Sundried Tomato Pesto:"],
      ["Sundried tomato", 15, "g", "Sundried Tomato Pesto:"],
      ["Vinegar", 8, "g", "Sundried Tomato Pesto:"],
      ["Lemon juice", 3, "g", "Sundried Tomato Pesto:"],
      ["Salt", 1, "g", "Sundried Tomato Pesto:"],
      ["Sugar", 5, "g", "Sundried Tomato Pesto:"],
      ["Boiled chickpeas", 50, "g", "Sundried Tomato Pesto:"],
    ],
    steps: [
      "Blend all pesto ingredients until smooth.",
      "Spread pesto circularly on flat plate.",
      "Add confit cherry tomatoes and toasted hazelnuts.",
      "Place burrata in centre; slit open slightly.",
      "Add chopped salad mix; drizzle olive oil.",
    ],
    qualityCheck: [
      "Pesto base spread evenly",
      "Burrata centred & lightly slit",
      "Hazelnuts toasted, not burnt",
      "Fettuccine chip placed last for crunch",
    ],
    plating: "Flat plate • Burrata centred • Pesto base visible.\nAssemble to order.",
    holding: "Build-to-order only.\nNo holding.",
    allergens: "Contains: Milk, Tree nuts (hazelnuts).\nCross-contact: Gluten, sesame.",
    notes: null,
  },
  {
    dishCode: "PR-A01",
    slug: "persimmon-salad",
    image: "persimmon-salad-pr-a01.png",
    title: "Persimmon Salad",
    description:
      "Sweet persimmon, strawberry and creamy burrata on a bed of arugula, finished with caviar, toasted pine nuts, edible flowers and hot honey.",
    summary: "A refreshing balance of sweet, creamy and savoury with bright flavors and elegant textures.",
    author: "Bookends Culinary",
    approvedBy: "Husen Khan",
    yieldText: "1 portion",
    prepMinutes: 10,
    cookMinutes: 0,
    totalMinutes: 10,
    dietary: ["Vegetarian"],
    miseEnPlace: [
      "Wash and dry arugula",
      "Quarter persimmon and strawberry",
      "Mash burrata to soft dollops",
      "Toast pine nuts",
      "Vinaigrette ready",
      "Caviar portioned",
      "Edible flowers ready",
    ],
    equipment: ["Chilled serving plate", "Mixing bowl", "Tongs", "Digital scale", "Spoon"],
    ingredients: [
      ["Arugula", 30, "g"],
      ["Vinaigrette", 12, "g"],
      ["Persimmon", 80, "g"],
      ["Strawberry", 50, "g"],
      ["Burrata", 60, "g"],
      ["Caviar", 20, "g"],
      ["Pine nuts", 5, "g"],
      ["Edible flowers", 1, "pc"],
      ["Salt", 2, "g"],
      ["Black pepper", 1, "g"],
      ["Hot honey", 5, "g"],
    ],
    steps: [
      "Toss arugula with vinaigrette; do not overdress.",
      "Arrange on chilled serving plate.",
      "Place persimmon and strawberry evenly over greens.",
      "Add burrata as soft dollops; season lightly.",
      "Spoon caviar on burrata; sprinkle pine nuts and edible flowers.",
      "Drizzle hot honey; serve immediately.",
    ],
    qualityCheck: ["Greens crisp", "Burrata creamy", "Balanced sweet-acid profile", "Clean, elegant presentation."],
    plating: "Chilled plate • Assemble to order •\nNo pre-dressing.",
    holding: "Serve immediately.\nKeep all components chilled.",
    allergens: "Contains: Milk, Tree nuts (pine nuts).\nCross-contact: Gluten, sesame.",
    notes: null,
  },
  {
    dishCode: "CA-S01",
    slug: "summer-burrata-salad",
    image: "summer-burrata-salad-ca-s01.png",
    title: "Summer Burrata Salad",
    description:
      "A vibrant, refreshing salad with crisp greens, juicy fruits, creamy burrata, and a hint of sweetness from hot honey. Light, balanced, and perfect for warm days.",
    summary: null,
    author: "Capiche Culinary",
    approvedBy: "Hussain Khan",
    yieldText: "1 portion",
    prepMinutes: 20,
    cookMinutes: null,
    totalMinutes: 30,
    dietary: ["Vegetarian"],
    miseEnPlace: [],
    equipment: [],
    ingredients: [
      ["Processed Iceberg lettuce", 31, "g"],
      ["Processed Romaine lettuce", 15, "g"],
      ["Processed Lollo Rosso", 15, "g"],
      ["Salt", 1, "g"],
      ["Black pepper", 0.5, "g"],
      ["Vinaigrette", 10, "g"],
      ["Arugula", 15, "g"],
      ["Burrata", 120, "g"],
      ["Olive oil", 2, "g"],
      ["Crushed black pepper", null, "to taste"],
      ["Roasted hazelnuts", 5, "g"],
      ["Granola (chopped)", null, "to taste"],
      ["Mango (cubed)", 80, "g"],
      ["Grapefruit (cubed)", 35, "g"],
      ["Cherry tomatoes", 10, "g"],
      ["Edible flowers", 3, "pieces"],
      ["Hot honey drizzle", 5, "g"],
    ],
    steps: [
      "Process iceberg lettuce, romaine lettuce, and Lollo Rosso. Give them an ice bath to keep them crisp.",
      "In a large bowl, combine all processed leaves. Add salt, black pepper, and vinaigrette. Add arugula and toss well.",
      "Cut mango and grapefruit into cubes.",
      "Plate the mixed leaves. Place a burrata on top.",
      "Drizzle olive oil over the burrata and add crushed black pepper.",
      "Arrange cubed mango, grapefruit, and cherry tomatoes around the burrata. Add edible flowers.",
      "Scatter roasted hazelnuts and chopped granola.",
      "Finish with a drizzle of hot honey.",
    ],
    qualityCheck: [
      "Leaves crisp",
      "Burrata fresh and creamy",
      "Fruit ripe and vibrant",
      "Balanced sweet-acid profile",
      "Clean, elegant presentation.",
    ],
    plating: "Kitchen / Plating: Cold / Plating\nPortion size: 1 portion",
    holding: "Service temp: Chilled",
    allergens: "Dairy, Nuts",
    notes: [
      "FRESH & LIGHT",
      "Crisp greens, seasonal fruits, and creamy burrata for a refreshing, balanced salad.",
      "",
      "SWEET & TANGY",
      "A bright vinaigrette with a drizzle of hot honey for the perfect sweet–acid balance.",
      "",
      "BEAUTIFUL & VIBRANT",
      "Finished with edible flowers, granola, and crunchy hazelnuts for texture and visual appeal.",
      "",
      "CHEF'S NOTES",
      "• Keep greens chilled and dry before mixing.",
      "• Add hot honey just before service for best flavour.",
      "• Use ripe but firm fruits for clean presentation.",
      "• Toss leaves gently to avoid bruising.",
      "",
      "* All weights are approximate.",
    ].join("\n"),
  },
];

async function main() {
  const brand = await db.brand.findUniqueOrThrow({ where: { slug: "capiche" } });
  const category = await db.category.findUniqueOrThrow({
    where: { brandId_slug: { brandId: brand.id, slug: "salads" } },
  });
  const owner = await db.admin.findFirst({ where: { role: "OWNER", isActive: true } });

  // Listing is newest-first, so publish in reverse to show SL-01 first.
  const baseTime = Date.now();

  for (const [index, s] of SALADS.entries()) {
    const buffer = await readFile(path.join(IMAGE_DIR, s.image));
    const media = await uploadImage({
      buffer,
      originalName: s.image,
      alt: s.title,
      brandId: brand.id,
      uploadedById: owner?.id ?? null,
    });

    const input = RecipeInputSchema.parse({
      brandId: brand.id,
      categoryId: category.id,
      externalId: s.dishCode,
      slug: s.slug,
      title: s.title,
      excerpt: s.description,
      description: s.description,
      heroImageId: media.id,
      prepMinutes: s.prepMinutes,
      cookMinutes: s.cookMinutes,
      totalMinutes: s.totalMinutes,
      servings: 1,
      yieldText: s.yieldText,
      course: "Salad",
      dietary: s.dietary,
      equipment: s.equipment,
      notes: s.notes,
      dishCode: s.dishCode,
      author: s.author,
      approvedBy: s.approvedBy,
      effectiveDate: EFFECTIVE,
      nextReviewDate: NEXT_REVIEW,
      miseEnPlace: s.miseEnPlace,
      plating: s.plating,
      holding: s.holding,
      allergens: s.allergens,
      station: "Cold Station",
      summary: s.summary,
      sopVersion: "1.0",
      qualityCheck: s.qualityCheck,
      ingredients: s.ingredients.map(([name, quantity, unit, groupLabel], position) => ({
        position,
        groupLabel: groupLabel ?? null,
        quantity,
        unit,
        name,
        raw: `${name} ${quantity ?? ""} ${unit}`.replace(/\s+/g, " ").trim(),
      })),
      steps: s.steps.map((body, position) => ({ phase: "COOK", position, body })),
      status: "PUBLISHED",
    });

    const data = {
      categoryId: input.categoryId,
      externalId: input.externalId,
      slug: s.slug,
      title: input.title,
      excerpt: input.excerpt ?? null,
      description: input.description ?? null,
      heroImageId: input.heroImageId,
      prepMinutes: input.prepMinutes ?? null,
      cookMinutes: input.cookMinutes ?? null,
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
      ingredientText: input.ingredients.map((i) => i.name).join(" "),
      status: "PUBLISHED" as const,
      publishedAt: new Date(baseTime - index * 1000),
      updatedById: owner?.id ?? null,
    } satisfies Prisma.RecipeUncheckedUpdateInput;

    const existing = await db.recipe.findFirst({
      where: { brandId: brand.id, externalId: s.dishCode, deletedAt: null },
    });

    const recipe = await db.$transaction(async (tx) => {
      if (existing) {
        await tx.recipeIngredient.deleteMany({ where: { recipeId: existing.id } });
        await tx.recipeStep.deleteMany({ where: { recipeId: existing.id } });
        return tx.recipe.update({
          where: { id: existing.id },
          data: {
            ...data,
            version: { increment: 1 },
            ingredients: { create: input.ingredients },
            steps: { create: input.steps },
          },
        });
      }
      return tx.recipe.create({
        data: {
          ...data,
          brandId: brand.id,
          createdById: owner?.id ?? null,
          ingredients: { create: input.ingredients },
          steps: { create: input.steps },
        },
      });
    });

    console.log(`${existing ? "Updated" : "Created"} ${s.dishCode} ${s.title} → /capiche/recipes/${recipe.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
