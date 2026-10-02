/**
 * Imports Aiko Kitchen's DESSERTS SOPs (transcribed from rec h.pdf, one recipe per page:
 * Mooncake, Honey Chilli Noodles, Coconut Soufflé, Millie Feuille, Ferrero Crunch 2.0)
 * into the Aiko brand's DESSERTS category, with their photos (the PDF's own photos,
 * saved in backend/data/aiko-desserts). They use the standard Aiko card
 * (lib/sop/aiko.ts) with per-recipe options stored in customFields.aiko.
 * Safe to re-run: recipes are matched by externalId and replaced.
 *
 *   npx tsx --tsconfig tsconfig.json --conditions=react-server backend/scripts/import-aiko-desserts.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "@/server/db";
import { uploadImage } from "@/server/media/upload";
import { createRecipe } from "@/server/services/recipe";
import { RecipeInputSchema } from "@/lib/schemas/recipe";

const PHOTOS = path.resolve("backend/data/aiko-desserts");
const AUTHOR = "Bookend's Hospitality";
const APPROVED = "Husen Khan";
const NO_DATA = "No quantity or method stated in the source booklet.";

interface Dessert {
  code: string;
  photo: string;
  slug: string;
  title: string;
  description: string;
  portionLabel: string;
  portion: string;
  serviceLabel: string;
  service: string;
  /** "GROUP|Name|Quantity" – an empty quantity makes a plain list row; "GROUP|> text" is an italic note. */
  ingredients: string[];
  splitAt?: number;
  /** "TITLE::text" opens a titled method section; numbering keeps counting across sections. */
  steps: string[];
  quality: string[];
  plating: string[];
}

