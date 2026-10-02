/**
 * Imports Aiko Kitchen's NOODLES SOPs (transcribed from rec f.pdf, one recipe per page)
 * into the Aiko brand's NOODLES category with their photos (cropped from the PDF into
 * backend/data/aiko-noodles). Pages 1-2 (Hakka, Drunken) use the Aiko Rice/Sushi card
 * design; pages 3-7 (Pad Thai and the four ramen / garlic noodles) use its simple
 * "ramen" layout (lib/sop/aiko-dimsum.ts). Safe to re-run: matched by externalId.
 *
 *   npx tsx --tsconfig tsconfig.json --conditions=react-server backend/scripts/import-aiko-noodles.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "@/server/db";
import { uploadImage } from "@/server/media/upload";
import { createRecipe } from "@/server/services/recipe";
import { RecipeInputSchema } from "@/lib/schemas/recipe";

const PHOTOS = path.resolve("backend/data/aiko-noodles");
const AUTHOR = "Bookend's Hospitality";
const APPROVED = "Husen Khan";

type Table = { title: string; rows: [string, string][]; headers?: [string, string]; bullets: string[] };

interface Noodle {
  code: string;
  photo: string;
  slug: string;
  title: string;
  tag?: string;
  description: string;
  station: string;
  allergens?: string;
  dietary: string;
  dishType?: string;
  /** "Name|Value" rows. */
  ingredients: string[];
  /** "TITLE::text" (design A) or plain text (ramen). */
  steps: string[];
  /** Design A (Rice-like) extras; absent for ramen pages. */
  a?: {
    strip: string;
    summary: [string, string][];
    headLine: { qc?: string[] };
    highlights: string[];
    qc: string[];
    tables: Table[];
    guides: { title: string; icon: string; bullets: string[] }[];
    markers: string[];
    faults: [string, string][];
    mise: string[];
  };
  ramen?: { ingStyle: "bullets" | "table"; methodStyle: "plain" | "circles"; chefNotes: string[]; service: string; under?: string[]; heads?: Record<string, string> };
}

const SERVING = ["Serve hot immediately.", "Do not hold after cooking to maintain texture and flavour."];
const G_WOK = { title: "WOK GUIDE", icon: "wok", bullets: ["Very high heat is key.", "Keep ingredients moving.", "Do not overcrowd."] };
const G_STORE = { title: "STORAGE GUIDE", icon: "box", bullets: ["Best consumed fresh.", "If needed, keep warm no longer than 10–15 minutes."] };

