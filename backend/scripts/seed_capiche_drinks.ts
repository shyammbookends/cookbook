/**
 * Adds the 6 Capiche DRINK SOP recipes (from "rec 9.pdf", one recipe per page) with their photos.
 * Photos are cropped from each PDF page into backend/data/capiche-drinks/photo-N-*.jpg.
 * Idempotent: recipes are matched on (brand, externalId = dish code) and updated in place.
 *
 * Run: npx tsx --conditions=react-server --tsconfig tsconfig.json backend/scripts/seed_capiche_drinks.ts
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/server/db";
import { uploadImage } from "@/server/media/upload";
import { RecipeInputSchema } from "@/lib/schemas/recipe";
import { Prisma } from "@/generated/prisma/client";

const IMAGE_DIR = path.join(process.cwd(), "backend/data/capiche-drinks");

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
  card?: Record<string, unknown>;
}

const DK = "Darshit Kanpariya";
const TIME_STAMPED = "Method (time-stamped)";
const PLATING_HOLDING = "Plating & Holding";
const PLATE_STD = "Portion: 1 drink\nServe immediately • Pass limit ≤ 2 min";
const SERVE_ICE_COLD = { serveTitle: "Serve immediately", serveText: "Enjoy it ice-cold." };

/** The drinks stat row: Yield (no ice) / Serve with ice / Build time / Diet. */
const drinkStats = (yieldMl: string, withIce: string, build: string, diet: string) => [
  { label: "Yield (no ice)", value: yieldMl, icon: "cup" },
  { label: "Serve with ice", value: withIce, icon: "ice" },
  { label: "Build time", value: build, icon: "clock" },
  { label: "Diet", value: diet, icon: "leaf" },
];

