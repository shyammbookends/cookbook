/**
 * Imports Aiko Kitchen's RICE SOPs (transcribed from rec e.pdf: Fried Rice, Burnt Garlic
 * Fried Rice, Mushroom Truffle Fried Rice) into the Aiko brand's RICE category, with their
 * photos (cropped from the PDF into backend/data/aiko-rice). They use the Aiko Dim Sum /
 * Sushi / Rice card design (lib/sop/aiko-dimsum.ts); fields without a column of their own
 * live in customFields.dimsum. Safe to re-run: recipes are matched by externalId and replaced.
 *
 *   npx tsx --tsconfig tsconfig.json --conditions=react-server backend/scripts/import-aiko-rice.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "@/server/db";
import { uploadImage } from "@/server/media/upload";
import { createRecipe } from "@/server/services/recipe";
import { RecipeInputSchema } from "@/lib/schemas/recipe";

const PHOTOS = path.resolve("backend/data/aiko-rice");
const AUTHOR = "Bookend's Hospitality";
const APPROVED = "Husen Khan";

type Table = { title: string; rows: [string, string][]; headers?: [string, string]; bullets: string[] };

interface Rice {
  code: string;
  photo: string;
  slug: string;
  title: string;
  tag?: string;
  description: string;
  allergens: string;
  strip: string;
  summary: [string, string][];
  headLine?: { qc?: string[]; service?: string };
  highlights: string[];
  qc: string[];
  /** "Name|Value" rows. */
  ingredients: string[];
  tables: Table[];
  /** "TITLE::text" per step. */
  steps: string[];
  guides: { title: string; icon: string; bullets: string[] }[];
  markers: string[];
  faults: [string, string][];
  mise: string[];
}

const SERVING = ["Serve hot immediately.", "Do not hold after cooking to maintain texture and flavour."];
const STORAGE = { title: "STORAGE GUIDE", icon: "box", bullets: ["Best consumed fresh.", "If needed, keep warm no longer than 15 minutes."] };
const G_RICE = { title: "RICE GUIDE", icon: "rice", bullets: ["Use day-old rice.", "Spread rice to cool before cooking.", "Do not overcook."] };
const G_WOK = { title: "WOK GUIDE", icon: "wok", bullets: ["High heat is key.", "Keep ingredients moving.", "Do not overcrowd."] };
const SEASON_MIX: Table = {
  title: "SEASONING MIX (PRE-MEASURE)", headers: ["Ingredients", "Gram / ml"],
  rows: [["Stock powder", "3 g"], ["Salt", "2 g"], ["White pepper", "0.6 g"], ["MSG", "0.8 g"], ["Light soy", "5 ml"]],
  bullets: ["Premix all seasoning for quick cooking."],
};

