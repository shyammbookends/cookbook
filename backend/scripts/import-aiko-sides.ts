/**
 * Imports Aiko Kitchen's "Sides" SOPs (transcribed from the Aiko Sides PDF)
 * into the Aiko brand, with their dish photos, and switches Aiko to the Aiko
 * card design. Safe to re-run: recipes are matched by externalId and replaced.
 *
 *   set -a; . ./.env; set +a
 *   npx tsx --tsconfig tsconfig.json --conditions=react-server backend/scripts/import-aiko-sides.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "@/server/db";
import { uploadImage } from "@/server/media/upload";
import { createRecipe } from "@/server/services/recipe";
import { RecipeInputSchema } from "@/lib/schemas/recipe";

const PHOTOS = path.resolve("backend/data/aiko-sides");
const AUTHOR = "Bookend's Hospitality";
const APPROVED = "Husen Khan";

interface Side {
  code: string;
  photo: string;
  title: string;
  subtitle?: string;
  description: string;
  type: string;
  diet: string;
  portion: string;
  service: string;
  allergens: string;
  station?: string;
  version?: string;
  /** [name, quantity as printed]; a ["## Heading"] row starts an ingredient group. */
  ingredients: ([string, string] | [string])[];
  /** Step text; "## Heading" starts a titled method section. */
  steps: string[];
  quality: string[];
  plating: string[];
  sections?: string;
}