const DISHES: Dish[] = [
  {
    photo: "photo-1-lemon-iced-tea.jpg", dishCode: "DR-01", title: "Lemon Iced Tea",
    description: "A bright and refreshing blend of lemon juice and sugar syrup, shaken with premium iced tea for a perfectly balanced sweet–sour finish. Crisp, clean, and ideal for any occasion.",
    summary: null, author: "", approvedBy: DK, station: "Build in Glass",
    yieldText: "300 ml", prepMinutes: 0, cookMinutes: 0, totalMinutes: 0, dietary: ["Vegan"],
    miseEnPlace: [], equipment: ["Mixing glass", "Jigger", "Bar spoon", "Strainer", "Diamond-cut glass"],
    ingredients: [["Lemon juice", 30, "ml"], ["Sugar syrup", 60, "ml"], ["Iced tea (Tata Gold) – to 300 ml total (≈ 210 ml)", null, ""]],
    steps: [
      "Glass & ice (0:00–0:10): Fill with cubed ice.",
      "Build (0:10–0:35): Add lemon juice and sugar syrup.",
      "Top (0:35–1:00): Add iced tea to reach 300 ml net.",
      "Garnish & QC (1:00–1:20): Stir once; garnish with dried lemon.",
    ],
    qualityCheck: ["Lemon aroma is fresh and vibrant", "Sweet–sour balance is ideal", "Clear, bright, and well mixed", "Ice level appropriate for serving", "Garnish neat and visually appealing"],
    plating: PLATE_STD, holding: "Keep refrigerated 0–5 °C\nConsume within 24 h.", allergens: "",
    card: {
      glassware: "Diamond-cut", garnishInfo: "Dried lemon slice", effectiveInBox: true, panelIcon: "leaf", methodTitle: TIME_STAMPED, platingTitle: PLATING_HOLDING,
      stats: drinkStats("300 ml", "≈ 360 ml\n(350–370 ml)", "≈ 1:30 min", "Vegan"),
      ccp: "Bright tea aroma; balanced sweet–sour; clear; net 300 ml (no ice).",
      prepNote: "Prep in Appendix: Iced Tea (Tata Gold).",
      chefTip: "Use freshly squeezed lemon for maximum brightness and balance.",
      serveTitle: "Serve immediately", serveText: "Enjoy at its best.",
    },
  },
  {
    photo: "photo-2-mint-mojito.jpg", dishCode: "DR-02", title: "Mint Mojito",
    description: "A crisp and invigorating classic that combines zesty lime, cool mint, and a sparkling finish. Light, refreshing, and perfect for any time of day.",
    summary: null, author: "", approvedBy: DK, station: "Build in Glass",
    yieldText: "245 ml", prepMinutes: 0, cookMinutes: 0, totalMinutes: 0, dietary: ["Vegan"],
    miseEnPlace: [], equipment: ["Mixing glass", "Bar spoon", "Jigger", "Strainer", "Highball glass"],
    ingredients: [["Lemon juice", 30, "ml"], ["Mint syrup", 15, "ml"], ["Kinley Soda", 200, "ml"]],
    steps: [
      "Glass & ice (0:00–0:10): Fill with cubed ice.",
      "Build (0:10–0:25): Add lemon juice and mint syrup.",
      "Top (0:25–0:50): Add soda; gentle lift with bar spoon.",
      "Garnish & QC (0:50–1:10): Slap mint; place at rim.",
    ],
    qualityCheck: ["Bright, fresh mint aroma", "Balanced sweet–sour profile", "High effervescence and clarity", "Ice level appropriate for serving", "Garnish fresh and well presented"],
    plating: "Portion: 1 drink • Serve immediately\n• Pass limit ≤ 2 min", holding: "", allergens: "",
    card: {
      glassware: "Highball", garnishInfo: "Fresh mint sprig", effectiveInBox: true, panelIcon: "leaf", methodTitle: TIME_STAMPED, platingTitle: PLATING_HOLDING,
      stats: drinkStats("245 ml", "≈ 305 ml\n(295–315 ml)", "≈ 1:30 min", "Vegan"),
      ccp: "Highly effervescent; mint-forward aroma; net 245 ml (no ice).",
      prepNote: "Prep in Appendix: Mint Syrup;\nBase Sugar Syrup.",
      chefTip: "Slap the mint gently to release essential oils for maximum aroma and freshness.",
      serveTitle: "Serve immediately", serveText: "Enjoy at its best.",
    },
  },
  {
    photo: "photo-3-pina-colada.jpg", dishCode: "DR-03", title: "Pina Colada",
    description: "A timeless tropical classic, blending creamy coconut, sweet pineapple, and smooth vanilla for the perfect balance of rich, refreshing indulgence.",
    summary: null, author: "", approvedBy: DK, station: "Blender",
    yieldText: "300 ml", prepMinutes: 0, cookMinutes: 0, totalMinutes: 0, dietary: ["Vegetarian (dairy)"],
    miseEnPlace: [], equipment: ["Blender", "Jigger", "Scoop", "Measuring cup", "Cuban glass"],
    ingredients: [["Kara Coconut milk", 60, "ml"], ["Amul Gold milk", 60, "ml"], ["Pineapple jam", 120, "g"], ["Vanilla ice cream", null, "1 scoop"], ["Ice", null, "≈ 60 g (blend)"]],
    steps: [
      "Load (0:00–0:20): All ingredients incl. ice in blender.",
      "Blend (0:20–0:50): Smooth, ~30 s.",
      "Pour & garnish (0:50–1:20): Into chilled glass; garnish.",
    ],
    qualityCheck: ["Smooth, creamy texture", "Balanced sweetness", "Tropical aroma, refreshing finish", "Thick yet easy to sip", "Garnish fresh and well presented"],
    plating: "Portion: 1 drink • Serve immediately • Pass limit ≤ 2 min", holding: "", allergens: "",
    card: {
      glassware: "Cuban glass", garnishInfo: "Pineapple leaves + slice", effectiveInBox: true, panelIcon: "leaf", methodTitle: TIME_STAMPED, platingTitle: PLATING_HOLDING,
      stats: drinkStats("300 ml", "≈ 360 ml", "1:30 min", "Vegetarian\n(dairy)"),
      ccp: "Smooth, no shards; tropical aroma; thick yet sippable; net 300 ml (no ice).",
      prepNote: "Prep in Appendix: Pineapple Jam.",
      chefTip: "Use good quality pineapple jam for authentic tropical flavour. Blend until smooth and creamy for the best texture.",
      serveTitle: "Serve immediately", serveText: "Enjoy it chilled.",
    },
  },
  {
    photo: "photo-4-moscow-mule.jpg", dishCode: "DR-04", title: "Moscow Mule",
    description: "A bold, refreshing classic with a zesty kick. Crisp ginger beer, bright lemon, and aromatic herbs come together in an icy-cold copper mug for the ultimate balance of spice and citrus.",
    summary: null, author: "", approvedBy: DK, station: "Build in Glass",
    yieldText: "320 ml", prepMinutes: 0, cookMinutes: 0, totalMinutes: 0, dietary: ["Vegan"],
    miseEnPlace: [], equipment: ["Mule mug", "Jigger", "Bar spoon", "Muddler or zester", "Measuring cup"],
    ingredients: [["Lemon juice", 30, "ml"], ["Fresh ginger zest", null, "pinch"], ["Gunsberg Ginger Beer – (≈ 285–300 ml)", null, ""]],
    steps: [
      "Load (0:00–0:10): Fill mule mug with cubed ice.",
      "Build (0:10–0:25): Add lemon juice and ginger zest into mug.",
      "Top (0:25–0:50): Add ginger beer to 320 ml; stir gently with bar spoon; lift once.",
      "Garnish & QC (0:50–1:15): Garnish with lemon wheel and rosemary sprig.",
    ],
    qualityCheck: ["Bright, zesty lemon aroma", "Pronounced ginger warmth", "High carbonation and crisp finish", "Well balanced, not too sweet", "Garnish fresh and aromatic", "Copper mug well chilled"],
    plating: "Portion: 1 drink • Serve immediately • Pass limit ≤ 2 min", holding: "", allergens: "",
    card: {
      glassware: "Mule mug", garnishInfo: "Lemon wheel + rosemary sprig", effectiveInBox: true, panelIcon: "leaf", methodTitle: TIME_STAMPED, platingTitle: PLATING_HOLDING,
      stats: drinkStats("320 ml", "≈ 380 ml", "≤ 1:30 min", "Vegan"),
      ccp: "Fiery ginger; high carbonation; clean, bright; no over-dilution.",
      prepNote: "Prep in Appendix: Ginger Beer.",
      chefTip: "Use freshly grated ginger zest and quality ginger beer for a fiery, aromatic mule.",
      ...SERVE_ICE_COLD,
    },
  },
  {
    photo: "photo-5-sunset-cocktail.jpg", dishCode: "DR-05", title: "Sunset Cocktail",
    description: "A vibrant, tropical refresher with a stunning sunset gradient. Bright citrus, floral hibiscus, and a hint of heat come together for a perfectly balanced, effervescent sip.",
    summary: null, author: "", approvedBy: DK, station: "Build in Glass",
    yieldText: "230 ml", prepMinutes: 0, cookMinutes: 0, totalMinutes: 0, dietary: ["Vegan"],
    miseEnPlace: [], equipment: ["Bamboo glass", "Jigger", "Bar spoon", "Muddler (optional)", "Measuring cup"],
    ingredients: [["Lemon juice", 15, "ml"], ["Orange juice", 60, "ml"], ["Hibiscus syrup", 15, "ml"], ["Sprite – to 230 ml total (≈ 140 ml)", null, ""]],
    steps: [
      "Glass & ice (0:00–0:10): Fill bamboo glass with cubed ice.",
      "Build (0:10–0:30): Add lemon juice, orange juice, and hibiscus syrup.",
      "Top (0:30–0:55): Add Sprite to 230 ml; pour gently over the back of a spoon for a layered effect; gentle lift.",
      "Garnish & QC (0:55–1:15): Garnish with fresh jalapeño slice on rim.",
    ],
    qualityCheck: ["Clear gradient from red to orange to gold", "Bright, balanced citrus flavor", "Subtle floral note from hibiscus", "Crisp, refreshing carbonation", "Garnish fresh and vibrant", "Glass well chilled"],
    plating: "Portion: 1 drink • Serve immediately • Pass limit ≤ 2 min", holding: "", allergens: "",
    card: {
      glassware: "Bamboo", garnishInfo: "Fresh jalapeño slice on rim", effectiveInBox: true, panelIcon: "leaf", methodTitle: TIME_STAMPED, platingTitle: PLATING_HOLDING,
      stats: drinkStats("230 ml", "≈ 290 ml", "≤ 1:30 min", "Vegan"),
      ccp: "Layered sunset hue; bright citrus; floral note; crisp and refreshing.",
      prepNote: "Prep in Appendix: Hibiscus Syrup.",
      chefTip: "Gently pour Sprite over the back of a spoon for a cleaner gradient.",
      ...SERVE_ICE_COLD,
    },
  },
  {
    photo: "photo-6-tamarind-fizz.jpg", dishCode: "DR-08", title: "Tamarind Fizz",
    description: "A tangy, bright and lightly spiced refresher that balances sweet tamarind with ginger and a lively fizz. Finished with a fragrant basil garnish for an aromatic, herbaceous lift.",
    summary: null, author: "", approvedBy: DK, station: "Build in Glass",
    yieldText: "220 ml", prepMinutes: 0, cookMinutes: 0, totalMinutes: 0, dietary: ["Vegan"],
    miseEnPlace: [], equipment: ["Bamboo (round line) glass", "Jigger", "Bar spoon", "Muddler (optional)", "Measuring cup"],
    ingredients: [["Tamarind syrup", 45, "ml"], ["Pinch of salt", null, "—"], ["Schweppes Ginger Ale – to 220 ml total (≈ 170 ml)", null, ""]],
    steps: [
      "Glass & ice (0:00–0:10): Fill bamboo glass with cubed ice.",
      "Build (0:10–0:25): Add tamarind syrup and salt.",
      "Top (0:25–0:50): Top with Schweppes Ginger Ale to 220 ml; stir gently; lift once.",
      "Garnish & QC (0:50–1:15): Garnish with basil.",
    ],
    qualityCheck: ["Balanced tangy sweetness", "Bright, zesty citrus and ginger notes", "Clean, fizzy and refreshing", "No sediment or pulp", "Basil garnish fresh and aromatic", "Glass well chilled"],
    plating: "Portion: 1 drink • Serve immediately • Pass limit ≤ 2 min", holding: "", allergens: "",
    card: {
      glassware: "Bamboo (round line)", garnishInfo: "Basil", effectiveInBox: true, panelIcon: "leaf", methodTitle: TIME_STAMPED, platingTitle: PLATING_HOLDING,
      stats: drinkStats("220 ml", "≈ 280 ml", "≤ 1:30 min", "Vegan"),
      ccp: "Tangy, bright; lively carbonation.",
      prepNote: "Prep in Appendix: Tamarind Syrup.",
      ...SERVE_ICE_COLD,
    },
  },
];

const slugify = (s: string) => s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function main() {
  const brand = await db.brand.findUniqueOrThrow({ where: { slug: "capiche" } });
  const category = await db.category.findUniqueOrThrow({ where: { brandId_slug: { brandId: brand.id, slug: "drinks" } } });
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
      prepMinutes: d.prepMinutes || null,
      cookMinutes: d.cookMinutes || null,
      restMinutes: d.restMinutes ?? null,
      totalMinutes: d.totalMinutes || null,
      servings: 1,
      yieldText: d.yieldText,
      course: "Drink",
      dietary: d.dietary,
      equipment: d.equipment,
      notes: d.notes ?? null,
      dishCode: d.dishCode,
      author: d.author || null,
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