const NOODLES: Noodle[] = [
  {
    code: "ND-001", photo: "photo-1-hakka-noodles.jpg", slug: "hakka-noodles", title: "Hakka Noodles", station: "Wok", dietary: "Vegetarian", dishType: "Noodles", allergens: "Gluten, Soy, MSG",
    description: "Classic Indo-Chinese stir-fried noodles with crunchy vegetables and a bold, savoury sauce. Light wok char and perfectly separated strands.",
    ingredients: ["Oil|22 ml", "Ginger-garlic paste|5 g", "Bell pepper|30 g", "Carrot|30 g", "Cabbage|30 g", "Boiled hakka noodles|140 g", "Hakka sauce|30 g", "Stock powder|3 g", "Salt|2 g", "White pepper|0.5 g", "MSG|0.8 g", "Spring onion|4 g"],
    steps: [
      "1. HEAT WOK::Heat wok high until smoking.", "2. AROMATICS::Add oil and ginger-garlic; sauté 10–15 sec.", "3. ADD VEGETABLES::Add vegetables; toss 60–90 sec (keep crunchy).",
      "4. ADD NOODLES::Add noodles; toss to separate strands.", "5. ADD SAUCE & SEASON::Add hakka sauce + stock powder, salt, white pepper, MSG; toss on high heat.", "6. FINISH::Finish spring onion; plate immediately.",
    ],
    a: {
      strip: "GLUTEN, SOY, MSG",
      summary: [["Dish Type", "Noodles"], ["Portion", "1 Serve"], ["Dietary", "Vegetarian (Jain possible – no garlic)"], ["Allergens", "Gluten, Soy, MSG"], ["Service", "Hot"]],
      headLine: { qc: ["Light wok char", "Balanced salt"] },
      highlights: ["Light wok char", "Noodles well separated", "Vegetables crunchy", "Balanced seasoning", "Finished with spring onion"],
      qc: ["Noodles separated, not sticky", "Vegetables crunchy", "Light wok char", "Balanced salt", "No excess moisture"],
      tables: [
        { title: "NOODLES", rows: [["Boiled hakka noodles", "140"]], bullets: ["Boil noodles till just cooked.", "Drain, rinse in cold water and toss with ½ tsp oil.", "Keep aside."] },
        { title: "VEGETABLES", rows: [["Bell pepper (julienne)", "30"], ["Carrot (julienne)", "30"], ["Cabbage (shredded)", "30"]], bullets: ["Cut vegetables uniformly for even cooking."] },
        { title: "SPRING ONION", rows: [["Spring onion (greens) (sliced)", "4"]], bullets: ["Slice thinly on a bias.", "Use for finishing."] },
        { title: "SAUCES (PRE-MEASURE)", headers: ["Ingredients", "Gram/ml"], rows: [["Hakka sauce", "30"]], bullets: ["Keep sauce ready in a small bowl."] },
      ],
      guides: [
        { title: "NOODLE GUIDE", icon: "noodle", bullets: ["Do not overcook.", "Rinse and oil lightly to prevent sticking.", "Keep strands long."] },
        G_WOK,
        { title: "SAUCE GUIDE", icon: "bottle", bullets: ["Use hakka sauce for authentic flavour.", "Adjust salt after sauce, not before."] },
        G_STORE,
      ],
      markers: ["Noodles separated, not sticky.", "Vegetables crunchy.", "Light wok char.", "Balanced salt."],
      faults: [["Noodles sticky", "Rinse well and toss with oil"], ["Soggy vegetables", "Increase heat, reduce tossing time"], ["Burnt garlic", "Lower heat, sauté gently"], ["Over salty", "Add more vegetables / noodles"], ["No wok char", "Heat wok till very hot"]],
      mise: ["All ingredients prepped and measured.", "Noodles boiled and oiled.", "Sauce measured.", "Station clean and wok hot."],
    },
  },
  {
    code: "ND-002", photo: "photo-2-drunken-noodles.jpg", slug: "drunken-noodles", title: "Drunken Noodles", station: "Wok", dietary: "Vegetarian", dishType: "Noodles", allergens: "Soy, Gluten",
    description: "Bold, spicy and savoury flat noodles stir-fried with garlic, chilli, mushrooms and Thai basil in our signature drunken sauce. Aromatic, glossy and packed with flavour.",
    ingredients: ["Oil|22 ml", "Garlic|10 g", "Thai chilli|4 g", "Button mushrooms|60 g", "Spring onion whites|10 g", "Flat noodles|120 g", "Drunken sauce|30 g", "Bean sprouts|30 g", "Thai basil|5 g", "Posi powder|5 g"],
    steps: [
      "1. HEAT WOK::Heat wok high until smoking.", "2. AROMATICS::Add oil and garlic + chilli; sauté 10–15 sec.", "3. ADD MUSHROOMS::Add mushrooms; toss until lightly browned.",
      "4. ADD SPRING ONION::Add spring onion whites; stir-fry briefly.", "5. ADD NOODLES::Add noodles + drunken sauce; toss until glossy.", "6. ADD BEAN SPROUTS & BASIL::Add bean sprouts + basil; toss 20–30 sec.", "7. PLATE::Plate immediately.",
    ],
    a: {
      strip: "SOY, GLUTEN",
      summary: [["Dish Type", "Noodles"], ["Portion", "1 Serve"], ["Dietary", "Vegetarian"], ["Allergens", "Soy, Gluten"], ["Service", "Hot"]],
      headLine: { qc: ["Basil aroma", "Glossy noodles", "No excess liquid"] },
      highlights: ["Bold, spicy and savoury flavour", "Noodles glossy and well coated", "Garlic and chilli aromatic", "Basil adds freshness", "No excess liquid"],
      qc: ["Basil aroma", "Noodles glossy", "No excess liquid", "Light wok char", "Balanced seasoning"],
      tables: [
        { title: "BUTTON MUSHROOMS", rows: [["Button mushrooms", "60"]], bullets: ["Clean and slice button mushrooms uniformly."] },
        { title: "SPRING ONION WHITES", rows: [["Spring onion whites", "10"]], bullets: ["Cut into 2–3 cm batons."] },
        { title: "BEAN SPROUTS", rows: [["Bean sprouts", "30"]], bullets: ["Rinse and drain thoroughly."] },
        { title: "THAI BASIL", rows: [["Thai basil", "5"]], bullets: ["Pick leaves from stems.", "Keep whole."] },
      ],
      guides: [
        { title: "NOODLE GUIDE", icon: "noodle", bullets: ["Do not overcook flat noodles.", "Rinse in cold water after boiling.", "Toss on high heat."] },
        G_WOK,
        { title: "SAUCE GUIDE", icon: "bottle", bullets: ["Use drunken sauce as per recipe.", "Adjust at the end for seasoning."] },
        { title: "STORAGE GUIDE", icon: "box", bullets: ["Best consumed fresh.", "If needed, keep warm no longer than 10–15 minutes."] },
      ],
      markers: ["Basil aroma present.", "Noodles glossy, not sticky.", "No excess liquid in wok.", "Balanced salt and spice."],
      faults: [["Noodles clumped", "Use high heat; toss continuously"], ["Too dry", "Add a splash of hot water / sauce"], ["Too spicy", "Reduce chilli; balance with sauce"], ["Too salty", "Add noodles / vegetables"], ["Bland", "Check sauce and seasoning"]],
      mise: ["All ingredients prepped and measured.", "Noodles boiled and rinsed.", "Wok and sauces ready and set."],
    },
  },
  {
    code: "ND-003", photo: "photo-3-pad-thai.jpg", slug: "pad-thai", title: "Pad Thai", tag: "N-003 | Station: Wok", station: "Wok", dietary: "Vegetarian",
    description: "Classic Thai-style stir-fried rice noodles tossed in tangy pad thai sauce with mushrooms, crunchy sprouts, roasted peanuts and fresh herbs.",
    ingredients: ["Oil|22 ml", "Ginger-garlic paste|5 g", "Mushrooms|60 g", "Carrot|30 g", "Rice noodles (soaked)|150 g", "Pad Thai sauce|40 g", "Bean sprouts|30 g", "Spring onion|10 g", "Roasted peanuts|15 g", "Coriander|5 g", "Lemon wedge|1 pc"],
    steps: [
      "Heat wok medium-high; add oil.", "Add ginger-garlic; sauté 10 sec.", "Add mushrooms and carrot; toss 60 sec.", "Add noodles and pad thai sauce; toss until absorbed.",
      "Add sprouts; toss 15–20 sec.", "Plate and finish with spring onion, peanuts and coriander.", "Serve with lemon wedge.",
    ],
    ramen: { ingStyle: "bullets", methodStyle: "plain", chefNotes: ["Maintain glossy noodles without excess sauce."], service: "Serve immediately hot.", under: ["No oil pooling"] },
  },
  {
    code: "ND-004", photo: "photo-4-shoyu-ramen.jpg", slug: "shoyu-ramen", title: "Shoyu Ramen", tag: "RA-002 | Station: Range", station: "Range", dietary: "Vegetarian",
    description: "A classic Japanese ramen with a deep, umami-rich soy sauce broth, springy noodles and fresh vegetables.\nSimple, balanced and deeply satisfying.",
    ingredients: ["Maida noodles|90 g", "Veg stock|120 g", "Shoyu tare|30 g", "Thai chilli|1 g", "Salt|2 g", "MSG|2 g", "White pepper|2 g", "White sesame|7 g", "Corn|20 g", "Bell pepper|20 g", "Bean sprouts|10 g", "Spring onion|15 g", "Scallion oil|"],
    steps: ["Bring stock to gentle simmer.", "Add shoyu tare + seasoning; simmer 3–4 min (no hard boil).", "Cook noodles separately; drain well.", "Place noodles in bowl; pour hot broth.", "Top vegetables; finish sesame + scallion oil."],
    ramen: { ingStyle: "table", methodStyle: "circles", chefNotes: ["Do not boil the broth vigorously after adding shoyu tare to maintain clarity.", "Use hot broth at serving temperature."], service: "Serve immediately hot." },
  },
  {
    code: "ND-005", photo: "photo-5-peanut-butter-ramen.jpg", slug: "peanut-butter-ramen", title: "Peanut Butter Ramen", tag: "RA-003 | Station: Range", station: "Range", dietary: "Vegetarian",
    description: "A rich and creamy ramen with a nutty, spicy peanut butter broth. Bold, comforting and deeply satisfying.",
    ingredients: ["Sunflower oil|20 g", "Ginger paste|10 g", "Garlic paste|10 g", "Gochujang|20 g", "Red chilli powder|5 g", "Chilli bean paste|40 g", "Peanut butter|40 g", "Water|350 g", "Ramen noodles|90 g", "Stock powder|5 g", "MSG|3 g", "White pepper|1.5 g", "Salt|2 g", "Caster sugar|10 g"],
    steps: ["Heat oil; sauté ginger + garlic.", "Add gochujang + chilli bean paste + chilli powder; bloom 30–40 sec.", "Add water gradually; whisk smooth.", "Add peanut butter; whisk until emulsified.", "Season; simmer 2–3 min.", "Cook noodles separately; assemble bowl."],
    ramen: { ingStyle: "table", methodStyle: "circles", chefNotes: ["Do not boil after adding peanut butter.", "Adjust chilli and sugar to balance heat and sweetness.", "Use hot water at service for best flavour."], service: "Serve immediately hot." },
  },
  {
    code: "ND-006", photo: "photo-6-spiced-miso-ramen.jpg", slug: "spiced-miso-ramen", title: "Spiced Miso Ramen", tag: "RA-004 | Station: Range", station: "Range", dietary: "Vegetarian",
    description: "Rich and aromatic ramen with spicy miso broth, tender noodles and a medley of vegetables, finished with peanuts and spring onion.",
    ingredients: ["Oil|28 g", "Red chilli powder|14 g", "Spicy Miso base|100 g", "Miso paste|20 g", "Coconut milk|100 g", "Oat milk|200 g", "Water|300 g", "MSG|5 g", "Salt|3 g", "Stock powder|7 g", "Orange caviar|20 g", "Pickled red paprika|10 g", "Pickled Jalapeño|10 g", "White spring onion|15 g", "Green spring onion|15 g", "Fried onion|20 g", "Cashew|15 g", "Shimeji mushrooms|20 g"],
    steps: [
      "Heat oil in a pot over medium heat; add ginger and garlic paste, sauté until aromatic.", "Add gochujang, chilli bean paste and chilli powder; bloom for 30–40 sec.", "Gradually add water while whisking to avoid lumps.",
      "Add peanut butter and whisk continuously until fully emulsified.", "Season with stock powder, MSG, white pepper, salt and caster sugar. Simmer for 2–3 min.", "Cook ramen noodles separately as per instructions; drain well.",
      "Assemble the bowl with noodles and hot broth.", "Top with peanuts, coriander, spring onion, edamame and pokchoy.", "Drizzle with chilli oil and serve with lemon wedge.",
    ],
    ramen: { ingStyle: "table", methodStyle: "plain", chefNotes: ["Maintain creamy broth texture without splitting."], service: "Serve immediately hot.", heads: { MSG: "SEASONING" } },
  },
  {
    code: "ND-007", photo: "photo-7-buttery-chilli-garlic-noodles.jpg", slug: "buttery-chilli-garlic-noodles", title: "Buttery Chilli Garlic Noodles", tag: "N-005 | Station: Wok", station: "Wok", dietary: "Vegetarian",
    description: "Silky noodles tossed in a rich buttery chilli garlic sauce, finished with spring onion and crispy garlic for a bold, aromatic kick.",
    ingredients: ["Butter|30 g", "Garlic|10 g", "Chilli crisp|12 g", "Stock powder|3 g", "Salt|2 g", "MSG|0.8 g", "Boiled noodles|140 g", "Spring onion (garnish)|5 g", "Fried garlic (garnish)|5 g", "Mint|", "Basil|", "Coriander|"],
    steps: ["Melt butter on low heat.", "Add garlic; cook gently until aromatic.", "Add chilli crisp + seasoning; whisk with 10–15 ml hot water to emulsify.", "Add noodles; toss until glossy and coated.", "Plate; top with spring onion, fried garlic, mint, basil and coriander."],
    ramen: { ingStyle: "table", methodStyle: "circles", chefNotes: ["Use unsalted butter for better control.", "Adjust chilli to preference."], service: "Serve hot immediately." },
  },
];