const DESSERTS: Dessert[] = [
  {
    code: "DE-01", photo: "photo-1-mooncake.jpg", slug: "mooncake", title: "Mooncake",
    description: "Plated mooncake with star anise caramel, gianduja, Gold Callebaut ice cream and sesame tuile.",
    portionLabel: "Portion", portion: "Not stated", serviceLabel: "Service", service: "165 C / 2 min", splitAt: 5,
    ingredients: [
      "1. MOONCAKE SKIN|Maida|250 g", "1. MOONCAKE SKIN|Honey|150 g", "1. MOONCAKE SKIN|Lye water|1 1/4 tsp", "1. MOONCAKE SKIN|Oil|60 g",
      "2. LYE WATER|Baked baking soda (prep kitchen)|10 g", "2. LYE WATER|Water|90 g",
      "3. GIANDUJA FILLING|Dark Callebaut|60 g", "3. GIANDUJA FILLING|Milk Callebaut|60 g", "3. GIANDUJA FILLING|Almond praline|50 g", "3. GIANDUJA FILLING|Butter|30 g", "3. GIANDUJA FILLING|Condensed milk|35 g", "3. GIANDUJA FILLING|Milk powder|40 g", "3. GIANDUJA FILLING|Cocoa powder|10 g",
      "7. BROWN BUTTER FUDGE|Dark chocolate|100 g", "7. BROWN BUTTER FUDGE|Salt|0.5 g", "7. BROWN BUTTER FUDGE|Condensed milk|80 g", "7. BROWN BUTTER FUDGE|Vanilla extract|0.5 g", "7. BROWN BUTTER FUDGE|Brown butter|15 g", "7. BROWN BUTTER FUDGE|Nescafe Gold|1 g",
      "8. MAPLE GLAZE|Maple syrup|1 tbsp", "8. MAPLE GLAZE|Honey|1 tbsp", "8. MAPLE GLAZE|Water|2 tsp",
      "4. GOLD CALLEBAUT ICE CREAM|Milk|250 g", "4. GOLD CALLEBAUT ICE CREAM|Fresh cream|200 g", "4. GOLD CALLEBAUT ICE CREAM|Madhur sugar|60 g", "4. GOLD CALLEBAUT ICE CREAM|Corn syrup|20 g", "4. GOLD CALLEBAUT ICE CREAM|Milk powder|10 g", "4. GOLD CALLEBAUT ICE CREAM|Callebaut Gold|60 g", "4. GOLD CALLEBAUT ICE CREAM|Salt|1 g", "4. GOLD CALLEBAUT ICE CREAM|Vanilla|2 g", "4. GOLD CALLEBAUT ICE CREAM|Vanilla bean paste|1.5 g", "4. GOLD CALLEBAUT ICE CREAM|Soy lecithin|1.2 g", "4. GOLD CALLEBAUT ICE CREAM|Xanthan gum|0.35 g", "4. GOLD CALLEBAUT ICE CREAM|Guar gum|0.8 g", "4. GOLD CALLEBAUT ICE CREAM|Locust bean gum|0.9 g", "4. GOLD CALLEBAUT ICE CREAM|Kappa carrageenan|0.35 g", "4. GOLD CALLEBAUT ICE CREAM|TOTAL|~607 g",
      "6. STAR ANISE CARAMEL|Milk|75 g", "6. STAR ANISE CARAMEL|Cream|75 g", "6. STAR ANISE CARAMEL|Butter|15 g", "6. STAR ANISE CARAMEL|Castor sugar|90 g", "6. STAR ANISE CARAMEL|Muscovado|10 g", "6. STAR ANISE CARAMEL|Water|2 tbsp", "6. STAR ANISE CARAMEL|Vanilla|1 1/2 tsp", "6. STAR ANISE CARAMEL|Salt|1 g", "6. STAR ANISE CARAMEL|Sichuan pepper + star anise powder|2.5 g", "6. STAR ANISE CARAMEL|Cinnamon|0.3 g",
      "9. SESAME TUILE|Butter|24 g", "9. SESAME TUILE|Honey|18 g", "9. SESAME TUILE|Brown sugar|37.5 g", "9. SESAME TUILE|White sesame|15 g", "9. SESAME TUILE|Black sesame|15 g", "9. SESAME TUILE|Vanilla|0.6 g", "9. SESAME TUILE|Flour|4.7 g",
      "10. CHOCOLATE CRUMBS|> Heading only in the source booklet; no quantity or method is stated.",
    ],
    steps: [
      "1. MOONCAKE SKIN::Mix maida, honey and lye water, form a dough.", "Lastly, add oil.", "Let it sit for half an hour.", "Mould it and bake at 170 C for 14 minutes, fan speed 2.",
      "For service: bake at 165 C for 2 minutes, fan speed 1, then microwave for 20 seconds.", "Finish with maple glaze.",
      "2. LYE WATER::Mix together.",
      "3. GIANDUJA FILLING::Melt chocolate and add praline, softened butter and condensed milk.", "Whisk in milk powder and cocoa powder.",
      "4. GOLD CALLEBAUT ICE CREAM::Method not stated in the source booklet.",
      "6. STAR ANISE CARAMEL::Combine milk and cream in a bowl.", "Add sugar and water in a pot and make a golden dry caramel.",
      "Combine the cream and milk into the caramel; cook till everything emulsifies, then add butter, salt, vanilla, spice powder and cinnamon.", "Consistency should be saucy.",
      "7. BROWN BUTTER FUDGE::Brown the butter in a pot; portion into moulds and freeze - melt right before use in the microwave.",
      "In a pot, add chocolate, salt, condensed milk and coffee diluted in water.", "Cook the mixture until it thickens and starts sticking to the pot.", "Add vanilla and brown butter while still hot.",
      "Line a 10 x 10 cm ring on a Silpat, brushed with butter (prepare this before starting).", "Pour the batter into the ring, level it, and chill in the fridge for a minimum of 2 hours.", "Cut into 1 cm x 1 cm cubes.",
      "8. MAPLE GLAZE::Warm everything together.",
      "9. SESAME TUILE::Same process as the caramel tuile.",
      "10. CHOCOLATE CRUMBS::No method stated in the source booklet.",
    ],
    quality: ["Rest mooncake skin dough for half an hour.", "Bake at 170 C for 14 minutes, fan speed 2.", "For service: 165 C for 2 minutes, fan speed 1, then microwave 20 seconds.", "Star anise caramel consistency should be saucy.", "Brown butter fudge: chill for a minimum of 2 hours before cutting."],
    plating: ["Plate with star anise caramel, gianduja, Gold Callebaut ice cream and sesame tuile. Finish the mooncake with maple glaze."],
  },
  {
    code: "DE-02", photo: "photo-2-honey-chilli-noodles.jpg", slug: "honey-chilli-noodles", title: "Honey Chilli Noodles",
    description: "Crisp fried spring roll noodles, gochugaru & black sesame, served over marmalade ice cream.",
    portionLabel: "Portion", portion: "Not stated", serviceLabel: "Fry temp", service: "Not stated", splitAt: 4,
    ingredients: [
      "BASE|> Spring roll sheet, cut into thin strips and fried in oil.",
      "1. MARMALADE|Malta|1 pc", "1. MARMALADE|Sugar|150 g",
      "2. VANILLA ICE CREAM|> Same as brunch vanilla ice cream.",
      "3. MARMALADE ICE CREAM|Vanilla ice cream (use 900 milk wali recipe)|2500 g", "3. MARMALADE ICE CREAM|Marmalade|250 g",
      "4. HOT HONEY PATE DE FRUIT|Water|150 g", "4. HOT HONEY PATE DE FRUIT|Hot honey (honey + hot sauce)|100 g", "4. HOT HONEY PATE DE FRUIT|Glucose syrup|20 g", "4. HOT HONEY PATE DE FRUIT|Castor sugar|100 g", "4. HOT HONEY PATE DE FRUIT|Pectin powder (Yellow/HM)|6 g", "4. HOT HONEY PATE DE FRUIT|Citric acid solution|2 g",
      "5. HOT HONEY FOR PDF|Hot sauce|10 g", "5. HOT HONEY FOR PDF|Honey|100 g",
      "6. HOT HONEY FOR DRIZZLE|Honey|100 g", "6. HOT HONEY FOR DRIZZLE|Hot sauce|10 g", "6. HOT HONEY FOR DRIZZLE|Star anise (5 g) + Sichuan pepper (20 g)|0.5 g",
      `7. GOCHUGARU DUST|> ${NO_DATA}`, `8. BLACK SESAME SEEDS|> ${NO_DATA}`,
    ],
    steps: [
      "BASE::Cut spring roll sheet into thin strips and fry in oil.",
      "1. MARMALADE::Blanch malta for 2 minutes, 8 times.", "Blend malta into a chunky mix.", "Transfer the chunky mix to a pot, add sugar, and cook until it turns slightly translucent.",
      "2. VANILLA ICE CREAM::Same as brunch vanilla ice cream.",
      "3. MARMALADE ICE CREAM::Method not stated in the source booklet.",
      "4. HOT HONEY PATE DE FRUIT::Same process as all pate de fruit.",
      "5. HOT HONEY FOR PDF::Formula stated in source; separate method not stated.",
      "6. HOT HONEY FOR DRIZZLE::Formula stated in source; separate method not stated.",
      "7. GOCHUGARU DUST::No method stated in the source booklet.",
      "8. BLACK SESAME SEEDS::No method stated in the source booklet.",
    ],
    quality: ["Blanch malta for 2 minutes, 8 times.", "Blend malta into a chunky mix.", "Cook marmalade with sugar until it turns slightly translucent.", "Hot honey pate de fruit follows the same process as all pate de fruit."],
    plating: ["Serve crisp fried spring roll noodles over marmalade ice cream, with gochugaru and black sesame as stated in the source description."],
  },
  {
    code: "DE-03", photo: "photo-3-coconut-souffle.jpg", slug: "coconut-souffle", title: "Coconut Soufflé",
    description: "Chocolate coconut soufflé • ganache insert • toasted coconut ice cream",
    portionLabel: "Portion", portion: "165 g plated", serviceLabel: "Bake", service: "180°C / 10 min",
    ingredients: [
      "1. SOUFFLÉ BATTER|Flour|52.5 g", "1. SOUFFLÉ BATTER|Cocoa powder|18 g", "1. SOUFFLÉ BATTER|Salt|1 g", "1. SOUFFLÉ BATTER|Castor sugar|45 g", "1. SOUFFLÉ BATTER|Oil|37.5 g", "1. SOUFFLÉ BATTER|Coconut milk|75 g", "1. SOUFFLÉ BATTER|Baking powder|1.2 g", "1. SOUFFLÉ BATTER|Baking soda|1.2 g", "1. SOUFFLÉ BATTER|Total|231.4 g",
      "2. GANACHE INSERT|Callebaut dark|125 g", "2. GANACHE INSERT|Coconut cream|100 g", "2. GANACHE INSERT|Total|225 g",
      "3. COCONUT MILK INFUSION|Coconut milk|500 g", "3. COCONUT MILK INFUSION|Toasted coconut|200 g", "3. COCONUT MILK INFUSION|Total|700 g",
      "4. COCONUT ICE CREAM|Infused coconut milk|500 g", "4. COCONUT ICE CREAM|Coconut cream|240 g", "4. COCONUT ICE CREAM|Madhur sugar|170 g", "4. COCONUT ICE CREAM|Corn flour|10 g", "4. COCONUT ICE CREAM|Glucose syrup|50 g", "4. COCONUT ICE CREAM|Cocoa butter|90 g", "4. COCONUT ICE CREAM|Water|60 g", "4. COCONUT ICE CREAM|Soy lecithin|2 g", "4. COCONUT ICE CREAM|Xanthan|0.2 g", "4. COCONUT ICE CREAM|Guar Gum|0.1 g", "4. COCONUT ICE CREAM|Locust Bean Gum|0.3 g", "4. COCONUT ICE CREAM|Salt|1 g", "4. COCONUT ICE CREAM|Total|1123.6 g",
      "5. FINAL PLATING|Sponge batter|80 g", "5. FINAL PLATING|Ganache insert|25 g", "5. FINAL PLATING|Toasted coconut flakes|2 g", "5. FINAL PLATING|Ice cream|58 g", "5. FINAL PLATING|Total|165 g",
    ],
    steps: [
      "1. SOUFFLÉ BATTER::Oil and sugar together.", "Weigh out the dry ingredients separately except baking powder and baking soda.", "Whisk oil and sugar well and add dry ingredients gradually; add coconut milk and mix well till no lumps.",
      "2. GANACHE INSERT::Melt chocolate and add coconut cream to make a ganache.", "Set in the desired mould.",
      "3. COCONUT MILK INFUSION::Heat the coconut milk and add toasted coconut flakes to it.", "Let it come to room temperature and put in the fridge overnight to infuse.", "Next day, bring the mix to a boil and then strain with a muslin cloth.",
      "4. COCONUT ICE CREAM::Weigh coconut milk, coconut cream, Madhur sugar, cornflour, glucose, cocoa butter, water, xanthan, guar gum, locust bean gum and salt in a pot.", "Heat the mix till 80°C.",
      "Remove from heat, add soy lecithin and blend till there are no lumps. Strain the mix.", "Let it come to room temp and then chill in the fridge for minimum 4 hours or overnight.", "Blend the mixture before churning and churn for 25 mins.",
      "5. FINAL PLATING::Portion out 100 g of batter and microwave it for 10 seconds.", "Mix the baking powder and baking soda into it and fill a ramekin with 80% of the batter.", "Add the insert and cover the top with the remaining batter.", "Bake at 180°C for 10 mins.",
      "Put it on a serving plate and serve with toasted coconut ice cream; add toasted coconut flakes on top.",
    ],
    quality: ["Infuse toasted coconut in coconut milk overnight; boil and strain next day.", "Ice cream: heat to 80°C, chill minimum 4 hours/overnight, then churn 25 minutes.", "Final soufflé bake: 180°C for 10 minutes; plated portion total 165 g."],
    plating: ["80 g soufflé batter + 25 g ganache insert + 58 g coconut ice cream + 2 g toasted coconut flakes.", "Serve immediately after baking."],
  },
  {
    code: "DE-04", photo: "photo-4-millie-feuille.jpg", slug: "millie-feuille", title: "Millie Feuille",
    description: "Spring roll sheet • pista butter • vanilla cream • raspberry jam",
    portionLabel: "Yield", portion: "322 total", serviceLabel: "Service", service: "Not stated",
    ingredients: [
      "COMPONENTS / REFERENCES|Spring roll sheet|", "COMPONENTS / REFERENCES|Pista Butter (Recipe in common)|", "COMPONENTS / REFERENCES|Vanilla Cream (Recipe in common)|", "COMPONENTS / REFERENCES|Raspberry Jam (Recipe in common)|",
      "FINAL PLATING|Spring roll sheet|14", "FINAL PLATING|Pista butter|5", "FINAL PLATING|Vanilla cream|280", "FINAL PLATING|Raspberry jam|21", "FINAL PLATING|Crushed pisti|2", "FINAL PLATING|Total|322",
    ],
    steps: [
      "FINAL PLATING::Cut the spring roll sheet with the appropriate ring cutter and fry them.", "Start by spreading pista butter on a plate in a circular motion.", "Place one fried spring roll sheet in the centre of the pista butter.",
      "Pipe dollops of vanilla cream following the rim of the spring roll sheet.", "Pipe raspberry jam in the centre of vanilla cream dollops.", "Repeat this for 6 sheets stacked on top of each other.", "Sprinkle crushed pistachios on top.",
    ],
    quality: ["Cut and fry the spring roll sheets before assembly.", "Spread pista butter on the plate in a circular motion.", "Repeat the assembly for 6 sheets stacked on top of each other.", "Finish with crushed pistachios on top."],
    plating: ["Spread pista butter, center the fried spring roll sheet, pipe vanilla cream and raspberry jam, stack as specified, and finish with crushed pistachios."],
  },
  {
    code: "DE-05", photo: "photo-5-ferrero-crunch-2-0.jpg", slug: "ferrero-crunch-2-0", title: "Ferrero Crunch 2.0",
    description: "Chocolate sponge • hazelnut praline • ganache • Nutella cream • chocolate streusel",
    portionLabel: "Yield", portion: "160 g final", serviceLabel: "Service", service: "Not stated",
    ingredients: [
      "COMPONENTS / REFERENCES|Chocolate sponge (Recipe in common)|", "COMPONENTS / REFERENCES|Nutella|", "COMPONENTS / REFERENCES|Hazelnut Praline (Recipe in common)|", "COMPONENTS / REFERENCES|Chopped hazelnut|", "COMPONENTS / REFERENCES|Crisp|", "COMPONENTS / REFERENCES|Ganache (Recipe in common)|", "COMPONENTS / REFERENCES|Gourmet glaze (Recipe in common)|", "COMPONENTS / REFERENCES|Vanilla Cream (Recipe in common)|", "COMPONENTS / REFERENCES|Nutella cream|",
      "NUTELLA CREAM|vanilla cream|100 g", "NUTELLA CREAM|Nutella|50 g", "NUTELLA CREAM|Total|150 g",
      "CHOCOLATE STREUSEL|Mascovado sugar|40 g", "CHOCOLATE STREUSEL|Butter|30 g", "CHOCOLATE STREUSEL|Flour|40 g", "CHOCOLATE STREUSEL|Cocoa powder|7 g", "CHOCOLATE STREUSEL|Total|117 g",
      "FINAL PLATING|Sponge|10 g", "FINAL PLATING|Nutella|10 g", "FINAL PLATING|Hazelnut praline|5 g", "FINAL PLATING|Crisp|10 g", "FINAL PLATING|Cocoa butter|2 g", "FINAL PLATING|Chopped hazelnut|5 g", "FINAL PLATING|Ganache|55 g", "FINAL PLATING|Gourmet glaze|21 g", "FINAL PLATING|Vanilla cream|15 g", "FINAL PLATING|Nutella cream|20 g", "FINAL PLATING|Chocolate streusel|2 g", "FINAL PLATING|1/2 Hazelnut|4", "FINAL PLATING|Chocolate stick|1", "FINAL PLATING|Total|160 g",
    ],
    steps: [
      "NUTELLA CREAM::Mix together tiramisu mix and Nutella till there are no lumps.",
      "ASSEMBLING FERRERO::Cut chocolate sponge with a round ring and cut 5mm layers.", "Put 10g Nutella and 5 g hazelnut praline.", "Weigh 10g crisp and dip in cocoa butter and layer on top of the sponge.", "Add 30g ganache and flatten the top.", "Demould and glaze.", "Use 3 different nozzles to pipe vanilla cream, ganache and nutella cream.", "Place 1/2 hazelnuts, chocolate streusel and chocolate stick.",
      "CHOCOLATE STREUSEL::Rub cold butter cube in mixture of sugar, flour and Cocoa powder.", "Rest the mixture till frozen again.", "Bake at 180c for 10 mins.",
      "FINAL PLATING::Use 3 different nozzles to pipe vanilla cream, ganache and Nutella cream.", "Place 1/2 hazelnuts.", "Place chocolate streusel.", "Place chocolate sticks.",
    ],
    quality: ["Cut chocolate sponge into 5mm layers.", "Dip 10g crisp in cocoa butter before layering.", "Bake chocolate streusel at 180c for 10 mins.", "Demould and glaze before the final piping and garnish."],
    plating: ["Pipe vanilla cream, ganache and Nutella cream with 3 different nozzles. Finish with 1/2 hazelnuts, chocolate streusel and chocolate sticks."],
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
  const category = await db.category.findUniqueOrThrow({ where: { brandId_slug: { brandId: brand.id, slug: "desserts" } } });

  for (const s of DESSERTS) {
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
      const [group, name, value = ""] = row.split("|");
      const { quantity, unit } = parseQty(value);
      return { position, groupLabel: group, quantity, unit, name, raw: `${name} ${value}`.trim().slice(0, 200) };
    });
    const steps = s.steps.map((line, position) => {
      const i = line.indexOf("::");
      return i > 0
        ? { phase: "COOK" as const, position, title: line.slice(0, i), body: line.slice(i + 2) }
        : { phase: "COOK" as const, position, title: null, body: line };
    });

    const input = RecipeInputSchema.parse({
      brandId: brand.id,
      categoryId: category.id,
      externalId,
      slug: s.slug,
      title: s.title,
      excerpt: s.description.slice(0, 220),
      description: s.description,
      heroImageId: media.id,
      yieldText: s.portion,
      dietary: ["Not stated"],
      author: AUTHOR,
      approvedBy: APPROVED,
      allergens: "Not stated",
      dishType: "Dessert",
      service: s.service,
      qualityCheck: s.quality,
      plating: s.plating.join("\n"),
      customFields: {
        aiko: {
          statLabels: { portion: s.portionLabel.toUpperCase(), service: s.serviceLabel.toUpperCase() },
          ingHeading: "INGREDIENTS / COMPONENTS",
          ingSub: null,
          ingSplitAt: s.splitAt,
          continuousSteps: true,
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
