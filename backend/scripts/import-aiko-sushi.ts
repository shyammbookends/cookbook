/**
 * Imports Aiko Kitchen's SUSHI SOPs (transcribed from rec d.pdf, one recipe per page)
 * into the Aiko brand's SUSHI category with their photos (cropped from the PDF into
 * backend/data/aiko-sushi). These use the Aiko Dim Sum / Sushi card design
 * (lib/sop/aiko-dimsum.ts); fields without a column of their own live in
 * customFields.dimsum. Safe to re-run: recipes are matched by externalId and replaced.
 *
 *   npx tsx --tsconfig tsconfig.json --conditions=react-server backend/scripts/import-aiko-sushi.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "@/server/db";
import { uploadImage } from "@/server/media/upload";
import { createRecipe } from "@/server/services/recipe";
import { RecipeInputSchema } from "@/lib/schemas/recipe";

const PHOTOS = path.resolve("backend/data/aiko-sushi");
const AUTHOR = "Bookend's Hospitality";
const APPROVED = "Husen Khan";

interface Roll {
  code: string;
  photo: string;
  slug: string;
  title: string;
  description: string;
  strip: { type?: string; dietary?: string; portion?: string; service?: string; allergens?: string };
  summary: [string, string][];
  headLine?: { qc?: string[]; portion?: string; service?: string };
  highlights: string[];
  qc: string[];
  serving: string[];
  /** "Name|Value" rows. */
  ingredients: string[];
  /** "N. TITLE::line" opens a titled method section; following lines belong to it. */
  steps: string[];
  split: number;
  guides: { title: string; icon: string; bullets: string[] }[];
  markers: string[];
  faults: [string, string][];
  mise: string[];
  holding: string[];
  service: string[];
  plating: string[];
  footer: string;
  extras?: Record<string, unknown>;
}

const SUSHI_STRIP = (allergens: string, dietary = "VEGETARIAN") => ({ type: "COLD", dietary, portion: "8 PCS", service: "COLD", allergens });
const SUMMARY = (type: string, allergens: string): [string, string][] => [
  ["Dish Type", type], ["Portion", "8 pcs"], ["Dietary", "Vegetarian"], ["Allergens", allergens], ["Service", "Cold"],
];
const RICE_STEP = ["1. PREPARE RICE::Cook sushi rice and season as per standard.", "Cool to room temperature."];
const ROLL_STEP = ["Place nori on bamboo mat, shiny side down.", "Spread a thin, even layer of rice leaving 1 inch at the top."];
const G_ROLL = { title: "ROLLING GUIDE", icon: "roll", bullets: ["Do not overfill.", "Keep roll tight.", "Seal properly.", "Use mat pressure evenly."] };
const G_ROLL2 = { title: "ROLLING GUIDE", icon: "roll", bullets: ["Do not overfill.", "Roll tight and even.", "Seal properly.", "Use mat pressure evenly."] };
const G_RICE = { title: "RICE GUIDE", icon: "rice", bullets: ["Use short grain sushi rice.", "Do not overcook.", "Season and cool properly.", "Keep covered to prevent drying."] };
const G_CUT = { title: "CUTTING GUIDE", icon: "knife", bullets: ["Use very sharp knife.", "Moisten knife if needed.", "Clean after every cut for clean edges."] };
const FAULTS5: [string, string][] = [
  ["Roll loose", "Roll tighter with even pressure."], ["Filling leaking", "Do not overfill; seal properly."], ["Rice too soft", "Cook rice to right texture."],
  ["Uneven cuts", "Use sharp knife; clean between cuts."], ["Sauce overpowering", "Use sauces in recommended quantity."],
];
const HOLD = ["Store rice covered at room temp. up to 4 hrs.", "Store cut vegetables in fridge up to 12 hrs.", "Sauces refrigerated.", "Do not freeze assembled rolls."];
const SVC = ["Serve immediately.", "Keep chilled until service.", "Maintain hygiene and temperature.", "Serve with ginger, wasabi and soy sauce."];
const FOOT_BEST = "Serve the best. Create experience.";
const FOOT_CARE = "Serve with care. Create experience.";