function parseQty(text: string): { quantity: number | null; unit: string | null } {
  if (!text) return { quantity: null, unit: null };
  const m = text.match(/^(\d+(?:\.\d*[1-9])?)(?:\s+(\S.*))?$/);
  if (m) return { quantity: Number(m[1]), unit: m[2] ?? null };
  return { quantity: null, unit: text };
}

async function main() {
  const brand = await db.brand.findUniqueOrThrow({ where: { slug: "aiko" } });
  const admin = await db.admin.findFirstOrThrow({ where: { role: "OWNER", isActive: true } });
  const category = await db.category.findUniqueOrThrow({ where: { brandId_slug: { brandId: brand.id, slug: "noodles" } } });

  for (const s of NOODLES) {
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

    const ingredients = s.ingredients.map((row, position) => {
      const [name, value] = row.split("|");
      const { quantity, unit } = parseQty(value);
      return { position, groupLabel: null, quantity, unit, name, raw: `${name} ${value}`.trim() };
    });
    const steps = s.steps.map((line, position) => {
      const i = line.indexOf("::");
      return i > 0
        ? { phase: "COOK" as const, position, title: line.slice(0, i), body: line.slice(i + 2) }
        : { phase: "COOK" as const, position, title: null, body: line };
    });

    const a = s.a;
    const dimsum = a
      ? {
          stripItems: [
            { icon: "wok", label: "STATION", value: "WOK" },
            { icon: "leaf", label: "DIETARY", value: "VEGETARIAN" },
            { icon: "cloche", label: "PORTION", value: "1 SERVE" },
            { icon: "flame", label: "SERVICE", value: "HOT" },
            { icon: "noallergen", label: "ALLERGENS", value: a.strip },
          ],
          headLine: a.headLine,
          headStack: true,
          summary: a.summary,
          highlights: a.highlights,
          serving: SERVING,
          ingHeading: "INGREDIENTS (1 SERVE)",
          ingHeaders: { "": ["Ingredients", "Qty / Gram"] },
          compHeading: "PREP COMPONENTS",
          compTables: a.tables,
          methodFlow: true,
          guides: a.guides,
          guidesLayout: "row",
          iconGuides: true,
          qcIcons: true,
          qcMarkers: a.markers,
          faults: a.faults,
          faultHeader: ["Fault", "Fix"],
          miseInQc: true,
          footer: " ",
        }
      : { tag: s.tag, ramen: s.ramen };

    const input = RecipeInputSchema.parse({
      brandId: brand.id,
      categoryId: category.id,
      externalId,
      slug: s.slug,
      title: s.title,
      excerpt: s.description.split(/(?<=\.)\s/)[0].slice(0, 220),
      description: s.description,
      heroImageId: media.id,
      yieldText: "1 Serve",
      dietary: [s.dietary],
      dishCode: s.code,
      author: AUTHOR,
      approvedBy: APPROVED,
      allergens: s.allergens ?? null,
      dishType: s.dishType ?? null,
      service: "Hot",
      station: s.station,
      qualityCheck: a?.qc ?? [],
      miseEnPlace: a?.mise ?? [],
      customFields: { dimsum },
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
