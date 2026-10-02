/**
 * Imports Aiko Kitchen's DRINKS (12 recipes from rec g.pdf, "AIKO Bar Recipe Bible",
 * one recipe per page) into the Aiko brand's DRINKS category with their photos
 * (cropped from the PDF into backend/data/aiko-drinks). They use the Aiko Drinks card
 * (lib/sop/aiko-drinks.ts: the PDF's layout in Aiko's black and gold); everything
 * that has no column of its own lives in customFields.drink.
 * Safe to re-run: recipes are matched by externalId and replaced.
 *
 *   npx tsx --tsconfig tsconfig.json --conditions=react-server backend/scripts/import-aiko-drinks.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "@/server/db";
import { uploadImage } from "@/server/media/upload";
import { createRecipe } from "@/server/services/recipe";
import { RecipeInputSchema } from "@/lib/schemas/recipe";

const PHOTOS = path.resolve("backend/data/aiko-drinks");

type Info = { icon?: string; label: string; value: string };
type Batch = { title: string; sub?: string; rows: [string, string][] };

interface Drink {
  code: string;
  photo: string;
  slug: string;
  title: string;
  lines: [string, string?];
  subtitle?: string;
  description?: string;
  icon: "cocktail" | "tumbler" | "mug";
  info: Info[];
  /** "Name|Quantity|Preparation" */
  ingredients: string[];
  steps: string[];
  methodTitle?: string;
  batches?: Batch[];
  extraNotes?: { title: string; items: string[] };
  notes?: string[];
  sourceNote?: string;
  qc?: string[];
  serve?: { title: string; text: string };
  plain?: boolean;
  framed?: boolean;
  plainPanelOverride?: boolean;
  panels?: { title: string; sections: { head: string; lines?: string[]; steps?: string[]; text?: string }[] }[];
}

const MOCK = (garnish: [string, string?, string?], third: Info, ice = "Ice cubes"): Info[] => [
  { icon: "cocktail", label: "Category", value: "Mocktail" },
  { icon: "ice", label: "Ice", value: ice },
  { icon: (garnish[2] ?? "lemon") as string, label: "Garnish", value: garnish[0] },
  { icon: "glass", label: "Yield", value: "1 drink" },
  { icon: "cloche", label: "Service", value: "Serve immediately" },
  third,
];
const BATCH = (value: string, label = "Batch component"): Info => ({ icon: "bottle", label, value });
const SUPER_LIME = "Super-lime juice means fresh lime juice.";
const SERVE_COLD = { title: "SERVE IMMEDIATELY", text: "Serve ice-cold." };