const ROLLS: Roll[] = [
  {
    code: "SU-001", photo: "photo-1-avocado-roll.jpg", slug: "avocado-roll", title: "Avocado Roll",
    description: "A refreshing vegetarian roll layered with creamy avocado, crisp cucumber and smooth cream cheese, finished with signature sauces for a perfect balance of flavour and texture.",
    strip: SUSHI_STRIP("DAIRY, SESAME."), summary: SUMMARY("Sushi Roll (Vegetarian)", "Dairy, Sesame, Soy"),
    highlights: ["Creamy and refreshing", "Balanced flavour and texture", "Perfect roll and clean cuts", "Finished with signature sauces", "Ideal for light and healthy dining"],
    qc: ["Rice temperature – room temp.", "Roll tight and even", "Avocado slices uniform", "Clean cuts, no rice spill", "Sauce balance and consistency"],
    serving: ["Serve immediately with ginger, soy sauce and wasabi on the side.", "Best enjoyed chilled."],
    ingredients: ["Sushi rice|130 g", "Nori|1.4 g (1 sheet)", "Black sesame|5 g", "White sesame|5 g", "Cream cheese|25 g", "Buffalo sauce|20 g", "Cucumber|30 g", "Avocado|180 g", "Rice paper|10 g", "Pickled ginger|5 g", "Soy sauce|20 g", "Wasabi|3 g"],
    steps: [
      ...RICE_STEP,
      "2. PREPARE INGREDIENTS::Slice avocado and cucumber into thin batons.", "Keep cream cheese ready.",
      "3. PREPARE ROLL::" + ROLL_STEP[0], ROLL_STEP[1],
      "4. ADD FILLING::Spread cream cheese in the centre.", "Add cucumber and avocado.",
      "5. ROLL::Lift the mat and roll tightly from the bottom.", "Seal the edge with a little water.",
      "6. COAT & FINISH::Brush roll with buffalo sauce.", "Coat with black and white sesame seeds.",
      "7. SLICE::Use a sharp knife.", "Cut into 8 equal pieces.", "Clean the knife after each cut.",
      "8. TOPPING::Top with thin avocado slices.", "Add crispy rice paper piece.",
    ],
    split: 5,
    guides: [G_ROLL, G_RICE, { title: "SAUCE GUIDE", icon: "bottle", bullets: ["Buffalo sauce – light brush.", "Balance sweetness, saltiness and spice."] }, G_CUT],
    markers: ["Rice layer even and firm.", "Roll tight, shape uniform.", "Avocado slices fresh and green.", "Sesame coating even.", "Clean cuts and neat presentation."],
    faults: [["Roll loose", "Roll tighter with even pressure."], ["Filling leaking", "Do not overfill; seal properly."], ["Rice too soft", "Cool rice to room temperature before rolling."], ["Uneven cuts", "Use sharp knife; clean between cuts."], ["Sauce overpowering", "Use sauces in recommended quantity."]],
    mise: ["Prepare and measure all ingredients.", "Cook and cool rice.", "Slice vegetables and avocado.", "Keep sauces and garnishes ready.", "Arrange tools: mat, knife, board."],
    holding: ["Store rice covered at room temp. up to 4 hrs.", "Store cut vegetables in fridge up to 12 hrs.", "Avocado sliced just before use.", "Do not freeze rolled sushi."],
    service: ["Serve immediately.", "Keep chilled until service.", "Maintain presentation.", "Serve with ginger, soy sauce and wasabi."],
    plating: ["Arrange 8 pcs neatly.", "Drizzle sauce evenly.", "Add rice paper crisp on top.", "Keep accompaniments on the side."],
    footer: FOOT_BEST,
  },
  {
    code: "SU-002", photo: "photo-2-dragon-roll.jpg", slug: "dragon-roll", title: "Dragon Roll",
    description: "A flavourful vegetarian sushi roll with crispy fried lotus stem, fresh vegetables and cream cheese, finished with spicy mayo and signature dragon sauce.",
    strip: SUSHI_STRIP("DAIRY SESAME"), summary: SUMMARY("Sushi Roll (Vegetarian)", "Dairy, Sesame, Soy"),
    highlights: ["Crispy fried lotus stem for crunch", "Fresh vegetables and cream cheese", "Balanced spicy and savoury notes", "Finished with signature sauces", "Neat, tight roll with clean slices"],
    qc: ["Rice temperature – room temp.", "Roll tight and even", "Fried lotus stem crisp", "Clean cuts, no rice spill", "Sauce balance and consistency"],
    serving: ["Serve immediately with sides.", "Best enjoyed chilled."],
    ingredients: ["Sushi rice|130 g", "Nori half sheet|1.4 g (1 sheet)", "Black sesame|4 g", "White sesame|4 g", "Cream cheese|25 g", "Red bell pepper|9 g", "Spring onion|8 g", "Fried stem lotus|25 g", "Spicy mayo|15 g", "Dragon sauce|4 g", "Pickled ginger|5 g", "Soy sauce|20 g", "Wasabi|3 g"],
    steps: [
      ...RICE_STEP,
      "2. PREPARE INGREDIENTS::Slice red bell pepper into thin strips.", "Trim and cut spring onion.", "Ensure fried lotus stem is crisp and ready.", "Keep cream cheese ready.",
      "3. PREPARE ROLL::" + ROLL_STEP[0], ROLL_STEP[1],
      "4. ADD FILLING::Spread cream cheese in the centre.", "Add red bell pepper, spring onion and fried lotus stem.",
      "5. ROLL::Lift the mat and roll tightly from the bottom.", "Seal the edge with a little water.",
      "6. SLICE::Use a sharp knife.", "Cut into 8 equal pieces.", "Clean the knife after each cut.",
      "7. FINISH::Drizzle spicy mayo on top.", "Spoon dragon sauce over mayo.", "Ensure even topping on all pieces.",
    ],
    split: 4,
    guides: [G_ROLL, G_RICE, { title: "SAUCE GUIDE", icon: "bottle", bullets: ["Spicy mayo – smooth drizzle.", "Dragon sauce – even spoon.", "Balance sweetness, saltiness and spice."] }, G_CUT],
    markers: ["Rice layer even and firm.", "Roll tight, shape uniform.", "Fillings fresh and well balanced.", "Topping even and appealing.", "Clean cuts and neat presentation."],
    faults: FAULTS5,
    mise: ["Prepare and measure all ingredients.", "Cook and cool rice.", "Slice vegetables.", "Keep sauces and garnishes ready.", "Arrange tools: mat, knife, board."],
    holding: ["Store rice covered at room temp. up to 4 hrs.", "Store cut vegetables in fridge up to 12 hrs.", "Do not freeze assembled rolls.", "Keep sauces refrigerated."],
    service: SVC,
    plating: ["Arrange rolls neatly.", "Drizzle sauces evenly.", "Garnish with ginger and wasabi.", "Serve on chilled plate."],
    footer: FOOT_BEST,
  },
  {
    code: "SU-003", photo: "photo-3-volcano-1.jpg", slug: "volcano-1", title: "Volcano 1",
    description: "A vibrant vegetarian sushi roll topped with creamy spicy mix, fresh mango and micro greens. A perfect balance of heat, sweetness and crunch in every bite.",
    strip: SUSHI_STRIP("DAIRY SESAME"), summary: SUMMARY("Sushi Roll (Vegetarian)", "Dairy, Sesame, Soy"),
    highlights: ["Fresh and premium ingredients", "Balanced flavour and texture", "Mango adds natural sweetness", "Spicy mayo for heat", "Finished with micro greens for freshness"],
    qc: ["Rice temperature – room temp.", "Roll tight and even", "Neat cuts with clean edges", "Toppings uniform on all pieces", "Sauce balance and consistency"],
    serving: ["Serve immediately with ginger, soy sauce and wasabi on the side.", "Best enjoyed chilled."],
    ingredients: ["Sushi rice|130 g", "Nori sheet|1.4 g (half sheet)", "Cream cheese|20 g", "Spring onion|6 g", "Carrot|15 g", "Red Bell pepper|30 g", "Cucumber|15 g", "Alfanso mango|100 g", "Spicy mayo|10 g", "Chilly crisps and oil|5 g", "Ginger pickled|5 g", "Soy sauce|20 g", "Wasabi paste|3 g", "Micro greens|2 g"],
    steps: [
      ...RICE_STEP,
      "2. PREPARE INGREDIENTS::Slice red bell pepper and cucumber into thin strips.", "Julienne carrot and spring onion.", "Dice mango into small cubes.", "Keep cream cheese ready.",
      "3. PREPARE ROLL::" + ROLL_STEP[0], ROLL_STEP[1],
      "4. ADD FILLING::Spread cream cheese in the centre.", "Add spring onion, carrot, red bell pepper, cucumber and mango.",
      "5. ROLL::Lift the mat and roll tightly from the bottom.", "Seal the edge with a little water.",
      "6. SLICE::Use a sharp knife.", "Cut into 8 equal pieces.", "Clean the knife after each cut.",
      "7. TOPPING::Add spicy mayo on top.", "Sprinkle chilly crisps and oil.", "Garnish with micro greens.",
    ],
    split: 4,
    guides: [G_ROLL, G_RICE, { title: "SAUCE GUIDE", icon: "bottle", bullets: ["Spicy mayo – smooth drizzle.", "Balance sweetness, saltiness and spice.", "Use in recommended quantity."] }, G_CUT],
    markers: ["Rice layer even and firm.", "Roll tight, shape uniform.", "Fillings fresh and well balanced.", "Toppings even and appealing.", "Clean cuts and neat presentation."],
    faults: FAULTS5,
    mise: ["Prepare and measure all ingredients.", "Cook and cool rice.", "Slice vegetables and mango.", "Keep sauces and garnishes ready.", "Arrange tools: mat, knife, board."],
    holding: ["Store rice covered at room temp. up to 4 hrs.", "Store cut vegetables in fridge up to 12 hrs.", "Do not freeze assembled rolls.", "Keep sauces refrigerated."],
    service: SVC,
    plating: ["Arrange 8 pcs neatly.", "Drizzle sauce evenly.", "Garnish with micro greens.", "Serve on chilled plate."],
    footer: FOOT_BEST,
  },
  {
    code: "SU-004", photo: "photo-4-gimbap-1.jpg", slug: "gimbap-1", title: "Gimbap 1",
    description: "A wholesome Korean rice roll packed with vibrant vegetables, seasoned tofu wrapped in seaweed and brushed with sesame oil for a rich aroma and delicate finish.",
    strip: SUSHI_STRIP("DAIRY, SESAME, SOY"), summary: SUMMARY("Korean Roll", "Dairy, Sesame, Soy"),
    highlights: ["Nutritious and balanced ingredients", "Colorful and appetizing presentation", "Umami rich from tofu", "Fresh crunch from vegetables", "Light sesame aroma with a beautiful finish"],
    qc: ["Rice at room temperature", "Uniform roll, tight and even", "Clean cuts with no smudging", "Ingredients evenly distributed", "Sesame oil brushed lightly and evenly"],
    serving: ["Serve immediately with pickled radish, soy sauce and wasabi on the side.", "Best enjoyed chilled."],
    ingredients: ["Nori sheets|4.20", "Sushi Rice|160.00", "Fried Tofu toss on soy|40.00", "Pickled radish|20.00", "Cucumber|25.00", "Carrot|25.00", "Sautéed spinach with soy & garlic|40.00", "Sesame oil (for brushing)|1.00"],
    steps: [
      "1. PREPARE RICE::Cook sushi rice and season as per standard.", "Allow rice to cool to room temperature.",
      "2. PREPARE INGREDIENTS::Slice cucumber, carrot and pickled radish into thin strips.", "Sauté spinach with soy sauce and garlic. Cool.", "Cut tofu into strips and toss with soy sauce.",
      "3. ASSEMBLE ROLL::Place nori sheet on bamboo mat, shiny side down.", "Spread an even layer of rice leaving 1 inch gap at the top.", "Arrange tofu, radish, cucumber, carrot and spinach horizontally.",
      "4. ROLL::Lift the mat and roll tightly from the bottom.", "Press gently to form a firm roll.", "Seal the edge with a little water.",
      "5. SLICE::Use a sharp knife.", "Cut into 8 equal pieces.", "Wipe blade after each cut.",
      "6. FINISH::Brush lightly with sesame oil.", "Sprinkle sesame seeds if required.",
    ],
    split: 3,
    guides: [
      G_RICE,
      { title: "FILLING GUIDE", icon: "filling", bullets: ["Cut all fillings into uniform thin strips.", "Sauté spinach and cool.", "Keep all ingredients ready before assembly."] },
      G_ROLL2,
      { title: "CUTTING GUIDE", icon: "knife", bullets: ["Use very sharp knife.", "Moisten knife if needed.", "Wipe after every cut for neat edges."] },
    ],
    markers: ["Rice layer even and firm.", "Roll tight, shape uniform.", "Fillings balanced and centered.", "Clean cuts and neat presentation."],
    faults: [["Rice too dry", "Cover and rest."], ["Roll loose", "Roll tighter with even pressure."], ["Filling leaking", "Do not overfill; seal properly."], ["Uneven cuts", "Use sharp knife; clean between cuts."], ["Lack of flavor", "Ensure seasoning in rice and fillings."]],
    mise: ["Prepare and measure all ingredients.", "Cook and season rice.", "Slice vegetables and prepare all fillings.", "Keep sauces and garnishes ready.", "Arrange tools: mat, knife, board."],
    holding: ["Store rice covered at room temp. up to 4 hrs.", "Store cut vegetables in fridge up to 12 hrs.", "Cooked fillings refrigerated up to 24 hrs.", "Do not freeze assembled rolls."],
    service: ["Serve immediately.", "Keep ingredients chilled.", "Maintain hygiene and clean work area.", "Serve with soy sauce, wasabi and pickled radish."],
    plating: ["Arrange 8 pcs neatly.", "Use garnishes on the side.", "Serve on chilled plate for best experience."],
    footer: FOOT_CARE,
  },
  {
    code: "SU-005", photo: "photo-5-bombay-blues-roll.jpg", slug: "bombay-blues-roll", title: "Bombay Blues Roll",
    description: "A bold and vibrant vegetarian sushi roll inspired by Indian flavours, packed with crunchy vegetables, creamy fillings and a spicy-sweet finishing touch.",
    strip: SUSHI_STRIP("DAIRY, SESAME, SOY"), summary: SUMMARY("Sushi Roll (Vegetarian)", "Dairy, Sesame, Soy"),
    headLine: { qc: ["Balanced sauces", "Neat roll", "Clean cuts"], portion: "Portion: 8 pcs", service: "Serve immediately with sides." },
    highlights: ["Bold Indian inspired flavours", "Balanced spicy, sweet and umami", "Crunchy vegetables for texture", "Creamy and satisfying fillings", "Neat presentation and cuts"],
    qc: ["Rice at room temperature", "Roll tight and even", "Neat cuts with clean edges", "Ingredients evenly distributed", "Sauces balanced and consistent"],
    serving: ["Serve immediately with ginger, soy sauce, wasabi and a side of sweet chilli sauce for extra kick."],
    ingredients: ["Sushi rice|130 g", "Nori|1.4 g", "Spring onion|3 g", "Cream cheese|25 g", "Carrot|10 g", "English cucumber|18 g", "Red capsicum|15 g", "Coriander|1 g", "Jalapeño|5 g", "Tempura flex|15 g", "Salsa|35 g", "Sweet chilli sauce|11 g", "Sriracha|8 g", "Soy sauce|20 g", "Pickled ginger|5 g", "Wasabi|2 g"],
    steps: [
      "1. PREPARE RICE::Cook sushi rice and season as per standard.", "Allow rice to cool to room temperature.",
      "2. PREPARE INGREDIENTS::Finely slice spring onion, carrot, cucumber, red capsicum and jalapeño.", "Chop coriander.", "Keep cream cheese ready.",
      "3. ASSEMBLE ROLL::Place nori on bamboo mat, shiny side down.", "Spread an even layer of rice leaving 1 inch gap at the top.",
      "4. ADD FILLINGS::In the center add cream cheese, spring onion, carrot, cucumber, red capsicum, jalapeño and coriander.",
      "5. ROLL::Lift the mat and roll tightly from the bottom.", "Press gently to form a firm roll.", "Seal the edge with a little water.",
      "6. SLICE::Use a sharp knife.", "Cut into 8 equal pieces.", "Clean the knife after each cut.",
      "7. TOPPINGS::Top each piece with salsa and tempura flex.", "Drizzle sweet chilli sauce and sriracha.",
      "8. FINISH::Serve with soy sauce, pickled ginger and wasabi.",
    ],
    split: 5,
    guides: [
      G_RICE,
      { title: "FILLING GUIDE", icon: "filling", bullets: ["Cut all veggies into thin uniform strips.", "Keep jalapeño quantity as per spice preference.", "Keep ingredients ready before assembly."] },
      G_ROLL2,
      { title: "CUTTING GUIDE", icon: "knife", bullets: ["Use very sharp knife.", "Moisten knife if needed.", "Clean after every cut for neat edges."] },
    ],
    markers: ["Rice layer even and firm.", "Roll tight, shape uniform.", "Fillings balanced and centered.", "Toppings even and appealing.", "Clean cuts and neat presentation."],
    faults: [["Rice too dry", "Sprinkle water and mix."], ["Roll loose", "Roll tighter with even pressure."], ["Filling leaking", "Do not overfill; seal properly."], ["Uneven cuts", "Use sharp knife; clean between cuts."], ["Sauce overpowering", "Use sauces in recommended quantity."]],
    mise: ["Prepare and measure all ingredients.", "Cook and season rice.", "Slice vegetables and herbs.", "Keep sauces and garnishes ready.", "Arrange tools: mat, knife, board."],
    holding: ["Store rice covered at room temp. up to 4 hrs.", "Store cut vegetables in fridge up to 12 hrs.", "Sauces refrigerated.", "Do not freeze assembled rolls."],
    service: ["Serve immediately.", "Keep ingredients chilled.", "Maintain hygiene and temperature.", "Serve with ginger, wasabi and soy sauce."],
    plating: ["Arrange 8 pcs neatly.", "Use a clean platter.", "Garnish with micro greens or spring onion.", "Serve chilled."],
    footer: FOOT_CARE,
  },
  {
    code: "SU-006", photo: "photo-6-jalapeno-popper-roll.jpg", slug: "jalapeno-popper-roll", title: "Jalapeño Popper Roll",
    description: "A spicy and indulgent vegetarian roll featuring jalapeño and cream cheese filling, coated in crunchy crumbs and flash-fried to golden perfection.",
    strip: SUSHI_STRIP("GLUTEN, DAIRY, SESAME"), summary: SUMMARY("Sushi Roll (Vegetarian)", "Gluten, Dairy, Sesame"),
    headLine: { service: "Serve immediately after slicing." },
    highlights: ["Spicy jalapeño with creamy cheese filling", "Crispy crumb coating for texture", "Flash-fried for perfect crunch", "Balanced heat with umami finish", "Neat presentation and clean cuts"],
    qc: ["Rice at room temperature", "Roll tight and even", "Crumb coating uniform", "Oil temperature maintained", "Sauce balance with mild heat"],
    serving: ["Serve immediately after slicing with ginger, soy sauce, wasabi and a side of sweet chilli sauce."],
    ingredients: ["Sushi rice|130 g", "Nori|1.4 g", "Jalapeño|20 g", "Cream cheese|25 g", "Black sesame|4 g", "Bread crumbs|6 g", "Sriracha|8 g", "Coriander|3 g", "Spring onion|6 g", "Fried spring roll|15 g", "Soy sauce|20 g", "Pickled ginger|5 g", "Wasabi|2 g"],
    steps: [
      "1. PREPARE RICE::Cook sushi rice and season as per standard.", "Allow rice to cool to room temperature.",
      "2. PREPARE INGREDIENTS::Slice jalapeño into thin rings.", "Finely chop coriander and spring onion.", "Keep cream cheese ready.",
      "3. ASSEMBLE ROLL::Place nori on bamboo mat, shiny side down.", "Spread an even layer of rice leaving 1 inch gap at the top.", "In the center add cream cheese, jalapeño, spring onion and coriander.",
      "4. ROLL::Lift the mat and roll tightly from the bottom.", "Press gently to form a firm roll.", "Seal the edge with a little water.", "Roll in fried spring roll for extra crunch.",
      "5. COAT & FRY::Spread a thin layer of cream cheese.", "Coat the roll evenly with bread crumbs.", "Heat oil to 180°C and flash fry until golden and crisp.", "Drain on paper towel.",
      "6. FINISH::Drizzle sriracha on top.", "Garnish with coriander and sesame seeds.",
      "7. SLICE::Slice 8 equal pieces using a sharp knife.", "Clean the knife after each cut.",
    ],
    split: 3,
    guides: [
      G_RICE,
      { title: "FILLING GUIDE", icon: "filling", bullets: ["Adjust jalapeño quantity for spice preference.", "Ensure cream cheese is soft and spreadable.", "Keep ingredients ready before assembly."] },
      G_ROLL2,
      { title: "FRYING GUIDE", icon: "fry", bullets: ["Oil temperature 180°C.", "Flash fry only.", "Do not overcrowd.", "Drain well to retain crispiness."] },
    ],
    markers: ["Crisp exterior and golden colour.", "Creamy and spicy centre.", "Roll tight and shape uniform.", "Sauces balanced and well distributed.", "Clean cuts and neat presentation."],
    faults: [["Roll loose", "Roll tighter with even pressure."], ["Filling oozing", "Use less cream cheese and seal well."], ["Oil absorption high", "Maintain oil temperature."], ["Soggy coating", "Flash fry and drain immediately."], ["Uneven slices", "Use sharp knife and clean between cuts."]],
    mise: ["Measure and prepare all ingredients.", "Cook and season rice.", "Slice vegetables and herbs.", "Keep sauces and garnishes ready.", "Arrange tools: mat, knife, board, fryer, tongs."],
    holding: HOLD,
    service: ["Serve immediately after slicing.", "Keep ingredients chilled.", "Maintain hygiene and temperature."],
    plating: ["Place pieces neatly.", "Garnish with micro greens and sesame.", "Serve with sides.", "Keep presentation clean."],
    footer: FOOT_CARE,
  },
  {
    code: "SU-007", photo: "photo-7-corn-tempura-roll.jpg", slug: "corn-tempura-roll", title: "Corn Tempura Roll",
    description: "A delightful vegetarian roll featuring sweet corn tempura with creamy fillings and crisp vegetables, finished with spicy sriracha for a perfect balance of flavour and texture.",
    strip: SUSHI_STRIP("GLUTEN, DAIRY, SOY"), summary: SUMMARY("Sushi Roll (Vegetarian)", "Gluten, Dairy, Soy"),
    headLine: { qc: ["Crisp corn", "No soggy centre", "Neat slices"], portion: "Portion: 8 pcs", service: "Serve immediately with sides." },
    highlights: ["Sweet corn tempura for crunch", "Creamy and fresh vegetable fillings", "Balanced with spicy sriracha", "Crisp exterior, clean slices", "Perfect with wasabi & ginger"],
    qc: ["Rice at room temperature", "Roll tight and even", "Corn tempura crisp", "No soggy centre", "Sauce balance with mild heat"],
    serving: ["Serve immediately with pickled ginger, wasabi, soy sauce and a side of sweet chilli sauce."],
    ingredients: ["Sushi rice|130 g", "Nori|2.8 g", "Purple cabbage|25 g", "Cream cheese|50 g", "Spring onion|15 g", "American corn|40 g", "Tempura flour|50 g", "Soy sauce|30 g", "Pickled ginger|20 g", "Wasabi|2 g", "Sriracha|10 g"],
    steps: [
      "1. PREPARE RICE::Cook sushi rice and season as per standard.", "Allow rice to cool to room temperature.",
      "2. PREPARE FILLINGS::Drain corn well.", "Batter corn with tempura flour and deep fry until golden and crisp.", "Slice purple cabbage into thin julienne strips.", "Finely chop spring onion.", "Keep cream cheese ready.",
      "3. ASSEMBLE ROLL::Place nori on bamboo mat, shiny side down.", "Spread an even layer of rice leaving 1 inch gap at the top.", "In the center add cream cheese, purple cabbage, spring onion and corn tempura.", "Roll tightly using mat, applying even pressure.",
      "4. SLICE::Moisten knife and slice into 8 equal pieces.", "Clean knife after each cut.",
      "5. FINISH::Drizzle sriracha on top.", "Serve with pickled ginger, wasabi and soy sauce.",
    ],
    split: 2,
    guides: [
      G_RICE,
      { title: "TEMPURA CORN GUIDE", icon: "corn", bullets: ["Drain corn thoroughly.", "Coat lightly in batter.", "Oil temperature 180°C.", "Fry until golden and crisp.", "Drain on paper towel."] },
      G_ROLL2,
      { title: "SAUCE GUIDE", icon: "bottle", bullets: ["Sriracha on top.", "Soy sauce for dipping.", "Sweet chilli sauce as side option."] },
    ],
    markers: ["Corn tempura crisp and golden.", "Centre creamy, not soggy.", "Roll tight with uniform slices.", "Sauces balanced.", "Clean cuts and neat presentation."],
    faults: [["Soggy centre", "Drain corn well and avoid overfilling."], ["Loose roll", "Roll tighter with even pressure."], ["Batter soggy", "Maintain oil temperature at 180°C."], ["Uneven slices", "Use sharp knife and clean between cuts."], ["Too spicy", "Reduce sriracha quantity."]],
    mise: ["Measure and prepare all ingredients.", "Cook and season rice.", "Slice vegetables and chop herbs.", "Prepare tempura batter.", "Keep sauces and garnishes ready.", "Arrange tools: mat, knife, board, fryer, tongs."],
    holding: HOLD,
    service: ["Serve immediately after slicing.", "Keep ingredients chilled.", "Maintain hygiene and temperature."],
    plating: ["Place pieces neatly.", "Garnish with ginger, wasabi and micro greens.", "Serve with sides.", "Keep presentation clean."],
    footer: FOOT_CARE,
  },
  {
    code: "SU-008", photo: "photo-8-avo-crispy-rice.jpg", slug: "avo-crispy-rice", title: "Avo Crispy Rice",
    description: "Crispy sesame rice topped with creamy avocado, zesty wasabi mayo and marinated beetroot chunks, finished with bagel seasoning and spring onion for a fresh, flavour-packed bite.",
    strip: {}, summary: [["Dish Type", "Crispy Rice (Vegetarian)"], ["Portion", "8 pcs"], ["Dietary", "Vegetarian"], ["Allergens", "Gluten, Soy"], ["Service", "Cold"]],
    headLine: { qc: ["Crisp exterior", "Creamy centre", "Balanced flavour"], portion: "Portion: 8 pcs", service: "Serve immediately with sides." },
    highlights: ["Crispy sesame sushi rice base", "Creamy avocado and wasabi mayo", "Vibrant marinated beetroot topping", "Finished with bagel seasoning and spring onion", "Perfect balance of texture and flavour"],
    qc: ["Rice crispy and golden", "Topping chilled and fresh", "No soggy centre", "Bagel seasoning evenly distributed", "Neat and consistent portion"],
    serving: ["Serve immediately with pickled ginger, soy sauce and a side of wasabi."],
    ingredients: ["Sesame sushi rice|156 g", "Ponzu wasabi mayo|2 g", "Gochujang mayo|4 g", "Avo guac|20 g", "Marinated beetroot chunks|68 g", "Bagel seasoning|5 g", "White spring onion|18 g"],
    steps: [
      "1. PREPARE RICE::Take 156 g seasoned sesame sushi rice.", "Press gently into desired shape (round or oval).", "Ensure rice is compact and even.",
      "2. CRISP THE RICE::Pan fry or deep fry the rice base until golden and crispy on all sides.", "Drain excess oil and cool slightly.",
      "3. TOPPING::Spread 2 g ponzu wasabi mayo and 4 g gochujang mayo.", "Add 20 g avo guac.", "Top with 68 g marinated beetroot chunks.",
      "4. FINISH::Sprinkle 5 g bagel seasoning.", "Garnish with 18 g white spring onion.", "Serve immediately.",
    ],
    split: 0,
    guides: [
      G_RICE,
      { title: "CRISPING GUIDE", icon: "pan", bullets: ["Pan fry on medium heat with light oil until golden.", "Or deep fry at 180°C until crispy.", "Drain on paper towel."] },
      { title: "TOPPING GUIDE", icon: "topping", bullets: ["Keep all toppings chilled.", "Layer in given order for best balance.", "Do not overload."] },
      { title: "SAUCE GUIDE", icon: "bottle", bullets: ["Ponzu wasabi mayo for tang and heat.", "Gochujang mayo for sweet-spicy balance."] },
      { title: "STORAGE GUIDE", icon: "fridge", bullets: ["Store rice covered at room temp. up to 4 hrs.", "Toppings in fridge up to 24 hrs.", "Do not freeze assembled rice bites."] },
    ],
    markers: ["Crisp outside, soft inside.", "Flavours balanced and fresh.", "Toppings evenly distributed.", "Clean cuts and neat presentation."],
    faults: [["Rice too soft", "Crisp longer."], ["Soggy base", "Ensure rice is cooled and pressed well."], ["Topping falling off", "Do not overload; layer evenly."], ["Too spicy", "Reduce gochujang mayo."]],
    mise: ["Prepare sushi rice.", "Make sauces and keep chilled.", "Prep avocado guac and beetroot.", "Slice spring onion.", "Measure bagel seasoning."],
    holding: [],
    service: [],
    plating: [],
    footer: FOOT_BEST,
    extras: {
      stripLabels: false, ingHeading: "INGREDIENTS (PER ROLL - 8 PCS)", ingHeaders: { "": ["Ingredients", "Qty / Gram"] }, methodWide: true, compHeading: "COMPONENTS & PREPARATION",
      compTables: [
        { title: "SESAME SUSHI RICE", yield: "YIELD: ~1025 g", rows: [["Sushi Rice", "1000"], ["White sesame", "25"]], total: ["Total", "1025"], bullets: ["Cook sushi rice and season as per standard.", "Allow to cool to room temperature."] },
        { title: "PONZU WASABI MAYO", yield: "YIELD: ~102 g", rows: [["Ponzu mayo", "100"], ["Wasabi", "2"]], total: ["Total", "102"], bullets: ["Mix ponzu mayo and wasabi until smooth.", "Keep chilled."] },
        { title: "MARINATED BEETROOT CHUNKS", yield: "YIELD: ~68 g", rows: [["Beetroot", "40"], ["Hot sauce", "5"], ["Salt", "2"], ["Black Pepper", "1"], ["Plain mayo", "20"]], total: ["Total", "68"], bullets: ["Cut beetroot into small chunks.", "Toss with hot sauce, salt, black pepper and mayo.", "Keep chilled."] },
      ],
    },
  },
];

