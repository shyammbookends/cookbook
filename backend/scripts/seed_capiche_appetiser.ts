/**
 * Adds the 8 Capiche APPETISER SOP recipes (from "rec 6.pdf", one recipe per page) with their photos.
 * Photos are cropped from each PDF page into backend/data/capiche-appetiser/photo-N-*.jpg.
 * Idempotent: recipes are matched on (brand, externalId = dish code) and updated in place.
 *
 * Run: npx tsx --conditions=react-server --tsconfig tsconfig.json backend/scripts/seed_capiche_appetiser.ts
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/server/db";
import { uploadImage } from "@/server/media/upload";
import { RecipeInputSchema } from "@/lib/schemas/recipe";
import { Prisma } from "@/generated/prisma/client";

const IMAGE_DIR = path.join(process.cwd(), "backend/data/capiche-appetiser");
const EFFECTIVE = "2026-04-16";
const NEXT_REVIEW = "2027-03-16";

type Ing = [name: string, quantity: number | null, unit: string, groupLabel?: string];

interface Dish {
  photo: string;
  dishCode: string;
  title: string;
  description: string;
  summary: string | null;
  author: string;
  approvedBy: string;
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
}

const BH = "Bookends Hospitality";
const BC = "Bookends Culinary";
const HK = "Husen Khan";
const NUTS = "Cross-contact: kitchen handles tree nuts, peanuts, sesame.";

const DISHES: Dish[] = [
  {
    photo: "photo-1-roasted-red-bell-pepper-soup.jpg", dishCode: "SP-01", title: "Roasted Red Bell Pepper Soup",
    description: "Silky roasted red bell pepper soup finished with pesto and served with warm bread.",
    summary: "Silky, smoky and vibrant soup with the natural sweetness of roasted peppers, finished with pesto and served with warm, crusty bread.",
    author: BH, approvedBy: HK, station: "Hot Range",
    yieldText: "1 portion\n(~300 ml soup\n+ 70 g bread)",
    prepMinutes: 10, cookMinutes: 5, totalMinutes: 15, timeText: { prep: "10 min\n(+ roasting)", cook: "5 min", total: "~15 min" },
    dietary: ["V"],
    miseEnPlace: ["Roasted bell pepper paste portioned 120 g", "Sourdough slices 70 g; garlic butter 5 g", "Pesto, sour cream, black sesame ready"],
    equipment: ["Oven/open flame for roasting", "High-speed blender + fine strainer (opt.)", "Saucepan", "Grill/toaster", "Ladle", "Digital scale"],
    ingredients: [
      ["Red bell peppers", 650, "g (batch)"], ["Onion", 90, "g"], ["Garlic", 16, "g"], ["Tomato", 70, "g"],
      ["Roasted bell pepper paste", 120, "g (per portion)"], ["Water", 160, "g"], ["Salt", 2, "g"], ["Black pepper", 0.5, "g"],
      ["Hot sauce", 0.5, "g"], ["Sour cream", 5, "g"], ["Pesto", 5, "g"], ["Sourdough", 70, "g"], ["Garlic butter", 5, "g"],
    ],
    steps: [
      "Roast veg until soft/charred; cool. Peel peppers if desired.",
      "Blend smooth; strain if desired. Chill; portion 120 g per serve.",
      "Melt a little CDP butter; add 120 g paste, sauté 1 min. Add 160 g water; season; add sour cream; simmer low 3–4 min.",
      "Spread 5 g garlic butter on 70 g sourdough; toast until crisp.",
      "Bowl soup; swirl pesto; sprinkle sesame. Serve hot with bread.",
    ],
    plating: "Warm bowl with pesto swirl & sesame;\nbread on side.",
    holding: "Cook to order; serve immediately.\nKeep roasted paste chilled (0–5 °C). No hot holding.",
    allergens: "Contains: Milk, Sesame; may contain Tree nuts (pesto).\nCross-contact possible with Gluten (bread).",
  },
  {
    photo: "photo-2-arancini.jpg", dishCode: "SN-01", title: "Arancini",
    description: "Crispy risotto balls with molten mozzarella, served with hot mayo & green garlic.",
    summary: "Crispy on the outside, creamy on the inside. Golden risotto balls with a molten mozzarella centre, finished with hot mayo and fresh green garlic.",
    author: BH, approvedBy: HK, station: "Hot Range",
    yieldText: "1 plate\nPortion: 6 balls (~115–120 g net)",
    prepMinutes: 10, cookMinutes: 5, totalMinutes: 15, timeText: { prep: "10 min", cook: "5 min", total: "15 min" },
    dietary: ["V"],
    miseEnPlace: [
      "Cook risotto rice with peppers, chilli, herbs, cream, parmesan, basil, parsley",
      "Cool and portion rice mix",
      "Pre-portioned mozzarella cubes 3 g each",
      "Arancini batter ready (milk + maida)",
      "Panko bread crumbs ready",
      "Fryer oil preheated to 180 °C",
    ],
    equipment: ["Deep fryer (180 °C)", "Mixed bowls", "Digital scale", "Absorbent paper"],
    ingredients: [
      ["Cooked risotto rice mix", 96, "g (16 g x 6)"], ["Mozzarella", 18, "g (3 g x 6)"], ["Arancini batter", 96, "g (16 g x 6)"],
      ["Panko crumbs", 12, "g (2 g x 6)"], ["Frying oil", null, "As needed"],
    ],
    steps: [
      "Prepare rice mix; cool completely.",
      "Weigh 16 g rice mix, add 3 g mozzarella, shape into ball (~19 g). Repeat for 6.",
      "Dip into batter.",
      "Coat with panko crumbs.",
      "Deep fry at 180 °C for ~4–5 min; core ≈ 74 °C.",
      "Drain; plate with hot mayo & green garlic.",
    ],
    plating: "Serve 6 balls in snack plate/bowl.\nGarnish with hot mayo & green garlic.",
    holding: "Fry-to-order only • Serve immediately\nNo hot holding • Do not reheat fried balls.",
    allergens: `Contains: Gluten, Milk\n${NUTS}`,
  },
  {
    photo: "photo-3-dough-balls.jpg", dishCode: "SN-02", title: "Dough Balls",
    description: "Soft, golden dough balls tossed in melted garlic butter and finished with fresh parsley.",
    summary: "Warm, fluffy dough balls, brushed with garlic butter and parsley for a rich, aromatic finish.",
    author: BC, approvedBy: HK, station: "Hot Station",
    yieldText: "1 portion\n(~150 g dough)\n(6–8 balls)",
    prepMinutes: 5, cookMinutes: 2, totalMinutes: 7, timeText: { prep: "5 min", cook: "2 min", total: "~7 min" },
    dietary: ["V"],
    miseEnPlace: ["Pre-portioned dough 150 g", "Chop garlic/parsley", "Melt butter"],
    equipment: ["Deck oven (preheat 350 °C)", "Screen tray", "Mixing bowl", "Small pasta bowl"],
    ingredients: [["Dough", 150, "g"], ["Garlic", 10, "g"], ["Butter", 20, "g"], ["Parsley", 3, "g"], ["Green garlic", 2, "g"]],
    steps: [
      "Divide dough into 6–8 × ~20 g balls.",
      "Roll and place on screen.",
      "Bake at 350 °C ~2 min until puffed.",
      "Toss in melted butter, garlic, parsley.",
      "Garnish with green garlic.",
      "Serve immediately with garlic aioli & ghaslet butter.",
    ],
    plating: "Small pasta bowl.\nGarnish with green garlic.",
    holding: "Bake to order.\nNo holding.",
    allergens: `Contains: Gluten, Milk\n${NUTS}`,
  },
  {
    photo: "photo-4-garlic-bread.jpg", dishCode: "SN-03", title: "Garlic Bread",
    description: "Crispy baked bread stuffed with creamy cheese, brushed with garlic butter and finished with fresh green garlic.",
    summary: "Warm, cheesy garlic bread with a buttery finish and fresh green garlic for extra aroma and flavor.",
    author: BC, approvedBy: HK, station: "Hot Station",
    yieldText: "1 portion\n(~105 g bread)",
    prepMinutes: 5, cookMinutes: 3, totalMinutes: 8, timeText: { prep: "5 min", cook: "3 min", total: "~8 min" },
    dietary: ["V"],
    miseEnPlace: ["Bake bread base (~105 g)", "Prepare cream cheese stuffing", "Chop garlic/green garlic"],
    equipment: ["Deck oven (preheat 350 °C)", "Microwave", "Knife", "Brush", "Small pasta bowl"],
    ingredients: [["Bread base", 105, "g"], ["Cream cheese", 60, "g"], ["Butter", 10, "g"], ["Garlic", 10, "g"], ["Green garlic (garnish)", 7, "g"]],
    steps: [
      "Bake base; cool slightly.",
      "Deep cut into 8 wedges.",
      "Stuff cream cheese between cuts.",
      "Brush with butter + chopped garlic.",
      "Microwave 30 s.",
      "Bake at 350 °C for 2 min until golden; garnish green garlic.",
    ],
    plating: "Small pasta bowl.\nGarnish with green garlic.",
    holding: "Bake to order.\nNo holding.",
    allergens: `Contains: Gluten, Milk\n${NUTS}`,
  },
  {
    photo: "photo-5-pasta-fritti-2-0.jpg", dishCode: "PS-10", title: "Pasta Fritti 2.0",
    description: "Crispy, golden pasta fritti filled with creamy ricotta and mozzarella, coated in seasoned breadcrumbs and served with garlic ranch and hot tomato dip.",
    summary: "Crispy outside, creamy inside and full of flavour. Perfect with ranch and spicy tomato dip.",
    author: BC, approvedBy: HK, station: "Hot Range",
    yieldText: "1 portion\n(2 pcs)",
    prepMinutes: 15, cookMinutes: 5, restMinutes: 10, totalMinutes: 20, timeText: { prep: "15 min", cook: "5 min", total: "~20 min" },
    dietary: ["Vegetarian"],
    miseEnPlace: [
      "Prepare ricotta filling", "Cut mozzarella into sticks", "Prepare tomato paste",
      "Make batter (flour + water + seasoning)", "Set up crumb station (bread crumbs)",
    ],
    equipment: ["Mixing bowl", "Knife & chopping board", "Spoon / spatula", "Freezer", "Fryer (160–180 °C)", "Deck oven", "Tongs"],
    ingredients: [
      ["Ricotta", 200, "g", "FILLING:"], ["Oregano", 5, "g", "FILLING:"], ["Chilli flakes", 3, "g", "FILLING:"], ["Parsley", 10, "g", "FILLING:"],
      ["Parmesan", 20, "g", "FILLING:"], ["Thyme", 5, "g", "FILLING:"], ["Salt & pepper", null, "TT", "FILLING:"],
      ["Pasta sheet", 22, "g x 2", "PER PORTION (2 PCS):"], ["Tomato paste", null, "TT", "PER PORTION (2 PCS):"],
      ["Mozzarella", 20, "g each", "PER PORTION (2 PCS):"], ["Ricotta filling", 15, "g each", "PER PORTION (2 PCS):"],
      ["Batter", null, "TT", "PER PORTION (2 PCS):"], ["Bread crumbs", null, "TT", "PER PORTION (2 PCS):"],
      ["Pomodoro sauce", 150, "g", "SAUCE:"], ["Chopped garlic", 15, "g", "SAUCE:"], ["Butter", 20, "g", "SAUCE:"],
      ["Parsley", 5, "g", "SAUCE:"], ["Seasoning", null, "TT", "SAUCE:"],
    ],
    steps: [
      "Mix all filling ingredients well.",
      "Cut pasta sheets into 1 x 4 pieces.",
      "Spread ricotta filling, place mozzarella stick and a line of tomato paste. Roll tightly.",
      "Freeze for 15 min.",
      "Dip in batter; coat with bread crumbs.",
      "Deep fry at 160–180 °C for 4–5 min; finish in oven 10–15 sec.",
      "Grate parmesan; top with green garlic.",
      "Serve with garlic ranch & hot tomato sauce.",
    ],
    plating: "Serve 2 pcs in small pasta bowl\nwith ranch & tomato dip.",
    holding: "Fry fresh to order.\nNo holding.",
    allergens: "Contains: Gluten, Milk\nCross-contact: may contain nuts, sesame, soy.",
    notes: "Rest time: 10 min",
  },
  {
    photo: "photo-6-butter-garlic-mushroom.jpg", dishCode: "PS-08", title: "Butter Garlic Mushroom",
    description: "Savoury and aromatic mushrooms sautéed in butter and garlic, finished with fresh herbs, a touch of acidity and chilli for gentle heat.",
    summary: "Rich, garlicky and buttery with a touch of heat and fresh herbs. A perfect side or pasta topper.",
    author: BC, approvedBy: HK, station: "Hot Range",
    yieldText: "~250 g",
    prepMinutes: 10, cookMinutes: 20, totalMinutes: 30, timeText: { prep: "10 min", cook: "20 min", total: "~30 min" },
    dietary: ["V"],
    miseEnPlace: ["Button mushroom 280 g", "Garlic chopped 23 g", "Basil 5 g", "Butter 20 g", "Parsley 5 g"],
    equipment: ["Sauté pan 28 cm", "Ladle", "Tongs", "Digital scale", "Timer"],
    ingredients: [
      ["Mushroom", 280, "g"], ["Oil", 15, "g"], ["Chopped garlic", 23, "g"], ["Basil", 5, "g"], ["Butter", 20, "g"], ["Cowboy Butter", 10, "g"],
      ["Vinaigrette", 3, "g"], ["Parsley", 5, "g"], ["Salt", 5, "g"], ["Pepper", 1, "g"], ["Chilli flakes", 3, "g"],
    ],
    steps: [
      "Heat oil; cook mushrooms.",
      "Add garlic; sauté.",
      "Add basil, parsley; season.",
      "Toss with vinaigrette & chilli flakes.",
      "Add butters.",
      "Serve hot.",
    ],
    plating: "Serve hot.",
    holding: "Build-to-order only.\nNo reheating.",
    allergens: "Contains: Milk.",
  },
  {
    photo: "photo-7-saucy-brussels-sprouts.jpg", dishCode: "CA-V01", title: "Saucy Brussels Sprouts",
    description: "Charred Brussels sprouts tossed in garlic butter and balsamic for depth and heat, served over a velvety cream cheese sauce and finished with pickled onions, chillies, feta and a touch of crunch.",
    summary: null,
    author: "Capiche Culinary", approvedBy: "Hussain Khan", station: "Hot Kitchen",
    yieldText: "1 portion",
    prepMinutes: 15, cookMinutes: 20, totalMinutes: 35, timeText: { prep: "15 min", cook: "20 min", total: "35 min" },
    dietary: ["Vegetarian"], miseEnPlace: [],
    equipment: ["Large sauté pan", "Saucepan", "Wooden spoon", "Silicone spatula", "Measuring cups", "Measuring spoons", "Chef's knife", "Chopping board", "Tongs", "Microplane / grater"],
    ingredients: [
      ["Olive oil", 10, "g", "BRUSSELS SPROUTS"], ["Brussels sprouts (halved)", 120, "g", "BRUSSELS SPROUTS"], ["Butter", 20, "g", "BRUSSELS SPROUTS"],
      ["Garlic (chopped)", 10, "g", "BRUSSELS SPROUTS"], ["Red chilli flakes", 5, "g", "BRUSSELS SPROUTS"], ["Balsamic vinegar", 5, "g", "BRUSSELS SPROUTS"],
      ["Salt & black pepper", null, "to taste", "BRUSSELS SPROUTS"],
      ["Cream cheese", 230, "g", "CREAM CHEESE SAUCE"], ["Béchamel sauce", 150, "g", "CREAM CHEESE SAUCE"], ["Sour cream", 60, "g", "CREAM CHEESE SAUCE"],
      ["Plain mayonnaise", 60, "g", "CREAM CHEESE SAUCE"], ["Salt & black pepper", null, "to taste", "CREAM CHEESE SAUCE"],
      ["Fresh Bhavnagri chilli", 4, "pieces", "GARNISH"], ["Pickled onions", 3, "g", "GARNISH"], ["Feta crumbles", 3, "g", "GARNISH"],
    ],
    steps: [
      "Heat olive oil in a pan. Add Brussels sprouts (cut in halves) and char on high heat.",
      "Add butter, garlic, chilli flakes, salt, pepper, and balsamic vinegar. Toss well.",
      "In another pan, combine cream cheese, béchamel, sour cream, mayonnaise, salt, and black pepper. Cook on low heat until smooth.",
      "Spread the cream cheese sauce on a plate and place the charred Brussels sprouts on top.",
      "Garnish with fresh Bhavnagri chilli, pickled onions, and feta crumbles.",
    ],
    qualityCheck: ["Brussels sprouts charred but not burnt", "Sauce smooth and creamy", "Garnishes fresh", "Balanced heat and acidity"],
    plating: "Serve immediately while hot.\nDo not hold after plating.",
    holding: "Best enjoyed fresh.\nNot suitable for holding.",
    allergens: "Dairy",
    notes: "CHEF'S TIP\nFor extra caramelisation, give the Brussels sprouts space in the pan and avoid overcrowding.\nA splash more balsamic at the end adds a beautiful glaze.",
  },
  {
    photo: "photo-8-miso-tomato-soup.jpg", dishCode: "CA-TS01", title: "Miso Tomato Soup",
    description: "A creamy, umami-rich tomato soup with white miso and fresh basil. Garnish with croutons, toasted pumpkin seeds, chilli oil, basil julienne and grated parmesan.",
    summary: "A comforting yet vibrant tomato soup, elevated with white miso for umami depth and finished with fresh basil. The perfect balance of sweetness, acidity, and richness.",
    author: BH, approvedBy: HK, station: "Hot Kitchen",
    yieldText: "1 portion",
    prepMinutes: 15, cookMinutes: 35, totalMinutes: 50, timeText: { prep: "15 min", cook: "35 min", total: "50 min" },
    dietary: ["Vegetarian"], miseEnPlace: [], equipment: [],
    ingredients: [
      ["Olive oil", 2, "tbsp"], ["Onion", 120, "g"], ["Garlic", 15, "g"], ["Carrot", 100, "g"], ["Tomatoes", 800, "g"], ["Stock powder", 12, "g"], ["Water", 500, "ml"],
      ["White miso paste", 30, "g"], ["Chili flakes (or fresh red chili – 5 g, deseeded)", 2, "g"], ["Soy sauce (optional)", 1, "tsp"], ["Salt", null, "to taste"],
      ["Black pepper", null, "to taste"], ["Basil (fresh, chopped)", 10, "g"], ["Thyme (sprigs) (simmer, remove before blending)", 2, ""],
      ["Bay leaf (remove before blending)", 1, ""], ["Parsley stems (optional, simmer with base)", 5, "g"],
    ],
    steps: [
      "Heat olive oil in a pot, add onion, garlic, carrot, chili, thyme, bay leaf, parsley stems. Sauté until soft and lightly golden.",
      "Add tomatoes, cook down until jammy.",
      "Add water and stock powder, simmer 20 min.",
      "Remove bay leaf and thyme stems. Blend until smooth.",
      "Take off heat, whisk in miso paste.",
      "Adjust seasoning with soy, salt, and pepper.",
      "Stir in chopped fresh basil just before serving.",
    ],
    qualityCheck: ["Smooth texture", "Well balanced seasoning", "Tomato flavour vibrant and fresh", "Miso umami present but not overpowering", "Garnish fresh and appealing"],
    plating: "1. Ladle soup base into bowl.\n2. Drizzle chilli oil.\n3. Add croutons & toasted pumpkin seeds.\n4. Finish with basil julienne & grated parmesan.",
    holding: "Serve hot immediately.\nDo not hold or reheat.",
    allergens: "N/A",
  },
];

const slugify = (s: string) => s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function main() {
  const brand = await db.brand.findUniqueOrThrow({ where: { slug: "capiche" } });
  const category = await db.category.findUniqueOrThrow({ where: { brandId_slug: { brandId: brand.id, slug: "appetiser" } } });
  const owner = await db.admin.findFirst({ where: { role: "OWNER", isActive: true } });

  // Listing is newest-first, so publish in reverse to keep the PDF order.
  const baseTime = Date.now();

  for (const [index, d] of DISHES.entries()) {
    const slug = slugify(d.title);
    const existing = await db.recipe.findFirst({ where: { brandId: brand.id, externalId: d.dishCode, deletedAt: null } });

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
      externalId: d.dishCode,
      slug,
      title: d.title,
      excerpt: d.description.slice(0, 200),
      description: d.description,
      heroImageId,
      prepMinutes: d.prepMinutes,
      cookMinutes: d.cookMinutes,
      restMinutes: d.restMinutes ?? null,
      totalMinutes: d.totalMinutes,
      servings: 1,
      yieldText: d.yieldText,
      course: "Appetiser",
      dietary: d.dietary,
      equipment: d.equipment,
      notes: d.notes ?? null,
      dishCode: d.dishCode,
      author: d.author,
      approvedBy: d.approvedBy,
      effectiveDate: new Date(`${EFFECTIVE}T12:00:00Z`),
      nextReviewDate: new Date(`${NEXT_REVIEW}T12:00:00Z`),
      miseEnPlace: d.miseEnPlace,
      plating: d.plating,
      holding: d.holding,
      allergens: d.allergens,
      station: d.station,
      summary: d.summary,
      sopVersion: "1.0",
      qualityCheck: d.qualityCheck ?? [],
      customFields: d.timeText ? { timeText: d.timeText } : {},
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