const DRINKS: Drink[] = [
  {
    code: "DR-01", photo: "photo-01-raspberry-kaffir-fizz.jpg", slug: "raspberry-kaffir-fizz", title: "Raspberry Kaffir Fizz", lines: ["RASPBERRY", "KAFFIR FIZZ"], icon: "tumbler",
    info: MOCK(["Lemon slice"], BATCH("Raspberry Syrup (Large Batch)"), "Round-ball ice"),
    ingredients: ["Raspberry syrup|50 ml|–", "Sugar syrup|20 ml|–", "Super-lime juice|15 ml|fresh lime juice", "Kaffir lime leaf|1 leaf|lightly bruised", "Soda water|to top up|–", "Round-ball ice|for serving|–", "Lemon slice|garnish|–"],
    steps: [
      "Lightly bruise the kaffir leaf in your hand to release its oils.",
      "In a glass filled with a round ball of ice, add the kaffir leaf, sugar syrup, lime juice and raspberry syrup.",
      "Stir the base mixture gently to combine.",
      "Slowly top up with soda water to create a layered effect.",
      "Garnish with a lemon slice and serve immediately.",
    ],
    batches: [{ title: "BATCH PREPARATION", sub: "RASPBERRY SYRUP (LARGE BATCH)", rows: [
      ["Yield", "roughly 1.7 litres"],
      ["Ingredients", "1 kg frozen raspberries; 1 kg granulated sugar; 700 ml water."],
      ["Method", "Combine raspberries, sugar and water in a pot and bring to a boil. Boil for 2-3 minutes, then reduce to a simmer and cook for another 6-8 minutes (total cooking time 10-12 minutes). Remove from heat and allow the syrup to rest for about 20 minutes to intensify the flavour. Strain and refrigerate."],
    ] }],
    notes: [SUPER_LIME, "Refrigerate syrup and use within 1 week.", "Label and date homemade syrups.", "Discard if there is any sign of spoilage."],
    qc: ["Bright berry aroma", "Fresh citrus lift", "Kaffir leaf aroma present", "Balanced sweetness and acidity", "Clean sparkling finish", "Garnish fresh and neat"], serve: SERVE_COLD,
  },
  {
    code: "DR-02", photo: "photo-02-scarlett.jpg", slug: "scarlett", title: "Scarlett", lines: ["SCARLETT"], icon: "cocktail",
    info: MOCK(["Dried lemon wheel"], BATCH("Hibiscus Tea + Mixed-Berry Syrup", "Batch components")),
    ingredients: ["Hibiscus tea|60 ml|–", "Mixed-berry syrup|30 ml|–", "Super-lime juice|15 ml|–", "Salt|pinch|–", "Citric acid|pinch|–", "Soda water|about 120 ml or to top up|–", "Ice cubes|as needed|–", "Dried lemon wheel|garnish|–"],
    steps: [
      "In a cocktail shaker filled with ice, combine the hibiscus tea, mixed-berry syrup, lime juice, salt and citric acid.",
      "Shake vigorously for about 1 minute until chilled and slightly frothy.",
      "Strain into a glass filled with fresh ice and top up with soda water.",
      "Garnish with a dried lemon slice.",
    ],
    batches: [
      { title: "BATCH PREPARATION", sub: "HIBISCUS TEA (LARGE BATCH)", rows: [["Ingredients", "1 litre water; 15 g dried hibiscus flowers."], ["Method", "Bring the water to a boil in a large pot. Remove from heat and add the hibiscus flowers. Cover and steep for 20 minutes. Strain the tea, let it cool and refrigerate."]] },
      { title: "BATCH PREPARATION", sub: "MIXED-BERRY SYRUP", rows: [["Ingredients", "150 g blueberries; 150 g raspberries; 200 ml water; 200 g sugar; 3 g citric acid."], ["Method", "Combine the berries, water and sugar in a pot and bring to a boil. Boil for 3 minutes, then simmer for 8 minutes (total 10-12 minutes). Remove from heat, add 3 g citric acid, stir well and allow to rest for 20 minutes. Strain through a fine strainer and refrigerate."]] },
    ],
    notes: ["Keep batch components refrigerated.", "Shake until chilled and slightly frothy.", "Use fresh ice for service.", "Serve immediately after topping with soda."],
    qc: ["Vibrant ruby colour", "Floral hibiscus aroma", "Balanced berry acidity", "Light frothy shake texture", "Clean sparkling finish", "Garnish neat and dry"], serve: SERVE_COLD,
  },
  {
    code: "DR-03", photo: "photo-03-tropical-pop.jpg", slug: "tropical-pop", title: "Tropical Pop", lines: ["TROPICAL", "POP"], icon: "cocktail",
    info: MOCK(["Fresh basil leaf", undefined, "leaf"], { icon: "bottle", label: "Style", value: "Shaken and topped" }),
    ingredients: ["Passion-fruit puree|50 ml|–", "Super-lime juice|20 ml|–", "Honey|10 ml|–", "Ginger ale|to top up|–", "Ice cubes|as needed|–", "Fresh basil leaf|garnish|–"],
    steps: [
      "In a shaker filled with ice, combine the passion-fruit puree, lime juice and honey.",
      "Shake vigorously for about 1 minute until chilled.",
      "Strain into a glass filled with ice.",
      "Top up with ginger ale and gently stir.",
      "Garnish with a fresh basil leaf.",
    ],
    notes: [SUPER_LIME, "Shake until fully chilled.", "Top with fresh ginger ale just before service.", "Serve immediately."],
    qc: ["Bright tropical aroma", "Fresh citrus balance", "Gentle ginger lift", "Chilled and refreshing", "Garnish fresh and vibrant", "Clean finish"], serve: SERVE_COLD,
  },
  {
    code: "DR-04", photo: "photo-04-berry-breeze.jpg", slug: "berry-breeze", title: "Berry Breeze", lines: ["BERRY", "BREEZE"], icon: "tumbler",
    info: MOCK(["Edible flower"], BATCH("Vanilla Syrup")),
    ingredients: ["Fresh mint leaves|5 leaves|–", "Raspberry syrup|50 ml|see recipe above", "Vanilla syrup|20 ml|see below", "Super-lime juice|15 ml|–", "Grapefruit soda|approx. 140 ml|to top up", "Ice cubes|as needed|–", "Edible flower|garnish|–"],
    steps: [
      "Place the mint leaves in a shaker and gently muddle to release their oils.",
      "Add the raspberry syrup, vanilla syrup and lime juice. Fill the shaker with ice and shake well.",
      "Strain into a glass filled with ice and top up with grapefruit soda.",
      "Garnish with an edible flower.",
    ],
    batches: [{ title: "BATCH PREPARATION", sub: "VANILLA SYRUP (LARGE BATCH)", rows: [
      ["Ingredients", "1 litre water; 500 g sugar; 8 g vanilla-bean paste."],
      ["Method", "Combine the water and sugar in a pot and heat gently, stirring until the sugar dissolves. Add the vanilla-bean paste and cook over low heat for 1 minute. Remove from heat and allow the syrup to cool to room temperature (about 15 minutes). Bottle and refrigerate."],
    ] }],
    notes: [SUPER_LIME, "Bottle and refrigerate vanilla syrup.", "Use fresh mint and edible flower.", "Serve immediately after topping with soda."],
    qc: ["Bright berry aroma", "Mint lightly expressed", "Soft vanilla note", "Balanced citrus finish", "Soda fresh and lively", "Garnish attractive and fresh"], serve: SERVE_COLD,
  },
  {
    code: "DR-05", photo: "photo-05-kala-khatta-soda.jpg", slug: "kala-khatta-soda", title: "Kala Khatta Soda", lines: ["KALA KHATTA", "SODA"], icon: "tumbler",
    info: MOCK(["Fresh lime slice + mint sprig"], BATCH("Kala Khatta Syrup")),
    ingredients: ["Kala khatta syrup|60 ml|see below", "Black salt|pinch|–", "Soda water|150 ml|or to top up", "Ice cubes|as needed|–", "Fresh lime slice|garnish|–", "Mint sprig|garnish|–"],
    steps: [
      "Fill a glass with ice and add the kala khatta syrup and a pinch of black salt.",
      "Stir gently to combine.",
      "Top up with soda water and stir once more.",
      "Garnish with a lime slice and mint.",
    ],
    batches: [{ title: "BATCH PREPARATION", sub: "KALA KHATTA SYRUP (LARGE BATCH)", rows: [
      ["Ingredients", "500 g blueberries; 500 g sugar; 150 ml water; 5 g citric acid (during cooking); 2 g salt; 20 g citric acid (after cooking); 60 g chaat masala."],
      ["Method", "Combine blueberries, sugar, water, 5 g citric acid and salt in a pot. Cook over medium heat until the berries soften (15-20 minutes). Remove from heat and stir in the remaining 20 g citric acid and 60 g chaat masala. Let the mixture sit for 20 minutes to develop flavour, then blend until smooth and strain through a double strainer. Refrigerate."],
    ] }],
    notes: ["Refrigerate syrup.", "Stir in chaat masala and remaining citric acid after cooking.", "Blend smooth and strain through a double strainer.", "Serve immediately after topping with soda."],
    qc: ["Bold kala khatta flavour", "Light black salt lift", "Chaat masala finish present", "Balanced sweet-sour profile", "Fresh carbonation", "Garnish neat and fresh"], serve: SERVE_COLD,
  },
  {
    code: "DR-06", photo: "photo-06-mint-mojito.jpg", slug: "mint-mojito-non-alcoholic", title: "Mint Mojito (Non-Alcoholic)", lines: ["MINT", "MOJITO"], subtitle: "(NON-ALCOHOLIC)", icon: "tumbler",
    info: MOCK(["Mint sprig + lemon slice"], BATCH("Mint Syrup")),
    ingredients: ["Fresh mint leaves|5 leaves|–", "Salt|pinch|–", "Super-lime juice|25 ml|–", "Mint syrup|60 ml|see below", "Sugar syrup|30 ml|–", "Soda water|to top up|–", "Ice cubes|as needed|–", "Mint sprig|garnish|–", "Lemon slice|garnish|–"],
    steps: [
      "Place the mint leaves in a shaker and gently muddle them to release their aroma.",
      "Add the salt, lime juice, mint syrup and sugar syrup. Fill the shaker with a little ice and give it a quick shake.",
      "Strain into a glass filled with ice and top up with soda water.",
      "Garnish with a fresh mint sprig and a lemon slice.",
    ],
    batches: [{ title: "BATCH PREPARATION", sub: "MINT SYRUP (LARGE BATCH)", rows: [
      ["Ingredients", "80 g mint leaves (blanched); 200 g sugar (preferably Madhur brand); 600 ml water."],
      ["Method", "Blanch the mint leaves and plunge them into ice water to retain the colour. In a blender, combine the sugar, water and blanched mint leaves, and blend for about 20 seconds. Strain through muslin or cheesecloth and refrigerate."],
    ] }],
    notes: [SUPER_LIME, "Retain mint colour by blanching then ice shocking.", "Strain syrup through muslin or cheesecloth.", "Serve immediately after topping with soda."],
    qc: ["Fresh mint aroma", "Bright citrus balance", "Clean sweetness", "High carbonation", "Chilled and refreshing", "Garnish aromatic and neat"], serve: SERVE_COLD,
  },
  {
    code: "DR-07", photo: "photo-07-thai-lemon-boba-tea.jpg", slug: "thai-lemon-boba-tea", title: "Thai Lemon Boba Tea", lines: ["THAI LEMON", "BOBA TEA"], icon: "mug",
    info: [
      { icon: "cocktail", label: "Category", value: "Mocktail / Tea" }, { icon: "ice", label: "Ice", value: "Ice cubes" }, { icon: "boba", label: "Add-on", value: "Tapioca boba pearls" },
      { icon: "glass", label: "Yield", value: "1 drink" }, { icon: "cloche", label: "Service", value: "Serve immediately" }, BATCH("Thai Tea + Boba Preparation", "Batch components"),
    ],
    ingredients: ["Thai tea|150 ml|see preparation below", "Lemon juice|20 ml|–", "Sugar syrup|60 ml|–", "Tapioca boba pearls|2 tablespoons|–", "Ice cubes|as needed|–"],
    steps: [
      "In a shaker filled with ice, combine the Thai tea, lemon juice and sugar syrup. Shake well.",
      "Place the prepared boba pearls and fresh ice in a serving glass.",
      "Pour the shaken tea over the boba and serve.",
    ],
    batches: [
      { title: "BATCH PREPARATION", sub: "THAI TEA (LARGE BATCH)", rows: [
        ["Ingredients", "140 g Thai tea leaves; 3.6 litres water."],
        ["Cold-brew method", "Combine the tea leaves and water at room temperature and let steep for 3 hours, then strain."],
        ["Hot-brew method", "Pour 3.6 litres of hot water over the tea leaves, steep for 20 minutes, then strain. Let cool and refrigerate."],
      ] },
      { title: "BOBA PREPARATION", rows: [
        ["Ingredients", "300 g tapioca boba pearls; 1 litre water."],
        ["Method", "Bring the water to a boil, add the boba pearls and cook for about 25 minutes over medium heat until they are soft. Remove from heat and let the boba rest in the cooking liquid for 15-20 minutes to absorb flavour. Drain and use immediately."],
      ] },
    ],
    notes: ["Use prepared Thai tea chilled.", "Shake well before pouring over boba.", "Drain boba and use immediately.", "Serve immediately."],
    qc: ["Distinct Thai tea aroma", "Lemon balance present", "Boba soft and chewy", "Tea properly chilled", "Sweetness balanced", "Drink served immediately"], serve: { title: "SERVE IMMEDIATELY", text: "Best when fresh." },
  },
  {
    code: "DR-08", photo: "photo-08-thai-tea-latte.jpg", slug: "thai-tea-latte-cold", title: "Thai Tea Latte (Cold)", lines: ["THAI TEA", "LATTE"], subtitle: "(COLD)", icon: "mug",
    info: [
      { icon: "cocktail", label: "Category", value: "Mocktail / Tea" }, { icon: "ice", label: "Ice", value: "Ice cubes" }, { icon: "bottle", label: "Dairy", value: "Milk" },
      { icon: "glass", label: "Yield", value: "1 drink" }, { icon: "cloche", label: "Service", value: "Serve immediately" }, { icon: "note", label: "Note", value: "Use same Thai tea preparation as above" },
    ],
    ingredients: ["Thai tea|150 ml|prepared as above", "Sugar syrup|60 ml|–", "Milk|60 ml|–", "Ice cubes|as needed|–"],
    steps: ["In a shaker filled with ice, combine the Thai tea, sugar syrup and milk.", "Shake thoroughly and pour into a glass filled with ice.", "Serve immediately."],
    extraNotes: { title: "NOTES", items: ["Use the same Thai tea preparation as above."] },
    notes: ["Use chilled Thai tea.", "Shake thoroughly for an even blend.", "Serve immediately over fresh ice."],
    qc: ["Distinct Thai tea aroma", "Creamy, even colour", "Chilled and smooth", "Balanced sweetness", "Milk fully integrated", "No dilution at service"], serve: SERVE_COLD,
  },
  {
    code: "DR-09", photo: "photo-09-vietnamese-cold-brew.jpg", slug: "vietnamese-cold-brew", title: "Vietnamese Cold Brew", lines: ["VIETNAMESE", "COLD BREW"], icon: "tumbler",
    info: [
      { icon: "cocktail", label: "Category", value: "Mocktail / Coffee" }, { icon: "ice", label: "Ice", value: "Ice cubes" }, { icon: "gear", label: "Style", value: "Build in glass" },
      { icon: "glass", label: "Yield", value: "1 drink" }, { icon: "cloche", label: "Service", value: "Serve immediately" }, BATCH("Condensed Milk Mixture"),
    ],
    ingredients: ["Condensed milk mixture|90 ml|see below", "Cold-brew coffee|to top up|–", "Ice cubes|as needed|–"],
    steps: ["Fill a glass with ice and pour in the condensed milk mixture.", "Top up with cold-brew coffee and stir gently."],
    batches: [{ title: "BATCH PREPARATION", sub: "CONDENSED MILK MIXTURE", rows: [
      ["Ingredients", "1.2 kg condensed milk; 320 g fresh cream."],
      ["Method", "In a mixing bowl, thoroughly combine the condensed milk with the fresh cream until smooth. Store in the refrigerator."],
    ] }],
    notes: ["Condensed milk mixture should be smooth.", "Keep batch mixture refrigerated.", "Stir gently before service.", "Serve immediately over ice."],
    qc: ["Distinct coffee aroma", "Smooth sweet creamy base", "Attractive layered look", "Balanced richness", "Served well chilled", "No split mixture"], serve: { title: "SERVE IMMEDIATELY", text: "Best served cold." },
  },
  {
    code: "DR-10", photo: "photo-10-salted-plum-soda.jpg", slug: "salted-plum-soda", title: "Salted Plum Soda", lines: ["SALTED PLUM", "SODA"], icon: "mug", plain: true, framed: true, methodTitle: "SERVING METHOD",
    description: "A refreshing sweet-sour soda with plum depth, citrus lift and a light black-salt finish.",
    info: [{ label: "Category", value: "Mocktail" }, { label: "Yield", value: "1 drink" }, { label: "Garnish", value: "Mint sprig + sliced plum" }, { label: "Service", value: "Serve immediately" }],
    ingredients: ["Plum concentrate|90 ml|-", "Lemon juice|10 ml|-", "Sugar syrup|20 ml|-", "Black salt|1 pinch|-", "Soda|Top up|-", "Mint sprig|Garnish|-", "Plum slices|Garnish|-"],
    steps: ["Fill glass with ice.", "Pour plum concentrate over ice.", "Add fresh lime juice.", "Top with soda water - pour slowly down the inside wall.", "Give one gentle stir.", "Garnish with a thin plum slice dropped in and a mint sprig."],
    sourceNote: "Ingredient list specifies lemon juice, while the supplied serving method says fresh lime juice. Both are retained as supplied.",
    panels: [{ title: "PLUM CONCENTRATE", sections: [
      { head: "INGREDIENTS", lines: ["Fresh plums (aloo bukhara, dark-skinned, ripe but firm): 1 kg - halved, pitted", "Water: 750 ml", "Rock sugar: 150 g", "Fine sea salt: 8 g", "Kala namak: 5 g", "Citric acid: 5 g", "Star anise: 2 whole"] },
      { head: "METHOD", steps: [
        "1. Combine halved plums, water, star anise, and roselle in a heavy pot.",
        "2. Bring to a boil, then reduce to a medium simmer. Cook 25-30 minutes, stirring occasionally, until plums have completely broken down and the liquid is deep ruby-red.",
        "3. While simmering, steep lapsang souchong tea in 100 ml hot water for 4 minutes. Strain and set aside.",
        "4. Remove pot from heat. Add rock sugar, sea salt, kala namak, and citric acid. Stir until dissolved.",
        "5. Add the strained lapsang tea.",
        "6. Let cool 15 minutes, then strain through a fine-mesh sieve, pressing the plum pulp firmly with a spoon to extract maximum juice. Discard solids.",
        "7. Strain again through muslin for clarity.",
        "8. Cool completely. Bottle. Refrigerate.",
      ] },
      { head: "NOTE", text: "The supplied concentrate method references roselle and lapsang souchong tea, but roselle quantity and tea quantity were not supplied." },
    ] }],
  },
  {
    code: "DR-11", photo: "photo-11-ice-milo-dinosour.jpg", slug: "ice-milo-dinosour", title: "Ice Milo Dinosour", lines: ["ICE MILO", "DINOSOUR"], icon: "mug", plain: true, framed: true, methodTitle: "SERVING METHOD",
    description: "A chilled Milo drink with condensed milk, milk and crushed ice, finished with a Milo powder dusting.",
    info: [{ label: "Category", value: "Beverage" }, { label: "Yield", value: "1 drink" }, { label: "Ice", value: "Crushed ice" }, { label: "Service", value: "Serve immediately" }],
    ingredients: ["Milo powder|30 g|-", "Hot water|40 ml|-", "Condensed milk|20 g|-", "Milk|40 ml|-", "Crushed ice|As needed|-"],
    steps: ["Put 30 g Milo powder in a glass.", "Add 40 ml hot water and stir until smooth.", "Add crushed ice and stir.", "Add 50 ml milk to create a layered finish.", "Dust Milo powder over the milk and serve immediately."],
    sourceNote: "Ingredient list states milk 40 ml; the supplied serving method specifies adding 50 ml milk. Both values are shown exactly as supplied.",
    qc: ["Milo fully dissolved before icing", "Crushed ice well packed", "Clear milk layer visible", "Milo powder dusting on top", "Serve immediately and well chilled"], plainPanelOverride: true,
    serve: { title: "SERVE IMMEDIATELY", text: "Best served cold." },
  },
  {
    code: "DR-12", photo: "photo-12-masala-limca.jpg", slug: "masala-limca", title: "Masala Limca", lines: ["MASALA", "LIMCA"], icon: "mug", plain: true, framed: true, methodTitle: "SERVING METHOD",
    description: "A bright, tangy and spiced lemon soda with chaat masala depth and a lively citrus finish.",
    info: [{ label: "Category", value: "Mocktail" }, { label: "Yield", value: "1 drink" }, { label: "Rim", value: "Masala rim" }, { label: "Garnish", value: "Mint sprig + thin lemon slices" }],
    ingredients: ["Lemon juice|25 ml|-", "House lemon cordial|15 ml|-", "House chat masala syrup|20 ml|-", "Sechuan peppercorn tincture|2-3 drops|-", "Limca|Top up|-", "Masala rim|As needed|Glass rim", "Mint sprig|Garnish|-", "Thin lemon slices|Garnish|-"],
    steps: [
      "Run a lime wedge around the outer half of the rim. Dip in chaat salt blend.", "Fill glass with ice.", "Pour lime juice, cordial, syrup, and tincture drops over ice.",
      "Top with soda water - pour slowly down the inside wall.", "Give one gentle stir. Do not over-stir.", "Garnish with a lime wheel on the rim and a mint sprig, slapped once and tucked in.",
    ],
    sourceNote: "Main ingredient list specifies Limca for top-up; the supplied serving method specifies soda water. Both are retained as supplied.",
    panels: [
      { title: "HOUSE CHAT MASALA SYRUP", sections: [
        { head: "INGREDIENTS", lines: ["Water: 500 ml", "Caster sugar: 400 g", "Kala namak: 30 g", "Roasted cumin seeds - whole, dry-roasted, lightly crushed: 15 g", "Kashmiri red chili powder: 3 g", "Amchur - dried mango powder: 10 g", "Dried ginger powder: 5 g", "Black peppercorns - cracked: 5 g"] },
        { head: "METHOD", steps: ["1. Dry-roast cumin seeds until fragrant (about 2 minutes). Crush lightly.", "2. Combine water, sugar, and all spices in a saucepan. Heat gently, stirring until dissolved. Do not boil.", "3. Bring to a gentle simmer for 3 minutes. Remove from heat.", "4. Cover and steep 30 minutes.", "5. Fine-strain through muslin. Cool. Bottle. Refrigerate."] },
      ] },
      { title: "LEMON ZEST CORDIAL", sections: [
        { head: "INGREDIENTS", lines: ["Lemon zest (peeled, no pith): Zest of 10 limes", "Caster sugar: 200 g", "Citric acid: 5 g", "Water: 200 ml"] },
        { head: "METHOD", steps: ["1. Muddle lime zest with sugar using a pestle. Cover and macerate overnight at room temperature.", "2. Add water and citric acid. Stir until dissolved.", "3. Fine-strain. Bottle. Refrigerate."] },
        { head: "NOTE", text: "Title says lemon zest cordial; the supplied ingredient specification says zest of 10 limes." },
      ] },
      { title: "GLASS RIM", sections: [
        { head: "INGREDIENTS", lines: ["Kala namak: 50 g", "Fine sea salt: 20 g", "Roasted cumin powder: 10 g", "Kashmiri red chili powder: 5 g", "Amchur powder: 10 g", "Dried mint powder: 5 g"] },
        { head: "METHOD", steps: ["1. Pulse all ingredients in a spice grinder for a uniform texture. Store airtight, away from moisture."] },
      ] },
    ],
  },
];