const RICES: Rice[] = [
  {
    code: "RC-001", photo: "photo-1-fried-rice.jpg", slug: "fried-rice", title: "Fried Rice",
    description: "A classic wok-tossed fried rice with crisp vegetables, sweet corn and edamame, seasoned to perfection with soy and MSG, finished with spring onion.",
    allergens: "Soy, MSG", strip: "SOY, MSG",
    summary: [["Dish Type", "Fried Rice"], ["Portion", "1 Serve"], ["Dietary", "Vegetarian"], ["Allergens", "Soy, MSG"], ["Service", "Hot"]],
    headLine: { qc: ["Hot through (≥74°C)", "Balanced seasoning"], service: "Serve hot immediately. No holding after cooking." },
    highlights: ["High heat wok-tossed for smoky flavour", "Rice grains separate and non-sticky", "Vegetables crisp-tender", "Balanced seasoning", "Served hot and fresh"],
    qc: ["Rice grains separated", "No raw aroma", "Hot through (≥74°C)", "Balanced seasoning"],
    ingredients: ["Oil|15 ml", "Ginger (minced)|5 g", "Carrot|25 g", "Corn|20 g", "Edamame|20 g", "Cooked rice|300 g", "Stock powder|3 g", "Salt|2 g", "White pepper|0.6 g", "MSG|0.8 g", "Light soy|5 ml", "Spring onion|4 g"],
    tables: [
      { title: "COOKED RICE", rows: [["Cooked rice", "300"]], bullets: ["Use day-old rice if possible.", "Fluff and separate grains before cooking."] },
      { title: "CHOPPED VEGETABLES", rows: [["Carrot (diced)", "25"], ["Corn", "20"], ["Edamame", "20"]], bullets: ["Keep vegetables ready and dry."] },
      { title: "AROMATICS", rows: [["Ginger (minced)", "5"], ["Spring onion", "4"]], bullets: ["Keep spring onion separated (white & green)."] },
      SEASON_MIX,
    ],
    steps: [
      "1. HEAT WOK::Heat wok on high heat until smoking.",
      "2. SAUTÉ AROMATICS::Add oil, then ginger; sauté for 10–15 sec.",
      "3. COOK VEGETABLES::Add carrot, corn, edamame; toss for 60–90 sec.",
      "4. ADD RICE::Add cooked rice; toss until steamy hot.",
      "5. SEASON::Add stock powder, salt, white pepper, MSG; toss.",
      "6. SAUCE::Add light soy; toss evenly.",
      "7. FINISH::Add spring onion; toss and plate immediately.",
    ],
    guides: [
      { title: "RICE GUIDE", icon: "rice", bullets: ["Use day-old rice.", "Spread and cool quickly after cooking.", "Do not overcook."] },
      { title: "WOK GUIDE", icon: "wok", bullets: ["Always cook on high heat.", "Keep ingredients moving."] },
      { title: "SEASONING GUIDE", icon: "spice", bullets: ["Add seasoning only after rice is hot.", "Adjust to taste quickly on high heat."] },
      { title: "SAUCE GUIDE", icon: "bottle", bullets: ["Use light soy for colour and salt balance.", "Add last to avoid over-salting."] },
      STORAGE,
    ],
    markers: ["Grains separate and fluffy.", "No raw vegetable bite.", "Well balanced flavour.", "Hot and aromatic."],
    faults: [["Rice clumps", "Use day-old rice, toss properly"], ["Bland taste", "Check seasoning mix"], ["Burnt / smoky bitter", "Heat too high or delayed tossing"], ["Soggy rice", "Use less oil, high heat, toss quickly"]],
    mise: ["All ingredients chopped and measured.", "Wok, ladle, seasoning mix ready.", "Plate warmed."],
  },
  {
    code: "RC-002", photo: "photo-2-burnt-garlic-fried-rice.jpg", slug: "burnt-garlic-fried-rice", title: "Burnt Garlic Fried Rice", tag: "R-002 | Station: Wok",
    description: "Fragrant wok-tossed fried rice with burnt garlic, crisp vegetables and a touch of MSG for deep umami flavour. Finished with crunchy fried garlic and spring onion.",
    allergens: "Garlic, MSG", strip: "GARLIC, MSG",
    summary: [["Dish Type", "Fried Rice"], ["Portion", "1 Serve"], ["Dietary", "Vegetarian"], ["Allergens", "Garlic, MSG"], ["Service", "Hot"]],
    headLine: { qc: ["Vegetables still bright"], service: "Serve hot immediately. No holding after cooking." },
    highlights: ["Burnt garlic for deep aroma", "High heat wok-tossed", "Vegetables crisp-tender", "Balanced seasoning with MSG", "Finished with crunchy garlic"],
    qc: ["Garlic golden, not bitter", "Rice fluffy and hot", "No raw aroma", "Vegetables still bright", "Balanced seasoning"],
    ingredients: ["Oil|22 ml", "Garlic (minced)|16 g", "Broccoli|30 g", "Baby corn|30 g", "Spinach|30 g", "Cooked rice|300 g", "Stock powder|3 g", "Salt|2 g", "White pepper|0.6 g", "MSG|0.8 g", "Fried garlic|8 g", "Spring onion|4 g"],
    tables: [
      { title: "CHOPPED VEGETABLES", rows: [["Broccoli (small florets)", "30"], ["Baby corn (sliced)", "30"], ["Spinach (chopped)", "30"]], bullets: ["Keep vegetables washed and dry before cooking."] },
      { title: "MINCED GARLIC", rows: [["Garlic (minced)", "16"]], bullets: ["Use fresh garlic for best aroma."] },
      { title: "FRIED GARLIC (GARNISH)", rows: [["Garlic (sliced/minced)", "20"], ["Oil", "For frying"]], bullets: ["Fry on medium until golden.", "Drain well on paper towel.", "Store in airtight container."] },
      SEASON_MIX,
    ],
    steps: [
      "1. HEAT WOK::Heat wok on medium-high until hot.",
      "2. SAUTÉ GARLIC::Add oil, then garlic; sauté on medium until pale golden (do not burn).",
      "3. COOK VEGETABLES::Increase heat; add broccoli, baby corn and spinach; toss 60–90 sec.",
      "4. ADD RICE::Add cooked rice; toss on high heat until heated through.",
      "5. SEASON::Add stock powder, salt, white pepper and MSG; toss evenly.",
      "6. SAUCE::Add light soy; toss evenly.",
      "7. FINISH::Plate and top with fried garlic and spring onion.",
    ],
    guides: [
      G_RICE, G_WOK,
      { title: "GARLIC GUIDE", icon: "garlic", bullets: ["Cook until golden, not deep brown.", "Removes raw bite and adds aroma."] },
      { title: "SEASONING GUIDE", icon: "spice", bullets: ["Add seasoning on high heat.", "Taste and adjust before plating."] },
      STORAGE,
    ],
    markers: ["Garlic golden, not bitter.", "Rice fluffy and hot.", "No raw aroma.", "Vegetables still bright.", "Balanced seasoning."],
    faults: [["Garlic burnt", "Cook on medium heat; watch closely"], ["Rice sticky", "Use day-old rice; high heat toss"], ["Flavour flat", "Check seasoning and MSG level"], ["Veg soggy", "Toss on high heat; cook less time"]],
    mise: ["All vegetables chopped and measured.", "Garlic minced and measured.", "Seasoning mix ready.", "Rice cooled and fluffed."],
  },
  {
    code: "RC-003", photo: "photo-3-mushroom-truffle-fried-rice.jpg", slug: "mushroom-truffle-fried-rice", title: "Mushroom Truffle Fried Rice", tag: "R-003 | Station: Wok",
    description: "Aromatic fried rice with mixed mushrooms, edamame and a touch of truffle for a rich umami flavour. Finished with truffle oil for an indulgent, restaurant-style experience.",
    allergens: "Mushroom, Dairy, MSG", strip: "MUSHROOM, DAIRY, MSG",
    summary: [["Dish Type", "Fried Rice"], ["Portion", "1 Serve"], ["Dietary", "Vegetarian"], ["Allergens", "Mushroom, Dairy, MSG"], ["Service", "Hot"]],
    highlights: ["Rich truffle aroma", "Mushrooms browned", "Rice hot and fluffy", "Balanced seasoning with MSG", "Finished with truffle oil"],
    qc: ["Strong truffle aroma", "No oil split", "Rice hot and evenly coated", "No raw mushroom taste", "Balanced seasoning"],
    ingredients: ["Oil|15 ml", "Garlic|15 g", "Button mushroom|60 g", "Shimeji mushrooms|", "Chilli bean paste|2.5 g", "Hot sauce|2.5 g", "Cooked rice|300 g", "Edamame|20 g", "White pepper|0.6 g", "Truffle pâté|5 g", "Truffle oil|2.5 ml"],
    tables: [
      { title: "MUSHROOMS", rows: [["Button mushroom", "60"], ["Shimeji mushrooms", ""]], bullets: ["Slice evenly for uniform cooking."] },
      { title: "EDAMAME", rows: [["Edamame (shelled)", "20"]], bullets: ["Blanch in hot water for 30–45 sec and drain."] },
      { title: "TRUFFLE PÂTÉ", rows: [["Truffle pâté", "5"]], bullets: ["Use good quality pâté for best aroma."] },
      { title: "SAUCES (PRE-MEASURE)", headers: ["Ingredients", "Gram/ml"], rows: [["Chilli bean paste", "2.5 g"], ["Hot sauce", "2.5 g"]], bullets: ["Mix together and keep ready."] },
    ],
    steps: [
      "1. HEAT WOK::Heat wok on high until smoking.",
      "2. SAUTÉ AROMATICS::Add oil and garlic; sauté for 10 sec until aromatic.",
      "3. COOK MUSHROOMS::Add mushrooms; cook until moisture evaporates and mushrooms brown.",
      "4. ADD SAUCES::Add chili bean paste, hot sauce; toss for 15–20 sec.",
      "5. ADD RICE::Add rice and edamame; toss on high heat until rice is hot and everything combined.",
      "6. SEASON::Add white pepper, truffle pâté and MSG; toss evenly.",
      "7. FINISH::Switch off heat; fold in truffle oil. Plate and serve immediately.",
    ],
    guides: [
      G_RICE, G_WOK,
      { title: "MUSHROOM GUIDE", icon: "mushroom", bullets: ["Cook on high heat.", "Allow moisture to evaporate.", "Do not stir too much."] },
      { title: "TRUFFLE GUIDE", icon: "truffle", bullets: ["Add truffle oil at the end off heat.", "Too much heat can dull the aroma."] },
      STORAGE,
    ],
    markers: ["Strong truffle aroma.", "No oil split.", "Rice hot and evenly coated.", "No raw mushroom taste.", "Balanced seasoning."],
    faults: [["No truffle aroma", "Add truffle oil off heat"], ["Mushrooms soggy", "Cook on high heat, avoid overcrowding"], ["Rice dry", "Ensure sauces are measured correctly"], ["Oil split", "Use high heat, add sauces gradually"], ["Too salty", "Reduce sauces; adjust with rice"]],
    mise: ["All ingredients sliced and measured.", "Sauces pre-mixed.", "Rice ready.", "Wok and ladle ready.", "Truffle oil ready."],
  },
];

