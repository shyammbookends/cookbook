/**
 * Imports Aiko Kitchen's "Mains" SOPs (transcribed from rec b.pdf: Katsu Curry,
 * Thai Curry, Sri Lankan Curry) into the Aiko brand's MAINS category, with their
 * dish photos (cropped from the PDF into backend/data/aiko-mains).
 * Safe to re-run: recipes are matched by externalId and replaced.
 *
 *   npx tsx --tsconfig tsconfig.json --conditions=react-server backend/scripts/import-aiko-mains.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "@/server/db";
import { uploadImage } from "@/server/media/upload";
import { createRecipe } from "@/server/services/recipe";
import { RecipeInputSchema } from "@/lib/schemas/recipe";

const PHOTOS = path.resolve("backend/data/aiko-mains");
const AUTHOR = "Bookend's Hospitality";
const APPROVED = "Husen Khan";

interface Main {
  code: string;
  photo: string;
  title: string;
  description: string;
  type: string;
  diet: string;
  portion: string;
  service: string;
  allergens: string;
  station?: string;
  version?: string;
  /** [name, quantity as printed] */
  ingredients: [string, string][];
  steps: string[];
  quality: string[];
  plating: string[];
  sections: string;
}

const MAINS: Main[] = [
  {
    code: "MN-001", photo: "katsu-curry", title: "Katsu Curry",
    description: "A comforting Japanese-style curry plate with crispy katsu, steamed rice and fresh vegetables. Simple, satisfying and full of flavor.",
    type: "Hot", diet: "Vegetarian", portion: "1 PORTION", service: "Hot", allergens: "Gluten, Dairy",
    ingredients: [["Katsu curry", "150 g"], ["Tofu", "100 g"], ["Cabbage", "20 g"], ["Cucumber", "10 g"], ["Togarashi", "3 g"], ["Sesame seeds", "5 g"], ["Jasmine steamed rice", "180 g"], ["Scallion oil", "3 g"], ["TOTAL", "481 g"]],
    steps: ["Heat katsu curry gently (do not boil).", "Heat tofu if required.", "Plate rice.", "Arrange tofu, pour curry.", "Garnish cabbage, cucumber, sesame, togarashi.", "Finish scallion oil."],
    quality: ["Curry smooth and hot", "Tofu crisp (if fried) and hot", "Rice fluffy and well-cooked", "Vegetables fresh and crisp", "Balanced flavor and seasoning", "Proper portion and plating"],
    plating: ["Plate rice neatly.", "Arrange tofu and pour curry.", "Add vegetables and garnishes neatly.", "Drizzle scallion oil.", "Serve hot immediately.", "Serve hot for best taste and experience."],
    sections: `# QUALITY CHECK POINTS @side
- Curry smooth
- Tofu hot
- Balanced seasoning
- Rice fluffy and hot
- Vegetables fresh and crisp
- Garnish neat and even

# PLATING & SERVICE @bottom
Serve hot immediately.

# HOLDING & STORAGE @bottom
Keep curry hot (above 60°C).
Hold tofu separately if needed.
Do not store assembled plate.

# ALLERGEN DISCLOSURE @bottom
Contains: Gluten, Dairy, Soy, MSG (from sauce).

# SERVICE NOTES @bottom
Ensure curry is smooth and hot. Serve immediately for best experience.`,
  },
  {
    code: "MN-002", photo: "thai-curry", title: "Thai Curry", station: "Range", version: "1.0",
    description: "A fragrant and creamy Thai curry made with fresh vegetables, aromatic green paste and coconut milk. Light, vibrant and perfectly balanced.",
    type: "Hot", diet: "Vegetarian", portion: "1 PORTION", service: "Hot", allergens: "Coconut, MSG",
    ingredients: [["Zucchini", "30 g"], ["Baby corn", "30 g"], ["Bell pepper", "30 g"], ["Mushroom", "30 g"], ["Green paste", "120 g"], ["Coconut milk", "400 g"], ["Water", "30 g"], ["MSG", "2 g"], ["White pepper", "2 g"], ["Stock powder", "2 g"], ["Jasmine rice", "250 g"], ["Sesame mix", "5 g"], ["Lotus stem", "20 g"], ["Scallion oil", "5 g"], ["Chilli oil", "5 g"], ["TOTAL", "961 g"]],
    steps: ["Cook green paste 60–90 sec until aromatic.", "Add coconut milk and water; simmer gently.", "Add vegetables and cook until just tender.", "Season with MSG, white pepper and stock powder.", "Serve with rice; finish with scallion oil, chilli oil, sesame mix and lotus stem."],
    quality: ["No oil split", "Vegetables tender", "Balanced spice", "Curry smooth and creamy", "Proper seasoning", "Rice fluffy and hot", "Garnish neat and even"],
    plating: ["Place rice neatly on the plate.", "Pour curry alongside the rice.", "Drizzle scallion oil and chilli oil.", "Sprinkle sesame mix.", "Place lotus stem on top.", "Serve hot immediately.", "Serve hot for best taste and experience."],
    sections: `# SUMMARY @above
Type: Thai Curry
Portion: 1 portion
Dietary: Vegetarian
Allergens: Coconut, MSG
Service: Hot

# PLATING & SERVICE @below
Serve hot immediately.

# QUALITY CHECK POINTS @side
- No oil split
- Vegetables tender
- Balanced spice
- Curry smooth and creamy
- Proper seasoning
- Rice fluffy and hot
- Garnish neat and even

# HOLDING & STORAGE @bottom
Hold curry hot (above 60°C).
Do not reheat multiple times.
Store vegetables separately if needed.

# ALLERGEN DISCLOSURE @bottom
Contains: Coconut, MSG (from ingredients).

# SERVICE NOTES @bottom
Ensure curry is smooth and vegetables are tender. Serve immediately for the best flavor and aroma.`,
  },
  {
    code: "MN-003", photo: "sri-lankan-curry", title: "Sri Lankan Curry",
    description: "A rich and aromatic Sri Lankan curry made with coconut milk, red curry pastes and fresh vegetables. Bold, spicy and perfectly balanced.",
    type: "Hot", diet: "Vegetarian", portion: "1 PORTION", service: "Hot", allergens: "Coconut, MSG",
    ingredients: [["Oil", "10"], ["Kashmiri chilli powder", "2.5"], ["Kashmiri chilli red paste", "10"], ["Sri Lankan Red paste", "10"], ["Tamarind water", "15"], ["Coconut milk", "200"], ["Stock water", "100"], ["Water", "50"], ["Msg", "3"], ["Salt", "2"], ["White pepper", "2"], ["Stock Powder", "2"], ["Fresh Sri Lankan Red Curry Powder Mix", "1"], ["Tofu", "20"], ["Carrot", "20"], ["Mushroom", "20"], ["Shimeji mushroom", "20"], ["Basil", "2"], ["Picked red paprika", "2"], ["Slit onion", "2"], ["Red chilli oil", "1"], ["Fried onion", "10"], ["TOTAL", "507.5"]],
    steps: [
      "Heat oil in a pan.",
      "Add Kashmiri chilli powder, Kashmiri chilli red paste and Sri Lankan red paste. Sauté until aromatic.",
      "Add tamarind water and stir well.",
      "Pour in coconut milk, stock water and water. Mix and bring to a simmer.",
      "Season with MSG, salt, white pepper, stock powder and fresh Sri Lankan red curry powder mix.",
      "Add tofu, carrot, mushroom and shimeji mushroom. Cook until vegetables are tender.",
      "Add picked red paprika and slit onion. Simmer for 1–2 minutes.",
      "Finish with red chilli oil.",
      "Garnish with basil leaves and fried onion.",
      "Serve hot.",
    ],
    quality: ["No oil split", "Vegetables tender", "Balanced spice", "Curry smooth and creamy", "Proper seasoning", "Aromatic and flavorful", "Garnish neat and even"],
    plating: ["Ladle curry into a serving bowl.", "Garnish with basil leaves and fried onion.", "Drizzle red chilli oil on top.", "Serve hot with steamed rice.", "Serve hot for best taste and experience."],
    sections: `# SUMMARY @above
Type: Sri Lankan Curry
Portion: 1 portion
Dietary: Vegetarian
Allergens: Coconut, MSG
Service: Hot

# QUALITY CHECK POINTS @side
- No oil split
- Vegetables tender
- Balanced spice
- Curry smooth and creamy
- Proper seasoning
- Aromatic and flavorful
- Garnish neat and even

# HOLDING & STORAGE @bottom
Hold curry hot (above 60°C).
Do not reheat multiple times.
Store vegetables separately if needed.

# TAMARIND WATER (BASIC PREP) @bottom
* Ingredients | Gram
Tamarind | 100
WATER | 200
TOTAL | 300
> Soak tamarind in water and extract. Strain before use.

# ALLERGEN DISCLOSURE @bottom
Contains: Coconut, MSG (from ingredients).

# SERVICE NOTES @bottom
Ensure curry is smooth and vegetables are tender. Serve immediately for the best flavor and aroma.`,
  },
];