const SIDES: Side[] = [
  {
    code: "SD-001", photo: "tom-yum", title: "Tom Yum",
    description: "A bold and aromatic hot & sour soup that balances spice, acidity and umami. A classic base that can be elevated with mushrooms or aromatic herbs.",
    type: "Hot & Sour Soup Base", diet: "Vegetarian", portion: "1 PORTION", service: "Hot", allergens: "None",
    ingredients: [["Thai chilli", "18 g"], ["Onion", "40 g"], ["Garlic", "15 g"], ["Shiitake mushroom", "15 g"], ["Tamarind paste", "60 g"], ["Water", "60 ml"], ["Vinegar", "60 ml"], ["Brown sugar", "50 g"]],
    steps: ["Blend chilli, onion, garlic, mushroom to coarse paste.", "Cook paste until aromatic.", "Add tamarind, water, vinegar, sugar; simmer 8–10 min.", "Adjust hot–sour balance as per standard."],
    quality: ["No raw garlic aroma", "Balanced sourness + heat", "Clean finish"],
    plating: ["Serve hot."],
  },
  {
    code: "SD-002", photo: "thai-spring-roll", title: "Thai Spring Roll",
    description: "Crispy golden spring rolls filled with flavorful Thai-style filling, drizzled with sriracha sauce and finished with spring onion slit for a fresh, spicy kick.",
    type: "Fried Appetizer", diet: "Non-Veg", portion: "1 PORTION", service: "Hot", allergens: "Gluten, Soy, Sesame",
    ingredients: [["Spring Roll Sheets", "1 pc (13.75 g)"], ["Thai Spring Filling", "120 g"], ["Sichuan Sauce", "30 g"], ["Coriander Leaves", "4 g"], ["Spring Onion Slit", "4 g"], ["Sriracha Sauce", "15 g"], ["Black Vinegar", "10 g"]],
    steps: [
      "Place approximately 30 g Thai spring filling on each spring roll sheet.",
      "Roll tightly while folding the sides inward.\nSeal the edge using slurry/water if required.",
      "Heat oil to 170–175°C. Carefully fry spring rolls until golden brown and crispy.",
      "Remove and drain excess oil on absorbent paper.",
      "Serve spring rolls as entire pieces.\nDrizzle with sriracha sauce.\nGarnish with spring onion slit.",
    ],
    quality: ["Crispy golden exterior", "Filling hot and properly cooked", "Roll tightly sealed without breakage", "No excess oiliness", "Balanced spicy and tangy flavor"],
    plating: ["Serve spring rolls as entire pieces.", "Drizzle with sriracha sauce.", "Garnish with spring onion slit.", "Serve immediately while hot and crispy."],
  },
  {
    code: "SD-003", photo: "kwispy-lotus-root", title: "Kwispy Lotus Root",
    description: "Crispy lotus root tossed in a flavorful Asian-style sauce with crunchy vegetables and aromatics. A perfect balance of crispy texture and glossy, savory glaze.",
    type: "Crispy", diet: "Vegetarian", portion: "1 PORTION", service: "Hot", allergens: "Soy",
    ingredients: [["Lotus root", "50 g"], ["Lotus root sauce", "30 g"], ["Pok choy", "15 g"], ["Onion", "20 g"], ["Bell pepper", "20 g"], ["Spring onion", "10 g"], ["Thai red chilli", "6 g"], ["Garlic", "10 g"], ["Basil", "5 g"]],
    steps: ["Fry lotus root until crisp; drain well.", "Heat wok; add garlic + chilli; sauté briefly.", "Add onion + bell pepper; toss 30–40 sec.", "Add sauce + pok choy; bring to bubble.", "Add lotus root; toss quickly to coat.", "Finish spring onion + basil; plate immediately."],
    quality: ["Crisp texture", "Glossy coating", "No sogginess", "Balanced savory and spicy flavor"],
    plating: ["Serve immediately after toss.", "Ensure lotus root is crisp.", "Garnish with spring onion and basil.", "Serve hot for best taste and texture."],
  },
  {
    code: "SD-004", photo: "kwispy-wonton", title: "Kwispy Wonton",
    description: "Crispy fried wontons filled with savory juicy filling, served with spicy chilli crisps and garnished with fresh coriander. A perfect crunch in every bite.",
    type: "Fried Appetizer", diet: "Vegetarian", portion: "1 PORTION", service: "Hot", allergens: "Gluten, Soy, Sesame",
    ingredients: [["Kwispy Wonton filling", "75 g"], ["Gyoza skin", "5 pcs"], ["Corn slurry", "1 g"], ["Chilli crisps", "15 g"], ["Coriander", "5 g"], ["Oil (for frying)", "As required"]],
    steps: [
      "Place approx. 15 g of Kwispy Wonton filling in the center of each gyoza skin.",
      "Apply corn slurry on the edges. Fold and seal tightly in desired shape.",
      "Heat oil to 170–175°C. Carefully drop wontons into hot oil.",
      "Fry for 3–4 minutes or until golden brown and crispy.",
      "Remove and drain excess oil on paper towel.",
    ],
    quality: ["Golden crispy exterior", "Hot juicy filling", "Properly sealed wontons", "Balanced chilli crisp flavor", "Clean finish, no excess oil"],
    plating: ["Arrange crispy wontons in serving bowl.", "Serve with chilli crisps.", "Garnish with fresh coriander.", "Serve immediately while hot and crispy."],
  },
  {
    code: "SD-005", photo: "tteokbokki", title: "Tteokbokki",
    description: "Chewy Korean rice cakes tossed in a flavorful, slightly sweet and spicy sauce, finished with spring onion and fried garlic for a bold and satisfying bite.",
    type: "Korean Rice Cake Toss", diet: "Vegetarian", portion: "1 PORTION", service: "Hot", allergens: "Soy, MSG",
    ingredients: [["Water", "15 ml"], ["Rice cake (16 pcs)", "133.33 g"], ["Tteokbokki sauce", "30 g"], ["Salt", "0.3 g"], ["MSG", "1 g"], ["Sugar", "0.5 g"], ["Spring onion", "2 g"], ["Fried garlic", "1 g"], ["Spring onion slit (garnish)", "2 g"]],
    steps: ["Blanch rice cakes until soft; drain well.", "Heat pan; add water + sauce; bring to simmer.", "Add rice cakes; toss to coat.", "Add salt, MSG, sugar; reduce until glossy.", "Finish spring onion + fried garlic; garnish with spring onion slit."],
    quality: ["Chewy cakes", "Glossy sauce coating", "Well balanced sweet, spicy and savory", "No excess liquid", "Serve hot"],
    plating: ["Serve hot immediately.", "Garnish with spring onion slit.", "Best enjoyed fresh.", "Serve hot for best taste and texture."],
  },
  {
    code: "SD-006", photo: "tofu-bao", title: "Tofu Bao",
    description: "Soft steamed bao filled with crispy battered tofu, crunchy slaw, fresh cucumber and our signature bao sauce. A perfect balance of textures and flavors in every bite.",
    type: "Steamed Bao", diet: "Vegetarian", portion: "1 PORTION", service: "Hot", allergens: "Soy, Sesame",
    ingredients: [["Bao", "70 g"], ["Tofu", "50 g"], ["Tofu batter", "20 g"], ["Cucumber", "10 g"], ["Coleslaw", "50 g"], ["Black & white sesame", "3 g"], ["Bao sauce base", "20 g"]],
    steps: [
      "Mise en place: Keep all ingredients measured and ready.\nSlice cucumber into thin strips. Prepare coleslaw chilled.\nHeat oil to 170–175°C. Steam bao until soft and warm.",
      "Coat tofu evenly with tofu batter.",
      "Deep fry at 170–175°C until golden brown and crispy.",
      "Remove and drain excess oil on absorbent paper.",
      "Open warm bao carefully without tearing.",
      "Spread bao sauce base evenly inside the bao.",
      "Add coleslaw followed by crispy tofu.",
      "Place cucumber strips neatly on top.",
      "Garnish with black & white sesame.",
      "Serve immediately while bao is warm and tofu is crispy.",
    ],
    quality: ["Bao should be soft and warm", "Tofu must be crispy outside and soft inside", "Balanced sauce distribution", "Fresh and crunchy salad texture", "Clean and neat assembly"],
    plating: ["Serve immediately after assembly.", "Do not hold assembled bao for more than 3 minutes before service.", "Serve hot for best taste and texture."],
  },
  {
    code: "SD-007", photo: "general-tsos-water-chestnuts", title: "General Tso's Water Chestnuts",
    description: "Crispy water chestnuts tossed in a sticky, savory and slightly sweet glaze with crunchy vegetables and aromatic flavors. Finished with crispy spring roll strips for the perfect texture contrast.",
    type: "Crispy Glazed", diet: "Vegetarian", portion: "1 PORTION", service: "Hot", allergens: "Soy, Gluten",
    ingredients: [["Water chestnut", "190 g"], ["Water chestnut flour", "20 g"], ["Gyoza dip", "5 g"], ["Yellow bell pepper", "15 g"], ["Red bell pepper", "15 g"], ["Onion", "20 g"], ["Spring onion", "15 g"], ["Thai red chilli", "5 g"], ["Basil", "3 g"], ["Chopped garlic", "5 g"], ["Drunken sauce", "15 g"], ["Fried spring roll (garnish)", "10 g"]],
    steps: [
      "Coat water chestnut with flour; shake off excess.\nDeep fry until golden and crispy; drain.",
      "Heat wok on high flame. Add chopped garlic, Thai red chilli and onion; stir-fry until aromatic.",
      "Add yellow and red bell peppers; stir-fry until slightly soft yet crunchy.",
      "Add sauces (gyoza dip + drunken sauce); bring to a simmer and stir until the glaze thickens.",
      "Add fried water chestnuts and spring onion; toss quickly to coat. Finish with basil.\nTransfer to serving bowl.\nGarnish with fried spring roll strips.",
    ],
    quality: ["Crisp exterior", "Sticky glaze that coats evenly", "Balanced sweet, savory and spicy flavor", "Crunchy vegetables", "No excess oiliness", "Served hot"],
    plating: ["Serve hot immediately.", "Garnish with fried spring roll strips.", "Best enjoyed fresh for maximum crispiness.", "Serve hot for best taste and texture."],
  },
  {
    code: "SD-008", photo: "steamed-edamame", title: "Steamed Edamame", subtitle: "(Chilli / Salted)",
    description: "Tender steamed edamame tossed with seasoning for a light, flavorful and satisfying snack or side.",
    type: "Steamed", diet: "Vegetarian", portion: "1 PORTION", service: "Hot", allergens: "Soy",
    ingredients: [["With pods edamame", "160 g"], ["Chilli Crisp (for chilli version)", "12 g"], ["Salt (for salted version)", "4 g"], ["TOTAL", "172 g"]],
    steps: [
      "Steam edamame with pods until tender and hot.\nDrain any excess water.",
      "Transfer steamed edamame to a bowl.",
      "For chilli version: Add chilli crisp and toss evenly to coat.\nFor salted version: Add salt and toss evenly to coat.",
      "Serve hot immediately.",
    ],
    quality: ["Edamame should be tender and hot", "Even coating of seasoning", "Balanced flavor", "No excess moisture", "Clean and neat presentation"],
    plating: ["Serve hot immediately.", "Best enjoyed fresh.", "Serve hot for best taste and texture."],
    sections: `# STEAM EDAMAME SALT RECIPE
* Ingredients | Gram
With pods edamame | 160
Salt | 4
Total | 164 g
> Toss steamed edamame with salt and serve hot.`,
  },
  {
    code: "SD-009", photo: "korean-mandu", title: "Korean Mandu",
    description: "Crispy fried mandu filled with a savory Korean tofu and vegetable mixture, served with spicy and coriander mayo, garnished with toasted sesame seeds and nori strips.",
    type: "Fried", diet: "Vegetarian", portion: "1 PORTION", service: "Hot", allergens: "Soy, Gluten",
    ingredients: [
      ["## Mandu Components | Gram"], ["Korean Mandu filling", "75.00"], ["Gyoza skin", "5.00"],
      ["## Garnish & Sauces | Gram"], ["Spicy mayo", "10.00"], ["Coriander mayo", "10.00"], ["Toasted white sesame seeds", "5.00"], ["Julienne cut nori sheet", "1.00"], ["TOTAL", "106.00 g"],
    ],
    steps: [
      "Prepare Korean Mandu filling (see filling method below).\nAllow to cool completely.",
      "Place 1 portion (approx. 75 g) of filling in the center of the gyoza skin.",
      "Moisten edges with water. Fold and pleat to seal securely.",
      "Heat oil to 175°C. Fry mandu until golden brown and crisp, about 3–4 minutes. Drain excess oil.",
      "Drizzle spicy mayo and coriander mayo over mandu.",
      "Garnish with toasted white sesame seeds and julienne cut nori sheets.",
      "Serve hot immediately.",
      "## Method — Korean Mandu Filling",
      "In a pan, heat oil and sauté jalapeño, capsicum, zucchini and water chestnut until slightly softened.",
      "Add dry squeezed napa cabbage and stir-fry for 2 minutes.",
      "Add firm tofu crumble and silken tofu puree; mix well.",
      "Season with light soy sauce, rice vinegar, sugar, white pepper and black pepper.",
      "Sprinkle cornflour and cook until mixture is thick and moist but not watery.",
      "Remove from heat and fold in coriander leaves, basil leaves and parsley leaves. Cool before use.",
    ],
    quality: ["Mandu crisp and golden", "Filling moist and flavorful", "Sauces balanced and creamy", "Garnish fresh and attractive", "No oiliness or sogginess"],
    plating: ["Arrange fried mandu in a neat row.", "Drizzle sauces evenly.", "Garnish with sesame seeds and nori strips.", "Serve hot for best taste and texture.", "Serve hot immediately."],
    sections: `# KOREAN MANDU FILLING // (MAKES BULK FILLING) @mid
* Ingredients | Gram
Firm tofu crumble | 300.00
Silken tofu puree | 300.00
Napa cabbage (dry squeezed) | 400.00
Green capsicum | 150.00
Zucchini outer flesh | 140.00
Water chestnut | 150.00
Jalapeño | 256.00
Light soy sauce | 30.00
Rice vinegar | 12.00
Sugar | 14.00
White pepper | 4.00
Black pepper | 3.00
Cornflour | 22.00
Coriander leaves | 25.00
Basil leaves | 20.00
Parsley leaves | 12.00`,
  },
  {
    code: "SD-010", photo: "creamy-corn-rocks", title: "Creamy Corn Rocks",
    description: "Crispy fried corn tossed in a creamy, flavorful sauce and finished with fresh garnishes for a rich and satisfying bite.",
    type: "Fried", diet: "Vegetarian", portion: "1 PORTION", service: "Hot", allergens: "Soy, Gluten",
    ingredients: [
      ["## Ingredients | Gram"], ["Fried Corn", "150"], ["Corn Rocks sauce", "80"], ["Water", "10"], ["Chopped Black sesame seeds", "1"], ["Chopped spring onion", "1"], ["Pickled red paprika sliced", "2"], ["TOTAL", "244 g"],
    ],
    steps: [
      "Heat corn rocks sauce in a pan over medium heat.",
      "Add water and stir well to adjust the consistency. Bring to a simmer.",
      "Add fried corn and toss to coat evenly with the sauce.",
      "Cook for 1–2 minutes until the sauce clings to the corn and is creamy.",
      "Transfer to a bowl.",
      "Garnish with chopped black sesame seeds, spring onion and pickled red paprika slices.\nServe hot immediately.",
    ],
    quality: ["Corn is crispy and well-coated", "Sauce is creamy and balanced", "Garnishes are fresh and vibrant", "No sogginess or excess oil", "Proper portion and plating"],
    plating: ["Serve hot immediately.", "Best enjoyed fresh.", "Ideal as a snack or appetizer.", "Serve hot for best taste and texture."],
    sections: `# SAUCE REFERENCE // (CORN ROCKS SAUCE)
* Ingredients | Gram
Mayonnaise | 40
Sweet corn puree | 20
Cream cheese | 10
Condensed milk | 5
Lemon juice | 3
Garlic (minced) | 1
Salt | 0.5
White pepper | 0.5
> Whisk all ingredients until smooth and creamy. Keep refrigerated.`,
  },
  {
    code: "SD-011", photo: "kwispy-scallion-pancake", title: "Kwispy Scallion Pancake",
    description: "Crispy scallion pancake filled and topped with creamy green garlic cheese, glazed with a savory Sichuan soy sauce and sriracha, finished with scallion salad and toasted sesame seeds.",
    type: "Fried", diet: "Vegetarian", portion: "1 PORTION", service: "Hot", allergens: "Soy, Gluten, Dairy",
    ingredients: [
      ["## Ingredients | Gram"], ["Sunflower oil", "30.00"], ["Scallion Pancake", "180.00"], ["Sichuan soy glaze", "5.00"], ["Green garlic cream cheese", "20.00"], ["Sriracha sauce", "20.00"], ["Scallion salad", "10.00"], ["Toasted white sesame seeds", "2.00"], ["TOTAL", "267.00 g"], ["WASTAGE", "5%"],
    ],
    steps: [
      "Prepare all components as per recipes below.",
      "Cook scallion pancake until golden brown and crispy on both sides.",
      "Heat Sichuan soy glaze and brush over the pancake.",
      "Drizzle green garlic cream cheese and sriracha sauce over the top.",
      "Top with scallion salad.",
      "Sprinkle toasted white sesame seeds.",
      "Slice or serve whole.",
      "Serve hot immediately.",
    ],
    quality: ["Pancake is crispy and golden", "Filling is creamy and well-balanced", "Glaze is flavorful and evenly coated", "Sauces are balanced and vibrant", "Garnish is fresh and attractive", "No sogginess or excess oil", "Proper portion and plating"],
    plating: ["Place pancake in the center of the plate.", "Drizzle sauces neatly as shown.", "Top with scallion salad.", "Finish with toasted sesame seeds.", "Serve hot for best taste and texture.", "Serve hot immediately."],
    sections: `# @mid
Scallion Pancake sheets | 80.00
Scallion filling | 30.00
Cream cheese | 30.00
Spring onion | 20.00
Green Garlic | 20.00
TOTAL | 180.00 g

# SAUCE / PREP RECIPES
## SCALLION FILLING
* Ingredients | Gram
Maida | 120.00
Salt | 20.00
White Pepper | 2.00
Schezwan Pepper | 2.00
White Parts Scallions | 100.00
Oil | 240.00
TOTAL | 484.00 g
## SICHUAN SOY GLAZE
* Ingredients | Gram
Dark Soy Sauce | 30.00
Hoisin Sauce | 15.00
Toasted Sesame Oil | 5.00
Sichuan Chili Powder | 2.00
Fresh ginger | 3.00
Corn slurry | 10.00
TOTAL | 77.00 g

# @bottom
## GREEN GARLIC CREAM CHEESE
* Ingredients | Gram
Cream Cheese | 200.00
Fresh Green Garlic (finely chopped) | 100.00
TOTAL | 300.00 g

# @bottom
## SCALLION PANCAKE DOUGH
* Ingredients | Gram
00 Pizza Flour | 490.00
Cake Flour | 230.00
Salt | 23.00
Boiling Water | 205.00
Normal Water | 80.00
TOTAL | 1028.00 g

# @bottom
## SCALLION SALAD
* Ingredients | Gram
Julienne cut spring onion | 10.00
Black vinegar | 5.00
Gochugaru | 1.00
TOTAL | 16.00 g`,
  },
  {
    code: "SD-012", photo: "cold-spicy-sesame-noodles", title: "Cold Spicy Sesame Noodles",
    description: "Refreshing soba noodles tossed in a spicy sesame sauce and topped with crisp vegetables, crushed peanuts and toasted sesame seeds for a perfect balance of heat, crunch and flavor.",
    type: "Cold Dish", diet: "Vegetarian", portion: "1 PORTION", service: "Cold", allergens: "Soy, Peanut, Sesame",
    ingredients: [
      ["## Ingredients | Gram"], ["Boiled soba noodles", "140.00"], ["Cold Spicy Sesame sauce", "50.00"], ["Cucumber slice", "15.00"], ["Carrot slice", "15.00"], ["Fried sesame", "5.00"], ["Peanut (crushed)", "10.00"], ["White Part Spring Onion", "10.00"], ["Mix iceberg romain slice", "15.00"], ["TOTAL", "260.00 g"], ["WASTAGE", "5%"],
    ],
    steps: [
      "Cook soba noodles as per package instructions. Rinse in cold water and drain well.",
      "In a bowl, add cold spicy sesame sauce and place the noodles. Toss well to coat evenly.",
      "Arrange cucumber slices, carrot slices and mix iceberg romaine on the side of the plate.",
      "Place the sauced noodles in the center.",
      "Top with white part spring onion, crushed peanuts and fried sesame.",
      "Serve immediately. Keep chilled until serving.",
    ],
    quality: ["Noodles are well cooked and chilled", "Sauce is well balanced and coats evenly", "Vegetables are fresh and crisp", "Peanuts are crunchy", "No sogginess or excess liquid", "Proper portion and plating"],
    plating: ["Use a wide bowl or plate.", "Arrange vegetables neatly on the side.", "Place noodles in the center.", "Garnish with spring onion, peanuts and fried sesame.", "Serve cold immediately for best taste.", "Serve cold immediately."],
    sections: `# COLD SPICY SESAME SAUCE
* Ingredients | Gram
Gochujang | 30.00
Red chilli powder | 10.00
Gochugaru | 10.00
Sugar | 10.00
Rice Vinegar | 12.00
Sesame Oil | 8.00
Soy Sauce | 20.00
Ketchup | 25.00
Garlic (minced) | 10.00
TOTAL | 135.00 g`,
  },
  {
    code: "SD-013", photo: "tokyo-style-pizza-dough-base", title: "Tokyo Style Pizza (Dough Base)",
    description: "A light and airy Tokyo style pizza with a crisp, blistered crust and soft chewy crumb. Perfect base for creative toppings and bold flavors.",
    type: "Baked", diet: "Vegetarian", portion: "150 g each", service: "Hot", allergens: "Gluten, Dairy",
    station: "Dough", version: "1.4",
    ingredients: [
      ["## Biga (pre-ferment)"], ["00 flour", "1125 g"], ["Water", "550 g"], ["Dry yeast", "3 g"],
      ["## Final dough"], ["Biga", "all prepared"], ["00 flour", "2625 g"], ["Cold water", "1900 g"], ["Dry yeast", "5 g"], ["Salt", "90 g"], ["EVOO", "50 g"], ["Brown sugar", "25 g"],
    ],
    steps: [
      "## Biga Preparation", "Combine water and dry yeast.", "Add flour and mix until shaggy.", "Cover loosely and ferment 12–16 h at room temp.",
      "## Final Dough Mixing", "Add fermented biga in mixer.", "Add cold water gradually.", "Add flour and dry yeast; mix.",
      "## Dough Development", "Add salt; mix 4–5 min.", "Drizzle EVOO; mix smooth (windowpane test).",
      "## Balling & Fermentation", "Rest 1–2 h.", "Divide into 150 g balls.", "Place in oiled trays; cover.", "Cold-ferment (CF) 48 h.",
      "## Pizza Preparation & Baking", "Remove dough; temper 1 h.", "Spread/stretch dough evenly.", "Apply pizza sauce evenly.", "Top evenly with cheese and desired toppings.", "Bake in a preheated oven until crust is blistered and golden.", "Finish with fresh basil after baking.",
    ],
    quality: ["Dough is elastic, smooth and shiny", "Light airy crumb with open cells", "Crisp, well blistered crust", "Proper fermentation (not over-proofed)", "Even bake and full rim color", "Proper portion and plating"],
    plating: ["Stretch dough evenly to desired size.", "Add sauce and toppings evenly.", "Bake on hot deck/stone for best results.", "Garnish with fresh basil after bake.", "Serve hot immediately.", "Serve hot for best taste and texture."],
    sections: `# @lead
Yield | 40–42 balls
Portion | 150 g each
Prep | 30 min
Cook | —
Total | 2 days CF
Diet / Allergens | VE • Gluten, Dairy
## Mise en place
Mixing bowls/mixer; trays; oil; plastic.
Equipment/Tools: Dough mixer, bench, scale.

# CCPs & QUALITY
## CCPs
Do not over-ferment biga; dough must be elastic/shiny.
## Quality markers / Fault → Fix
Light airy crumb; crisp exterior.

# PLATING & PORTIONING @bottom
Base toppings before bake; basil post-bake.

# HOLDING & STORAGE @bottom
CF 48 h; dough boxes covered.

# ALLERGEN DISCLOSURE @bottom
Contains:
Gluten, Dairy.

# SERVICE NOTES @bottom
Bake on pizza deck/stone; rotate for even char.`,
  },
];