/** "18 g" → 18 + "g"; anything else is kept as printed in the unit. */
function parseQty(text: string): { quantity: number | null; unit: string | null } {
  if (!text) return { quantity: null, unit: null };
  const m = text.match(/^(\d+(?:\.\d*[1-9])?)(?:\s+(\S.*))?$/);
  if (m) return { quantity: Number(m[1]), unit: m[2] ?? null };
  return { quantity: null, unit: text };
}

async function main() {
  const brand = await db.brand.findUniqueOrThrow({ where: { slug: "aiko" } });
  const admin = await db.admin.findFirstOrThrow({ where: { role: "OWNER", isActive: true } });
  const category = await db.category.findUniqueOrThrow({ where: { brandId_slug: { brandId: brand.id, slug: "rice" } } });

  for (const s of RICES) {
    const externalId = `AIKO-${s.code}`;
    const old = await db.recipe.findMany({ where: { brandId: brand.id, externalId }, select: { id: true } });
    if (old.length) await db.recipe.deleteMany({ where: { id: { in: old.map((r) => r.id) } } });

    const media = await uploadImage({
      buffer: readFileSync(path.join(PHOTOS, s.photo)),
      originalName: s.photo,
      alt: s.title,
      brandId: brand.id,
      uploadedById: admin.id,
    });

    const sum = Object.fromEntries(s.summary);
    const ingredients = s.ingredients.map((row, position) => {
      const [name, value] = row.split("|");
      const { quantity, unit } = parseQty(value);
      return { position, groupLabel: null, quantity, unit, name, raw: `${name} ${value}`.trim() };
    });
    const steps = s.steps.map((line, position) => {
      const i = line.indexOf("::");
      return { phase: "COOK" as const, position, title: line.slice(0, i), body: line.slice(i + 2) };
    });

    const input = RecipeInputSchema.parse({
      brandId: brand.id,
      categoryId: category.id,
      externalId,
      slug: s.slug,
      title: s.title,
      excerpt: s.description.split(/(?<=\.)\s/)[0].slice(0, 220),
      description: s.description,
      heroImageId: media.id,
      yieldText: sum["Portion"],
      dietary: [sum["Dietary"]],
      dishCode: s.code,
      author: AUTHOR,
      approvedBy: APPROVED,
      allergens: sum["Allergens"],
      dishType: sum["Dish Type"],
      service: sum["Service"],
      station: "Wok",
      qualityCheck: s.qc,
      miseEnPlace: s.mise,
      customFields: {
        dimsum: {
          stripItems: [
            { icon: "wok", label: "STATION", value: "WOK" },
            { icon: "leaf", label: "DIETARY", value: "VEGETARIAN" },
            { icon: "cloche", label: "PORTION", value: "1 SERVE" },
            { icon: "flame", label: "SERVICE", value: "HOT" },
            { icon: "noallergen", label: "ALLERGENS", value: s.strip },
          ],
          tag: s.tag,
          headLine: s.headLine,
          headStack: true,
          summary: s.summary,
          highlights: s.highlights,
          serving: SERVING,
          ingHeading: "INGREDIENTS (1 SERVE)",
          ingHeaders: { "": ["Ingredients", "Qty / Gram"] },
          compHeading: "PREP COMPONENTS",
          compTables: s.tables.map((t) => ({ title: t.title, rows: t.rows, headers: t.headers, bullets: t.bullets })),
          methodFlow: true,
          guides: s.guides,
          guidesLayout: "row",
          iconGuides: true,
          qcIcons: true,
          qcMarkers: s.markers,
          faults: s.faults,
          faultHeader: ["Fault", "Fix"],
          miseInQc: true,
          footer: " ",
        },
      },
      ingredients,
      steps,
      status: "PUBLISHED",
    });
    const recipe = await createRecipe(input, admin);
    console.log(`✓ ${s.code} ${s.title} → /aiko/recipes/${recipe.slug}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