function parseQty(text: string): { quantity: number | null; unit: string | null } {
  const m = text.match(/^(\d+(?:\.\d*[1-9])?)(?:\s+(\S.*))?$/);
  if (m) return { quantity: Number(m[1]), unit: m[2] ?? null };
  return { quantity: null, unit: text };
}

async function main() {
  const brand = await db.brand.findUniqueOrThrow({ where: { slug: "aiko" } });
  const admin = await db.admin.findFirstOrThrow({ where: { role: "OWNER", isActive: true } });
  const category = await db.category.findUniqueOrThrow({ where: { brandId_slug: { brandId: brand.id, slug: "drinks" } } });

  for (const [index, s] of DRINKS.entries()) {
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

    const rows = s.ingredients.map((r) => r.split("|"));
    const ingredients = rows.map(([name, qty], position) => {
      const { quantity, unit } = parseQty(qty);
      // The ingredient unit holds at most 20 characters; the card shows the full text from `qty`.
      return { position, groupLabel: null, quantity, unit: unit && unit.length > 20 ? null : unit, name, raw: `${name} ${qty}`.slice(0, 200) };
    });

    const input = RecipeInputSchema.parse({
      brandId: brand.id,
      categoryId: category.id,
      externalId,
      slug: s.slug,
      title: s.title,
      excerpt: (s.description ?? `${s.title} – ${s.info[0]?.value ?? "drink"}`).slice(0, 220),
      description: s.description ?? null,
      heroImageId: media.id,
      yieldText: "1 drink",
      dietary: [],
      qualityCheck: s.qc ?? [],
      holding: (s.notes ?? []).join("\n"),
      customFields: {
        drink: {
          titleLines: s.lines,
          subtitle: s.subtitle,
          headIcon: s.icon,
          infoStyle: s.plain ? "plain" : "icons",
          info: s.info,
          prep: rows.map((r) => r[2]),
          qty: rows.map((r) => r[1]),
          methodTitle: s.methodTitle,
          batches: s.batches,
          extraNotes: s.extraNotes,
          notes: s.notes,
          sourceNote: s.sourceNote,
          photoStyle: s.framed ? "framed" : "full",
          serve: s.serve,
          plainPanel: !!s.plainPanelOverride,
          panels: s.panels,
        },
      },
      ingredients,
      steps: s.steps.map((body, position) => ({ phase: "COOK" as const, position, title: null, body })),
      status: "PUBLISHED",
    });
    const recipe = await createRecipe(input, admin);
    console.log(`✓ ${index + 1} ${s.title} → /aiko/recipes/${recipe.slug}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