/** "18 g" → 18 + "g"; anything printed differently ("4.20", "1.4 g (1 sheet)") is kept as printed in the unit. */
function parseQty(text: string): { quantity: number | null; unit: string | null } {
  const m = text.match(/^(\d+(?:\.\d*[1-9])?)(?:\s+(\S.*))?$/);
  if (m) return { quantity: Number(m[1]), unit: m[2] ?? null };
  return { quantity: null, unit: text };
}

async function main() {
  const brand = await db.brand.findUniqueOrThrow({ where: { slug: "aiko" } });
  const admin = await db.admin.findFirstOrThrow({ where: { role: "OWNER", isActive: true } });
  const category = await db.category.findUniqueOrThrow({ where: { brandId_slug: { brandId: brand.id, slug: "sushi" } } });

  for (const s of ROLLS) {
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
      return { position, groupLabel: null, quantity, unit, name, raw: `${name} ${value}` };
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
      qualityCheck: s.qc,
      miseEnPlace: s.mise,
      holding: s.holding.join("\n"),
      plating: s.plating.join("\n"),
      customFields: {
        dimsum: {
          strip: s.strip,
          summary: s.summary,
          highlights: s.highlights,
          serving: s.serving,
          serviceNotes: s.service,
          headLine: s.headLine,
          guides: s.guides,
          guidesLayout: "row",
          iconGuides: true,
          qcIcons: true,
          lowIcons: true,
          qcMarkers: s.markers,
          faults: s.faults,
          methodStyle: "sections-bullets",
          methodSplit: s.split || undefined,
          ingHeading: "INGREDIENTS (PER ROLL)",
          ingHeaders: { "": ["Ingredients", "Qty / Gram"] },
          footer: s.footer,
          ...s.extras,
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