/** "18 g" → 18 + "g"; anything printed differently ("75.00", "5%") is kept verbatim as the unit. */
function parseQty(text: string): { quantity: number | null; unit: string | null } {
  const m = text.match(/^(\d+(?:\.\d*[1-9])?)(?:\s+([a-zA-Z]+))?$/);
  if (m) return { quantity: Number(m[1]), unit: m[2] ?? null };
  return { quantity: null, unit: text };
}

function toIngredients(rows: Main["ingredients"]) {
  return rows.map(([name, qtyText], position) => {
    const { quantity, unit } = parseQty(qtyText);
    return { position, groupLabel: null, quantity, unit, name, raw: `${name} ${qtyText}` };
  });
}

async function main() {
  const brand = await db.brand.findUniqueOrThrow({ where: { slug: "aiko" } });
  const admin = await db.admin.findFirstOrThrow({ where: { role: "OWNER", isActive: true } });
  const category = await db.category.findUniqueOrThrow({ where: { brandId_slug: { brandId: brand.id, slug: "mains" } } });

  for (const s of MAINS) {
    const externalId = `AIKO-${s.code}`;
    const old = await db.recipe.findMany({ where: { brandId: brand.id, externalId }, select: { id: true } });
    if (old.length) await db.recipe.deleteMany({ where: { id: { in: old.map((r) => r.id) } } });

    const media = await uploadImage({
      buffer: readFileSync(path.join(PHOTOS, `${s.photo}.jpg`)),
      originalName: `${s.photo}.jpg`,
      alt: s.title,
      brandId: brand.id,
      uploadedById: admin.id,
    });

    const input = RecipeInputSchema.parse({
      brandId: brand.id,
      categoryId: category.id,
      externalId,
      slug: s.photo,
      title: s.title,
      excerpt: s.description.split(/(?<=\.)\s/)[0].slice(0, 220),
      description: s.description,
      heroImageId: media.id,
      yieldText: s.portion,
      dietary: [s.diet],
      dishCode: s.code,
      author: AUTHOR,
      approvedBy: APPROVED,
      allergens: s.allergens,
      station: s.station ?? null,
      sopVersion: s.version ?? null,
      dishType: s.type,
      service: s.service,
      qualityCheck: s.quality,
      plating: s.plating.join("\n"),
      sopSections: s.sections,
      ingredients: toIngredients(s.ingredients),
      steps: s.steps.map((body, position) => ({ phase: "COOK" as const, position, title: null, body })),
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