/** "18 g" → 18 + "g"; anything printed differently ("75.00", "As required", "5%") is kept verbatim as the unit. */
function parseQty(text: string): { quantity: number | null; unit: string | null } {
  const m = text.match(/^(\d+(?:\.\d*[1-9])?)(?:\s+([a-zA-Z]+))?$/);
  if (m) return { quantity: Number(m[1]), unit: m[2] ?? null };
  return { quantity: null, unit: text };
}

function toIngredients(rows: Side["ingredients"]) {
  let group: string | null = null;
  const out = [];
  for (const row of rows) {
    if (row.length === 1) {
      group = row[0].replace(/^##\s*/, "");
      continue;
    }
    const [name, qtyText] = row;
    const { quantity, unit } = parseQty(qtyText);
    out.push({ position: out.length, groupLabel: group, quantity, unit, name, raw: `${name} ${qtyText}` });
  }
  return out;
}

function toSteps(lines: string[]) {
  const out: { phase: "COOK"; position: number; title: string | null; body: string }[] = [];
  let title: string | null = null;
  for (const line of lines) {
    if (line.startsWith("##")) title = line.replace(/^##\s*/, "");
    else {
      out.push({ phase: "COOK", position: out.length, title, body: line });
      title = null;
    }
  }
  return out;
}

async function main() {
  const brand = await db.brand.findUniqueOrThrow({ where: { slug: "aiko" } });
  const admin = await db.admin.findFirstOrThrow({ where: { role: "OWNER", isActive: true } });

  // Aiko's recipes use the Aiko card design from now on.
  await db.brand.update({ where: { id: brand.id }, data: { theme: { ...(brand.theme as object), sopTemplate: "aiko" } } });

  const category = await db.category.upsert({
    where: { brandId_slug: { brandId: brand.id, slug: "sides" } },
    create: { brandId: brand.id, slug: "sides", name: "SIDES", description: "Small plates designed for texture, balance and bold flavour.", sortOrder: 1 },
    update: { name: "SIDES", sortOrder: 1, description: "Small plates designed for texture, balance and bold flavour." },
  });

  for (const s of SIDES) {
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
      subtitle: s.subtitle ?? null,
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
      sopSections: s.sections ?? null,
      ingredients: toIngredients(s.ingredients),
      steps: toSteps(s.steps),
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
