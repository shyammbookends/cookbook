/**
 * Adds the Capiche PIZZA SOP recipes (from "rec 5.pdf", 21 pages = 21 recipes) with their photos.
 * One recipe per PDF page; photos are cropped from each page into backend/data/capiche-pizza/photo-NN.jpg.
 * Idempotent: recipes are matched on (brand, externalId = dish code) and updated in place.
 *
 * Run: npx tsx --conditions=react-server --tsconfig tsconfig.json backend/scripts/seed_capiche_pizza.ts
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/server/db";
import { uploadImage } from "@/server/media/upload";
import { RecipeInputSchema } from "@/lib/schemas/recipe";
import { Prisma } from "@/generated/prisma/client";

const IMAGE_DIR = path.join(process.cwd(), "backend/data/capiche-pizza");

type Ing = [name: string, quantity: number | null, unit: string];
type Size = { label: string; items: Ing[] };

interface Pizza {
  page: number; // PDF page = photo number
  dishCode: string;
  title: string;
  description: string;
  summary: string | null;
  author?: string;
  approvedBy?: string;
  version?: string;
  effective?: string;
  nextReview?: string;
  station?: string;
  yieldText?: string;
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  timeText?: { prep?: string; cook?: string; total?: string };
  dietary: string[];
  miseEnPlace: string[];
  equipment: string[];
  sizes: Size[];
  steps: string[];
  qualityCheck?: string[];
  plating: string;
  holding: string;
  allergens: string;
  notes?: string | null;
  sopSections?: string | null;
}

// ---------- shared wording ----------

const L11 = '11" PIZZA (1 PORTION)';
const L15 = '15" PIZZA (1 PORTION)';

const MISE = [
  'Pre-portioned dough balls: 11" 180 g; 15" 320 g',
  "Rice flour (~10 g) for dusting; EVOO on hand",
  "Sauces & toppings pre-weighed",
];
const EQUIP = [
  "Deck/stone oven (preheat 350 °C • 30 min)",
  "Pizza peels",
  "Ladle",
  "Bench scraper",
  "Digital scale",
  "Timer",
  "Pizza wheel",
];

const S_PREP = "Prepare dough: Remove dough ball. Lightly dust bench and dough with ~10 g rice flour.";
const S_SHAPE = 'Shape: Press centre to expel large bubbles; keep 12 mm rim. Hand-stretch to 11" or 15".';
const S_SAUCE = "Sauce: Spread as per ingredients; leave 12 mm border.";
const S_CHEESE = "Cheese & toppings: Add per size/weights.";
const S_BAKE = "Bake: Deck at 350 °C for ~6:00; rotate at 3:00. Rim golden; cheese melted; base dry & crisp.";
const S_BAKE2 = "Bake: Deck at 350 °C ~6:00; rotate at 3:00. Rim golden; cheese melted; base dry & crisp.";
const S_FINISH = 'Finish & serve: Slice 6 (11") / 8 (15"). Serve immediately.';
const STD = [S_PREP, S_SHAPE, S_SAUCE, S_CHEESE, S_BAKE, S_FINISH];

const HOLD = "Serve within 3 min of bake • Build-to-order only • No reheat.";
const PLATE = "Pizza board/plate • Serve hot (no hot-holding).";
const ALG = "Contains: Gluten (wheat), Milk.\nCross-contact possible with nuts, sesame.";
const V = ["Vegetarian"];

const TIMES_STD = { prepMinutes: 4, cookMinutes: 6, totalMinutes: 10 };
const TT = { prep: "3–4 min", cook: "~6 min", total: "9–10 min" };

const PIZZAS: Pizza[] = [
  {
    page: 1, dishCode: "PZ-01", title: "Margherita",
    description: "A classic Neapolitan pizza with rich tomato sauce, fresh mozzarella and basil, finished with extra virgin olive oil.",
    summary: "Simple, fresh and full of flavour. A timeless classic.",
    ...TIMES_STD, timeText: { ...TT, total: "~9–10 min" }, dietary: V,
    miseEnPlace: ["Pre-portioned dough balls", "Rice flour (~10 g) for dusting", "Sauce & toppings pre-weighed", "EVOO on hand"],
    equipment: ["Deck / stone oven (preheat 350 °C)", "Pizza peels", "Ladle", "Bench scraper", "Digital scale", "Timer", "Pizza wheel"],
    sizes: [
      { label: L11, items: [["Pizza dough", 180, "g"], ["Pomodoro sauce", 80, "g"], ["Mozzarella (grated)", 70, "g"], ["Buffalo mozzarella", 15, "g"], ["Basil", 5, "g"], ["Parmesan", 10, "g"], ["Olive oil", 5, "ml"]] },
      { label: L15, items: [["Pizza dough", 320, "g"], ["Pomodoro sauce", 150, "g"], ["Mozzarella (grated)", 120, "g"], ["Buffalo mozzarella", 25, "g"], ["Basil", 5, "g"], ["Parmesan", 15, "g"], ["Olive oil", 10, "ml"]] },
    ],
    steps: [...STD, "Finish with fresh basil and EVOO."],
    plating: "Pizza board / plate. Serve hot (no holding).",
    holding: "Serve within 3 min of bake.\nBuild-to-order only. No reheat.",
    allergens: ALG,
  },
  {
    page: 2, dishCode: "PZ-02", title: "Peperone",
    description: "A flavour-packed pizza with sweet bell peppers, spicy green chillies, red onion and olives on a classic tomato and mozzarella base.",
    summary: "Bold, vibrant and perfectly balanced with a hint of spice.",
    ...TIMES_STD, timeText: { ...TT, total: "~9–10 min" }, dietary: V,
    miseEnPlace: ["Pre-portioned dough balls", "Rice flour (~10 g) for dusting", "Sauces & toppings pre-weighed", "EVOO on hand"],
    equipment: ["Deck / stone oven (preheat 350 °C)", "Pizza peels", "Ladle", "Bench scraper", "Digital scale", "Timer", "Pizza wheel"],
    sizes: [
      { label: L11, items: [["Pizza dough", 180, "g"], ["Pomodoro sauce", 80, "g"], ["Mozzarella (grated)", 70, "g"], ["Bell pepper", 50, "g"], ["Green chilli", 8, "g"], ["Onion", 35, "g"], ["Black olives", 20, "g"]] },
      { label: L15, items: [["Pizza dough", 320, "g"], ["Pomodoro sauce", 150, "g"], ["Mozzarella (grated)", 120, "g"], ["Bell pepper", 70, "g"], ["Green chilli", 10, "g"], ["Onion", 50, "g"], ["Black olives", 30, "g"]] },
    ],
    steps: [S_PREP, S_SHAPE, S_SAUCE, S_CHEESE, S_BAKE, S_FINISH],
    plating: PLATE,
    holding: "Serve within 3 min of bake.\nBuild-to-order only • No reheat.",
    allergens: ALG,
  },
  {
    page: 3, dishCode: "PZ-03", title: "Sid's Pizza",
    description: "A bold, spicy pizza layered with jalapeños, rich tomato sauce, melted mozzarella and buffalo cheese, finished with fresh arugula and creamy ricotta for balance.",
    summary: "Bold, spicy and perfectly balanced with creamy ricotta and fresh arugula.",
    prepMinutes: 4, cookMinutes: 6, totalMinutes: 10, timeText: { prep: "3–4 min", cook: "~6 min", total: "9–10 min" }, dietary: V,
    miseEnPlace: MISE, equipment: EQUIP,
    sizes: [
      { label: L11, items: [["Pizza dough", 180, "g"], ["Pomodoro", 80, "g"], ["Mozzarella grated", 70, "g"], ["Buffalo mozzarella", 15, "g"], ["Fresh jalapeño", 30, "g"], ["Marinated arugula (post-bake)", 10, "g"], ["Ricotta (post-bake)", 80, "g"]] },
      { label: L15, items: [["Pizza dough", 320, "g"], ["Pomodoro", 150, "g"], ["Mozzarella grated", 120, "g"], ["Buffalo mozzarella", 25, "g"], ["Fresh jalapeño", 50, "g"], ["Marinated arugula (post-bake)", 20, "g"], ["Ricotta (post-bake)", 110, "g"]] },
    ],
    steps: [
      "Shape dough; dust peel.",
      "Spread pomodoro; leave 12 mm rim.",
      "Add mozzarella and buffalo.",
      "Add jalapeño.",
      "Bake ~6 min; rotate once.",
      "Post-bake: arugula (optional); ricotta. Slice & serve.",
    ],
    plating: "Pizza board • 6 slices (11”) / 8 slices (15”).",
    holding: "Bake to order • Pass ≤ 5 min • No reheat.",
    allergens: "Contains: Gluten, Milk.\nCross-contact possible with nuts, sesame.",
  },
  {
    page: 4, dishCode: "PZ-04", title: "Ortolana",
    description: "A vibrant vegetable pizza with broccoli, capsicum, olives, and jalapeños on a rich tomato base, finished with fresh arugula and sliced almonds for texture.",
    summary: "Fresh, colourful and wholesome with a perfect balance of crunch and spice.",
    ...TIMES_STD, timeText: TT, dietary: V, miseEnPlace: MISE, equipment: EQUIP,
    sizes: [
      { label: L11, items: [["Pizza dough", 180, "g"], ["Pomodoro", 80, "g"], ["Mozzarella grated", 70, "g"], ["Jalapeño", 20, "g"], ["Black olive", 25, "g"], ["Broccoli", 50, "g"], ["Green bell pepper", 70, "g"], ["Marinated arugula (post-bake)", 15, "g"], ["Sliced almonds (garnish)", 5, "g"]] },
      { label: L15, items: [["Pizza dough", 320, "g"], ["Pomodoro", 150, "g"], ["Mozzarella grated", 120, "g"], ["Jalapeño", 30, "g"], ["Black olive", 40, "g"], ["Broccoli", 80, "g"], ["Green bell pepper", 100, "g"], ["Marinated arugula (post-bake)", 20, "g"], ["Sliced almonds (garnish)", 8, "g"]] },
    ],
    steps: [
      S_PREP, S_SHAPE, S_SAUCE, S_CHEESE, S_BAKE,
      'Finish & serve: Slice 6 (11") / 8 (15"). Top with marinated arugula and sliced almonds after baking. Serve immediately.',
    ],
    plating: "Pizza board/plate • 6 slices (11”) / 8 slices (15”).",
    holding: HOLD,
    allergens: "Contains: Gluten (wheat), Nuts, Milk.\nCross-contact possible with nuts, sesame.",
    notes: "Tip: For extra flavour, toss arugula lightly in EVOO before serving.",
  },
  {
    page: 5, dishCode: "PZ-05", title: "Third Wave",
    description: "A bold, spicy pizza with tender broccoli, roasted garlic, jalapeños and red paprika, finished with melted mozzarella and a crispy chilli topping for extra heat.",
    summary: "Spicy, vibrant and full of flavour with the perfect balance of heat and crunch.",
    ...TIMES_STD, timeText: TT, dietary: V, miseEnPlace: MISE, equipment: EQUIP,
    sizes: [
      { label: L11, items: [["Pizza dough", 180, "g"], ["Pomodoro", 80, "g"], ["Mozzarella grated", 70, "g"], ["Boiled broccoli", 30, "g"], ["Peeled garlic", 15, "g"], ["Red paprika", 10, "g"], ["Jalapeños", 20, "g"], ["Chilli crisp (finish)", 15, "g"]] },
      { label: L15, items: [["Pizza dough", 320, "g"], ["Pomodoro", 150, "g"], ["Mozzarella grated", 120, "g"], ["Boiled broccoli", 50, "g"], ["Peeled garlic", 25, "g"], ["Red paprika", 20, "g"], ["Jalapeños", 30, "g"], ["Chilli crisp (finish)", 25, "g"]] },
    ],
    steps: [...STD, "Finish with chilli crisp on each slice."],
    plating: PLATE, holding: HOLD, allergens: ALG,
  },
  {
    page: 6, dishCode: "PZ-06", title: "Garlic Pie",
    description: "A flavour-packed pizza loaded with roasted garlic, chopped garlic and green garlic on a rich tomato base with melted cheese, finished with a fresh green garlic garnish.",
    summary: "Bold garlic flavours with a perfect balance of richness, crisp edges and fresh green garlic.",
    ...TIMES_STD, timeText: TT, dietary: V, miseEnPlace: MISE, equipment: EQUIP,
    sizes: [
      { label: L11, items: [["Pizza dough", 180, "g"], ["Pomodoro", 80, "g"], ["Mozzarella grated", 70, "g"], ["Buffalo mozzarella", 15, "g"], ["Sliced garlic", 40, "g"], ["Chopped garlic", 15, "g"], ["Green garlic (garnish)", 10, "g"]] },
      { label: L15, items: [["Pizza dough", 320, "g"], ["Pomodoro", 150, "g"], ["Mozzarella grated", 120, "g"], ["Buffalo mozzarella", 25, "g"], ["Sliced garlic", 50, "g"], ["Chopped garlic", 20, "g"], ["Green garlic (garnish)", 20, "g"]] },
    ],
    steps: [...STD, "Garnish with green garlic."],
    plating: PLATE, holding: HOLD, allergens: ALG,
  },
  {
    page: 7, dishCode: "PZ-07", title: "Truffle",
    description: "A decadent pizza with aromatic truffle oil and truffle paste, layered with melted cheese on a rich tomato base for an indulgent and luxurious flavour.",
    summary: "Rich, earthy and indulgent with the perfect balance of aroma, cheese and crispy crust.",
    ...TIMES_STD, timeText: TT, dietary: V, miseEnPlace: MISE, equipment: EQUIP,
    sizes: [
      { label: L11, items: [["Pizza dough", 180, "g"], ["Pomodoro", 80, "g"], ["Mozzarella grated", 70, "g"], ["Buffalo mozzarella", 15, "g"], ["Truffle paste (post-bake)", 3, "g"], ["Truffle oil (post-bake)", 3, "ml"]] },
      { label: L15, items: [["Pizza dough", 320, "g"], ["Pomodoro", 150, "g"], ["Mozzarella grated", 120, "g"], ["Buffalo mozzarella", 25, "g"], ["Truffle paste (post-bake)", 5, "g"], ["Truffle oil (post-bake)", 5, "ml"]] },
    ],
    steps: [...STD, "Drizzle truffle oil and dot with truffle paste; serve immediately."],
    plating: PLATE, holding: HOLD, allergens: ALG,
  },
  {
    page: 8, dishCode: "PZ-08", title: "Rubirosa",
    description: "A bold and flavour-packed pizza with creamy tomato, rich buffalo mozzarella and sweet pomodoro, finished with vibrant pesto and hot sriracha for the perfect kick.",
    summary: "Creamy, spicy and vibrant, finished with pesto and sriracha for the perfect balance.",
    ...TIMES_STD, timeText: TT, dietary: V, miseEnPlace: MISE, equipment: EQUIP,
    sizes: [
      { label: L11, items: [["Pizza dough", 180, "g"], ["Tomato cream (spicy pomodoro)", 60, "g"], ["Buffalo mozzarella", 50, "g"], ["Pomodoro (dollops)", 30, "g"], ["Pesto (post-bake)", 15, "g"], ["Sriracha (swirl post-bake)", 15, "g"]] },
      { label: L15, items: [["Pizza dough", 320, "g"], ["Tomato cream (spicy pomodoro)", 130, "g"], ["Buffalo mozzarella", 80, "g"], ["Pomodoro (dollops)", 50, "g"], ["Pesto (post-bake)", 25, "g"], ["Sriracha (swirl post-bake)", 5, "g"]] },
    ],
    steps: [
      "Prepare dough; dust peel.",
      "Spread tomato cream as base; leave 12 mm rim.",
      "Add buffalo mozzarella; dollop pomodoro sparingly.",
      "Bake: Deck at 350 °C for ~6:00; rotate at 3:00.",
      "Finish & serve: Slice.",
      "Swirl pesto + sriracha post-bake.",
    ],
    plating: PLATE, holding: HOLD,
    allergens: "Contains: Gluten (wheat), Milk,\nTree nuts (pesto).",
  },
  {
    page: 9, dishCode: "PZ-09", title: "Triple Sauce",
    description: "A bold and vibrant pizza layered with creamy tomato, rich pesto and classic tomato sauce, finished with melted mozzarella and grated parmesan.",
    summary: "Three delicious sauces come together for a perfect harmony of flavours in every bite.",
    ...TIMES_STD, timeText: TT, dietary: V, miseEnPlace: MISE, equipment: EQUIP,
    sizes: [
      { label: L11, items: [["Pizza dough", 180, "g"], ["Mozzarella grated", 70, "g"], ["Pomodoro", 40, "g"], ["Tomato cream", 20, "g"], ["Pesto", 20, "g"], ["Parmesan", 10, "g (garnish)"]] },
      { label: L15, items: [["Pizza dough", 320, "g"], ["Mozzarella grated", 120, "g"], ["Pomodoro", 80, "g"], ["Tomato cream", 40, "g"], ["Pesto", 40, "g"], ["Parmesan", 15, "g (garnish)"]] },
    ],
    steps: [
      "Prepare dough; dust peel.",
      "Cheese first; then spread three sauces.",
      "Bake: Deck at 350 °C ~6:00; rotate at 3:00.",
      "Finish with grated parmesan.",
    ],
    plating: PLATE, holding: HOLD,
    allergens: "Contains: Gluten (wheat), Milk, Tree nuts (pesto).",
  },
  {
    page: 10, dishCode: "PZ-10", title: "Burrata Hot Honey",
    description: "A vibrant pizza with a creamy burrata centre, sweet hot honey, aromatic garlic oil and a touch of gochugaru for bold, balanced flavour.",
    summary: "Creamy burrata, sweet heat and aromatic garlic—finished with a sprinkle of gochugaru.",
    ...TIMES_STD, timeText: TT, dietary: V, miseEnPlace: MISE, equipment: EQUIP,
    sizes: [
      { label: L11, items: [["Pizza dough", 180, "g"], ["Pomodoro", 80, "g"], ["Oregano", 5, "g"], ["Olive oil", 5, "ml"], ["Burrata (post-bake)", 80, "g"], ["Hot honey (post-bake)", 6, "g"], ["Garlic oil (post-bake)", 5, "g"], ["Gochugaru (garnish)", 3, "g"]] },
      { label: L15, items: [["Pizza dough", 320, "g"], ["Pomodoro", 150, "g"], ["Oregano", 5, "g"], ["Olive oil", 5, "ml"], ["Burrata (post-bake)", 130, "g"], ["Hot honey (post-bake)", 10, "g"], ["Garlic oil (post-bake)", 5, "g"], ["Gochugaru (garnish)", 5, "g"]] },
    ],
    steps: [
      "Prepare dough; dust peel.",
      "Spread pomodoro with oregano; leave 12 mm rim.",
      "Only base sauce pre-bake.",
      "Bake: Deck at 350 °C ~6:00; rotate at 3:00.",
      "Dot burrata, drizzle hot honey & garlic oil; sprinkle gochugaru.",
    ],
    plating: PLATE, holding: HOLD, allergens: ALG,
  },
  {
    page: 11, dishCode: "PZ-11", title: "Apollo",
    description: "A vibrant, Mediterranean-inspired pizza loaded with roasted vegetables, creamy feta and peppery arugula, finished with crispy breadcrumbs for the perfect crunch.",
    summary: "Roasted to perfection, topped with fresh arugula and a touch of feta—bold flavours in every bite.",
    ...TIMES_STD, timeText: TT, dietary: V, miseEnPlace: MISE, equipment: EQUIP,
    sizes: [
      { label: L11, items: [["Pizza dough", 180, "g"], ["Pomodoro", 80, "g"], ["Mozzarella grated", 70, "g"], ["Garlic slice", 20, "g"], ["Red paprika", 15, "g"], ["Zucchini", 70, "g"], ["Artichoke", 30, "g"], ["Caramelised onion", 25, "g"], ["Feta (post-bake)", 10, "g"], ["Marinated arugula (garnish)", 15, "g"], ["Breadcrumbs (garnish)", 10, "g"]] },
      { label: L15, items: [["Pizza dough", 320, "g"], ["Pomodoro", 150, "g"], ["Mozzarella grated", 120, "g"], ["Garlic slice", 30, "g"], ["Red paprika", 20, "g"], ["Zucchini", 100, "g"], ["Artichoke", 50, "g"], ["Caramelised onion", 50, "g"], ["Feta (post-bake)", 20, "g"], ["Marinated arugula (garnish)", 20, "g"], ["Breadcrumbs (garnish)", 20, "g"]] },
    ],
    steps: [
      S_PREP, S_SHAPE, S_SAUCE, S_CHEESE, S_BAKE2, S_FINISH,
      "Load veg before bake.",
      "Finish with arugula, feta, breadcrumbs.",
    ],
    plating: PLATE, holding: HOLD, allergens: ALG,
  },
  {
    page: 12, dishCode: "PZ-12", title: "Affair",
    description: "A rich and savory pizza layered with roasted mushrooms, sweet onions, creamy ricotta and gooey mozzarella, finished with spring onion and a touch of fragrant shimeji.",
    summary: "Earthy mushrooms, sweet onions and creamy ricotta come together on a perfectly crisp base—simple, balanced and irresistibly comforting.",
    ...TIMES_STD, timeText: TT, dietary: V, miseEnPlace: MISE, equipment: EQUIP,
    sizes: [
      { label: '11"', items: [["Pizza dough", 180, "g"], ["Spicy pomodoro", 80, "g"], ["Onion", 30, "g"], ["Peeled garlic", 20, "g"], ["Capers", 4, "g"], ["Mozzarella grated", 70, "g"], ["Button mushrooms", 50, "g"], ["Shimeji mushrooms", 20, "g"], ["Garlic ricotta (post-bake)", 80, "g"], ["Spring onion (garnish)", 8, "g"]] },
      { label: '15"', items: [["Pizza dough", 320, "g"], ["Spicy pomodoro", 150, "g"], ["Onion", 50, "g"], ["Peeled garlic", 30, "g"], ["Capers", 6, "g"], ["Mozzarella grated", 120, "g"], ["Button mushrooms", 70, "g"], ["Shimeji mushrooms", 30, "g"], ["Garlic ricotta (post-bake)", 110, "g"], ["Spring onion (garnish)", 10, "g"]] },
    ],
    steps: [
      "Shape; dust peel.",
      "Spread base; leave 12 mm rim.",
      "Add onions, garlic, capers; then mozzarella.",
      "Add mushrooms.",
      "Bake ~6 min; rotate once.",
      "Post-bake: ricotta, spring onion & chimichurri dollops. Slice & serve.",
    ],
    plating: 'Pizza board/plate • 6 slices (11") / 8 slices (15").',
    holding: "Bake to order • Pass ≤ 5 min • No reheat.",
    allergens: "Contains: Gluten, Milk.",
  },
  {
    page: 13, dishCode: "PZ-14", title: "Chilli Crunch",
    description: "A bold and aromatic pizza featuring béchamel, melty mozzarella, roasted mushrooms and burrata, finished with spicy chilli crunch, sesame and fresh herbs for a perfect balance of heat, creaminess and crunch.",
    summary: "Creamy, spicy and crunchy in every bite—chilli crunch and fresh herbs elevate classic ingredients into something unforgettable.",
    ...TIMES_STD, timeText: TT, dietary: ["Contains dairy."], miseEnPlace: MISE, equipment: EQUIP,
    sizes: [
      { label: '11"', items: [["Pizza dough", 180, "g"], ["Béchamel", 50, "g"], ["Mozzarella grated", 70, "g"], ["Chilli crunch sauce", 100, "g"], ["Burrata (post-bake)", 130, "g"], ["Black sesame (on crust)", 6, "g"], ["Coriander", 8, "g"], ["Spring onion", 8, "g"], ["Basil", 8, "g"], ["Dill leaves", 8, "g"], ["Chilli crisp oil (post-bake)", 8, "g"]] },
      { label: '15"', items: [["Pizza dough", 320, "g"], ["Béchamel", 70, "g"], ["Mozzarella grated", 120, "g"], ["Chilli crunch sauce", 200, "g"], ["Burrata (post-bake)", 170, "g"], ["Black sesame (on crust)", 10, "g"], ["Coriander", 10, "g"], ["Spring onion", 10, "g"], ["Basil", 10, "g"], ["Dill leaves", 10, "g"], ["Chilli crisp oil (post-bake)", 10, "g"]] },
    ],
    steps: [
      "Shape; dust peel.",
      "Spread béchamel; leave 12 mm rim.",
      "Add bechamel sauce, mozzarella cheese & chilli crunch sauce.",
      "Bake ~6 min; rotate once.",
      "Post-bake: garnish with burrata dollops, chilli oil drizzle, fried garlic & mix herbs. Slice & serve.",
    ],
    plating: PLATE, holding: HOLD,
    allergens: "Contains: Gluten (wheat), Milk, Sesame.",
  },
  {
    page: 14, dishCode: "PZ-15", title: "Picante",
    description: "A bold and fiery pizza loaded with roasted peppers, fresh chillies, garlic and ghost pepper heat, balanced with melted mozzarella for a perfect spicy kick.",
    summary: "Spicy, smoky and bold in every bite—ghost pepper heat, roasted peppers and fresh chillies come together to create a powerful, well-balanced pizza with depth and intensity.",
    ...TIMES_STD, timeText: TT, dietary: ["Contains dairy."], miseEnPlace: MISE, equipment: EQUIP,
    sizes: [
      { label: '11"', items: [["Pizza dough", 180, "g"], ["Pomodoro", 80, "g"], ["Mozzarella grated", 70, "g"], ["Chili oil", 6, "g"], ["Ghost pepper", 1, "g"], ["Roasted bell pepper", 25, "g"], ["Gochugaru", 3, "g"], ["Garlic slice", 10, "g"], ["Green chilli", 7, "g"], ["Red paprika", 10, "g"], ["Jalapeño", 10, "g"]] },
      { label: '15"', items: [["Pizza dough", 320, "g"], ["Pomodoro", 150, "g"], ["Mozzarella grated", 120, "g"], ["Chili oil", 10, "g"], ["Ghost pepper", 1.5, "g"], ["Roasted bell pepper", 40, "g"], ["Gochugaru", 5, "g"], ["Garlic slice", 15, "g"], ["Green chilli", 10, "g"], ["Red paprika", 15, "g"], ["Jalapeño", 25, "g"]] },
    ],
    steps: [
      S_PREP, S_SHAPE, S_SAUCE, S_CHEESE, S_BAKE2, S_FINISH,
      "Mix chili oil + ghost pepper into sauce or drizzle before baking.",
      "Finish with gochugaru.",
    ],
    plating: PLATE, holding: HOLD,
    allergens: "Contains: Gluten (wheat), Milk.",
  },
  {
    page: 15, dishCode: "PZ-16", title: "Diavolo",
    description: "A spicy, robust pizza with in-house jalapeño, vegan nduja and pickled onion, finished with fresh basil for a perfect balance of heat, acidity and aroma.",
    summary: "Bold, spicy and full of character—vegan nduja, jalapeño and pickled onion deliver heat and tang, balanced by fresh basil and melted mozzarella.",
    ...TIMES_STD, timeText: TT, dietary: ["Vegan option available."], miseEnPlace: MISE, equipment: EQUIP,
    sizes: [
      { label: '11"', items: [["Pizza dough", 180, "g"], ["Pomodoro", 80, "g"], ["Mozzarella grated", 70, "g"], ["In-house jalapeño", 30, "g"], ["Vegan nduja", 50, "g"], ["Pickled onion (post-bake)", 10, "g"], ["Basil", 5, "g"]] },
      { label: '15"', items: [["Pizza dough", 320, "g"], ["Pomodoro", 150, "g"], ["Mozzarella grated", 120, "g"], ["In-house jalapeño", 30, "g"], ["Vegan nduja", 90, "g"], ["Pickled onion (post-bake)", 10, "g"], ["Basil", 5, "g"]] },
    ],
    steps: [
      S_PREP, S_SHAPE, S_SAUCE, S_CHEESE, S_BAKE2, S_FINISH,
      "Add jalapeño and small dollops of vegan nduja pre-bake.",
      "Finish with pickled onion and basil.",
    ],
    plating: PLATE, holding: HOLD,
    allergens: "Contains: Gluten (wheat), Milk.",
  },
  {
    page: 16, dishCode: "PZ-19", title: "Hulk",
    description: "A vibrant and indulgent pizza with creamy pesto, mozzarella and buffalo, finished with sour cream for a tangy, luscious bite.",
    summary: "Bright, herby and irresistibly creamy—pesto and buffalo come together in perfect harmony, balanced by a drizzle of sour cream for a rich and refreshing finish.",
    ...TIMES_STD, timeText: TT, dietary: ["Vegetarian option available."], miseEnPlace: MISE, equipment: EQUIP,
    sizes: [
      { label: '11"', items: [["Pizza dough", 180, "g"], ["Mozzarella grated", 70, "g"], ["Sriracha 10 g (mix)", 10, "g"], ["Amul fresh cream 90 g (mix)", 90, "g"], ["Pesto 10 g (mix)", 10, "g"], ["Buffalo mozzarella 15 g", 15, "g"], ["Sour cream 20 g (post-bake)", 20, "g"]] },
      { label: '15"', items: [["Pizza dough", 320, "g"], ["Mozzarella grated", 120, "g"], ["Sriracha 25 g (mix)", 25, "g"], ["Amul fresh cream 150 g (mix)", 150, "g"], ["Pesto 30 g (mix)", 30, "g"], ["Buffalo mozzarella 25 g", 25, "g"], ["Sour cream 25 g (post-bake)", 25, "g"]] },
    ],
    steps: [
      "Prepare dough; dust peel.",
      "Spread Hulk sauce (pesto + cream + sriracha) as base; leave 12 mm rim.",
      "Add mozzarella and buffalo.",
      "Bake: Deck at 350 °C ~6:00; rotate at 3:00.",
      "Pipe sour cream post-bake. Slice & serve.",
    ],
    plating: PLATE, holding: HOLD,
    allergens: "Contains: Gluten (wheat), Milk, Tree nuts (pesto).",
  },
  {
    page: 17, dishCode: "PZ-21", title: "Potato Pie Pizza", version: "1.1",
    description: "A creamy and comforting vegetarian pizza with thinly sliced marinated potatoes, pesto and roasted garlic, finished with sweet bell pepper jam and crisp fried potato julienne for texture and depth.",
    summary: "Creamy, herby and indulgent—leek cream cheese, roasted potatoes and pesto come together in perfect balance, finished with bell pepper jam and crispy potato julienne.",
    ...TIMES_STD, timeText: TT, dietary: V, miseEnPlace: MISE, equipment: EQUIP,
    sizes: [
      { label: '11"', items: [["Pizza dough", 180, "g"], ["Leek cream cheese sauce", 70, "g"], ["Buffalo mozzarella", 15, "g"], ["Mozzarella (grated)", 60, "g"], ["Green chilli", 2, "g"], ["Garlic slices", 9, "g"], ["Marinated potato", 40, "g"], ["Parmesan cheese", 9, "g"], ["Olive oil", 5, "g"], ["After Bake: Spicy pesto", 20, "g"], ["After Bake: Bell pepper jam", 15, "g"], ["After Bake: Fried potato julienne", 25, "g"]] },
      { label: '15"', items: [["Pizza dough", 320, "g"], ["Leek cream cheese sauce", 140, "g"], ["Buffalo mozzarella", 25, "g"], ["Mozzarella (grated)", 120, "g"], ["Green chilli", 4, "g"], ["Garlic slices", 15, "g"], ["Marinated potato", 60, "g"], ["Parmesan cheese", 15, "g"], ["Olive oil", 10, "g"], ["After Bake: Spicy pesto", 25, "g"], ["After Bake: Bell pepper jam", 20, "g"], ["After Bake: Fried potato julienne", 35, "g"]] },
    ],
    steps: [
      "Prepare dough; dust peel.",
      "Spread leek cream cheese sauce as base; leave 12 mm rim.",
      "Add buffalo mozzarella followed by mozzarella (grated).",
      "Add green chilli, garlic slices, marinated potato and parmesan; drizzle olive oil.",
      "Bake: Deck at 350 °C ~6 min; rotate at 3 min. Base fully cooked, cheese melted and lightly golden.",
      "After baking: finish with spicy pesto, bell pepper jam and fried potato julienne.",
    ],
    plating: PLATE, holding: HOLD,
    allergens: "Contains: Gluten (wheat), Milk, Alliums.\nCross-contact: Nuts, sesame, soy.",
  },
  {
    page: 18, dishCode: "CA-PZ01", title: "Hell Boy Pizza",
    author: "Capiche Culinary", approvedBy: "Hussain Khan", station: "Assembly Station", yieldText: "1 pizza",
    description: "A fiery pizza layered with a pomodoro Sriracha base, smoked and cheddar cheeses, and roasted garlic, finished with golden honey butter, chunky chimichurri, and whipped feta.",
    summary: null,
    prepMinutes: 15, cookMinutes: 15, totalMinutes: 30, timeText: { cook: "12–15 min", total: "30 min" },
    dietary: V, miseEnPlace: [],
    equipment: ["Pizza oven (deck or conveyor)", "Pizza peel", "Sauce bowl", "Basting brush", "Grater", "Chef's knife", "Mixing bowl", "Measuring cups & spoons", "Squeeze bottle", "Oven gloves"],
    sizes: [
      { label: L11, items: [["Pizza dough", 180, "g"], ["Basil Pomodoro sauce", 69.68, "g"], ["Red Sriracha", 17.42, "g"], ["Smoked cheese", 58.06, "g"], ["Cheddar cheese", 11.61, "g"], ["Garlic slices", 17.42, "g"], ["Honey butter drizzle", 5.81, "g"], ["Chimichurri (chunky)", 14.52, "g"], ["Whipped feta dollop", 14.52, "g"]] },
      { label: L15, items: [["Pizza dough", 320, "g"], ["Basil Pomodoro sauce", 120, "g"], ["Red Sriracha", 30, "g"], ["Smoked cheese", 100, "g"], ["Cheddar cheese", 20, "g"], ["Garlic slices", 30, "g"], ["Honey butter drizzle", 10, "g"], ["Chimichurri (chunky)", 25, "g"], ["Whipped feta dollop", 25, "g"]] },
    ],
    steps: [
      "In a bowl, combine pomodoro sauce and red Sriracha. Mix well to form the sauce base.",
      "Take a dough ball and roll it out. Spread the sauce evenly over the base.",
      "Top with grated smoked cheese, grated cheddar cheese, and garlic slices.",
      "Bake until cooked through and the crust is golden.",
      "After baking, garnish with honey butter drizzle, chunky chimichurri, and a whipped feta dollop.",
    ],
    qualityCheck: ["Base fully cooked", "Cheese melted and lightly golden", "Garlic not burnt", "Garnishes added only after baking"],
    plating: "Cut into slices.\nServe immediately. Do not hold after baking.",
    holding: "Best enjoyed fresh.\nNot suitable for holding.",
    allergens: "Gluten, Dairy, Alliums",
    notes: "CHEF'S TIP\nRoast garlic slices lightly in olive oil until golden for a sweeter, mellower flavour that won't burn in the oven.",
  },
  {
    page: 19, dishCode: "CA-PZ02", title: "Chilli Butter Corn Pizza",
    author: "Capiche Culinary", approvedBy: "Hussain Khan", station: "Assembly Station", yieldText: "1 pizza",
    description: "A creamy, smoky and spicy vegetarian pizza loaded with a zesty corn elotes mix, jalapeños and garlic, finished with chilli butter and a dynamite crunch.",
    summary: null,
    prepMinutes: 25, cookMinutes: 15, totalMinutes: 40, timeText: { cook: "12–15 min", total: "40 min" },
    dietary: V, miseEnPlace: [],
    equipment: ["Pizza oven (deck or conveyor)", "Pizza peel", "Sauce bowl", "Mixing bowls", "Grater", "Tongs", "Chef's knife", "Measuring cups & spoons", "Basting brush", "Oven gloves"],
    sizes: [
      { label: L11, items: [["Pizza dough", 180, "g"], ["White sauce", 69.68, "g"], ["Mozzarella cheese", 58.06, "g"], ["Cheddar cheese", 11.61, "g"], ["Corn mix", 69.68, "g"], ["Jalapeno slices", 29.03, "g"], ["Garlic slices", 17.42, "g"], ["Black sesame (crust)", 5.81, "g"], ["Chilli butter dollop", 14.52, "g"], ["Spring onion", 2.9, "g garnish"], ["Gochugaru", 1.16, "g garnish"], ["Dynamite crunch", 11.61, "g garnish"]] },
      { label: L15, items: [["Pizza dough", 320, "g"], ["White sauce", 120, "g"], ["Mozzarella cheese", 100, "g"], ["Cheddar cheese", 20, "g"], ["Corn mix", 120, "g"], ["Jalapeno slices", 50, "g"], ["Garlic slices", 30, "g"], ["Black sesame (crust)", 10, "g"], ["Chilli butter dollop", 25, "g"], ["Spring onion", 5, "g garnish"], ["Gochugaru", 2, "g garnish"], ["Dynamite crunch", 20, "g garnish"]] },
    ],
    steps: [
      "Char the corn on high heat.",
      "In a bowl, combine corn, mayonnaise, sour cream, parmesan, Tajín, lime juice and zest, coriander, and salt. Mix well.",
      "In a separate bowl, mix fresh cream, garlic, lemon juice, salt, and black pepper to make the white sauce.",
      "Spread white sauce on the pizza base. Layer with mozzarella, cheddar, corn mix, jalapeno slices, and garlic slices. Finish the crust edge with black sesame.",
      "Mix butter, chilli crisp, and red chilli powder to make chilli butter.",
      "Bake at 340°C until fully cooked.",
      "After baking, garnish with chilli butter dollop, spring onion, gochugaru, and dynamite crunch.",
    ],
    qualityCheck: ["Base fully cooked", "Corn mix flavourful", "Garlic not burnt", "Crust crisp", "Garnishes added only after baking"],
    plating: "Cut into slices.\nServe immediately. Do not hold after baking.",
    holding: "Best enjoyed fresh.\nNot suitable for holding.",
    allergens: "Gluten, Dairy, Eggs",
    notes: "CHEF'S TIP\nChar the corn well for a smoky flavour and toast the sesame crust for extra crunch.",
  },
  {
    page: 20, dishCode: "PZ-22", title: "Hulk 2.0",
    author: "Bookends Hospitality", version: "2.2", effective: "2026-08-24", nextReview: "2027-08-24",
    description: "A green goddess style pizza with basil, parsley, spinach, cheeses, jalapeño, zucchini and whipped labneh.",
    summary: "Green goddess style pizza finished with whipped labneh.",
    prepMinutes: 6, cookMinutes: 7, totalMinutes: 13, timeText: { prep: "5-6 min", cook: "6-7 min", total: "~12-13 min" },
    dietary: V,
    miseEnPlace: ['11" and 15" dough balls ready', "Hulk 2.0 sauce portioned", "Mozzarella and cheddar scaled", "Jalapeño sliced", "Green and yellow zucchini julienned", "Red paprika sliced", "Whipped labneh ready for finishing"],
    equipment: ["Deck / stone oven (320°C, Top 4, Bottom 6)", "Pizza peel", "Bench scraper", "Digital scale", "Sauce ladle / spoon", "Pizza wheel", "Squeeze bag for labneh"],
    sizes: [
      { label: '11"', items: [["Pizza dough", 180, "g"], ["Hulk 2.0 sauce", 70, "g"], ["Low moisture mozzarella", 60, "g"], ["Cheddar cheese", 25, "g"], ["Jalapeño", 7.5, "g"], ["Green zucchini, julienned", 7.5, "g"], ["Yellow zucchini, julienned", 7.5, "g"], ["Red paprika, sliced", 7.5, "g"], ["Whipped labneh", null, "as req."]] },
      { label: '15"', items: [["Pizza dough", 320, "g"], ["Hulk 2.0 sauce", 120, "g"], ["Low moisture mozzarella", 120, "g"], ["Cheddar cheese", 50, "g"], ["Jalapeño", 15, "g"], ["Green zucchini, julienned", 30, "g"], ["Yellow zucchini, julienned", 30, "g"], ["Red paprika, sliced", 15, "g"], ["Whipped labneh", null, "as req."]] },
    ],
    steps: [
      'Remove the required 11" or 15" dough ball.',
      "Open and hand-stretch to the required size, keeping an even rim.",
      "Spread Hulk 2.0 sauce evenly, leaving the border clean.",
      "Add mozzarella and cheddar as per the listed size weights.",
      "Add jalapeño, green and yellow zucchini, and red paprika.",
      "Bake at 320°C, Top 4 / Bottom 6, for 6-7 min until cooked, charred and crisp.",
      "Add whipped labneh after baking and serve immediately.",
    ],
    plating: "Pizza board / plate. Finish with whipped labneh after baking.",
    holding: "Serve within 3 min of bake. Build-to-order only. No reheat.",
    allergens: "Contains: Gluten, Dairy, Nuts.",
    sopSections: [
      "# HULK 2.0 SAUCE - MID / PRIME @mid",
      "* Ingredients | Mid / Prime",
      "Spinach | 50 g / 100 g",
      "Sriracha | 12.5 g / 25 g",
      "Fresh cream | 50 g / 100 g",
      "# WHIPPED LABNEH @side",
      "* Ingredients | Qty",
      "Hung curd | 150 g",
      "Fresh cream | 30 g",
      "Olive oil | 15 g",
      "Lemon juice | 3 g",
      "Salt | 1 g",
      "Black pepper | 0.5 g",
      "Dill leaves, chopped | 4 g",
      "Chopped parsley | 5 g",
      "> Labneh quantity per pizza to be finalised as per approved service standard.",
      "## LABNEH METHOD",
      "- 1. Combine hung curd, cream, olive oil and lemon juice.",
      "- 2. Season with salt and black pepper.",
      "- 3. Whip until smooth, light and creamy.",
      "- 4. Fold in dill and parsley; transfer to a squeeze bag.",
      "- 5. Refrigerate until use.",
    ].join("\n"),
  },
  {
    page: 21, dishCode: "PZ-23", title: "Hot Chips Pizza",
    author: "Bookends Hospitality", version: "1.3", effective: "2026-08-24", nextReview: "2027-08-24",
    description: "A Cacio e Pepe style pizza with creamy sauce, mozzarella, goat cheese, jalapeño, green chilli, garlic, hot chips and Tajin.",
    summary: "Cacio e Pepe style pizza finished with hot chips and Tajin.",
    prepMinutes: 7, cookMinutes: 7, totalMinutes: 14, timeText: { prep: "6-7 min", cook: "6-7 min", total: "~13-14 min" },
    dietary: V,
    miseEnPlace: ['11" and 15" dough balls ready', "Cacio e Pepe sauce portioned", "Mozzarella and goat cheese scaled", "Jalapeño, green chilli and garlic sliced", "Fresh thyme picked", "Tajin measured for assembly", "Hot chips ready for final topping"],
    equipment: ["Deck / stone oven (320°C, Top 4, Bottom 6)", "Pizza peel", "Bench scraper", "Digital scale", "Sauce ladle / spoon", "Fryer / chip fryer for potato chips", "Pizza wheel"],
    sizes: [
      { label: '11"', items: [["Pizza dough", 180, "g"], ["Cacio e Pepe sauce", 67.5, "g"], ["Low moisture mozzarella", 67.5, "g"], ["Goat cheese", 28.1, "g"], ["Fresh jalapeño", 11.3, "g"], ["Green chilli", 4.5, "g"], ["Sliced garlic", 8.4, "g"], ["Fresh thyme", 0.6, "g"], ["Tajin powder", 1.1, "g"], ["Balsamic glaze", 5.6, "g"], ["Olive oil", 1.1, "g"], ["Parmesan", 3.4, "g"], ["Hot chips", 33.8, "g"], ["Black pepper", 1.1, "g"]] },
      { label: '15"', items: [["Pizza dough", 320, "g"], ["Cacio e Pepe sauce", 120, "g"], ["Low moisture mozzarella", 120, "g"], ["Goat cheese", 50, "g"], ["Fresh jalapeño", 20, "g"], ["Green chilli", 8, "g"], ["Sliced garlic", 15, "g"], ["Fresh thyme", 1, "g"], ["Tajin powder", 2, "g"], ["Balsamic glaze", 10, "g"], ["Olive oil", 2, "g"], ["Parmesan", 6, "g"], ["Hot chips", 60, "g"], ["Black pepper", 2, "g"]] },
    ],
    steps: [
      "Remove the required 11\" or 15\" dough ball; lightly dust bench and dough.",
      "Open and hand-stretch to the required size, keeping an even rim.",
      "Spread Cacio e Pepe sauce evenly, leaving the border clean.",
      "Add low moisture mozzarella and goat cheese as per the listed size weights.",
      "Add jalapeño, green chilli, sliced garlic and thyme.",
      "Add Tajin powder evenly during assembly before baking.",
      "Bake at 320°C, Top 4 / Bottom 6, for 6-7 min until cooked, charred and crisp.",
      "Finish with balsamic glaze, olive oil on the crust, grated Parmesan, hot chips and black pepper; serve immediately.",
    ],
    plating: "Pizza board / plate. Finish with balsamic glaze, Parmesan and hot chips.",
    holding: "Serve within 3 min of bake. Build-to-order only. No reheat.",
    allergens: "Contains: Gluten, Dairy, Nuts.",
    notes: "ASSEMBLY NOTE\nTajin is added during assembly before baking. Hot chips are added only after baking.",
  },
];

const slugify = (s: string) =>
  s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function main() {
  const brand = await db.brand.findUniqueOrThrow({ where: { slug: "capiche" } });
  const category = await db.category.findUniqueOrThrow({
    where: { brandId_slug: { brandId: brand.id, slug: "pizza" } },
  });
  const owner = await db.admin.findFirst({ where: { role: "OWNER", isActive: true } });

  // Listing is newest-first, so publish in reverse to show the PDF order.
  const baseTime = Date.now();

  for (const [index, p] of PIZZAS.entries()) {
    const slug = slugify(p.title);
    const existing = await db.recipe.findFirst({
      where: { brandId: brand.id, externalId: p.dishCode, deletedAt: null },
    });

    let heroImageId = existing?.heroImageId ?? null;
    if (!heroImageId) {
      const file = `photo-${String(p.page).padStart(2, "0")}.jpg`;
      const media = await uploadImage({
        buffer: await readFile(path.join(IMAGE_DIR, file)),
        originalName: file,
        alt: p.title,
        brandId: brand.id,
        uploadedById: owner?.id ?? null,
      });
      heroImageId = media.id;
    }

    const ingredients = p.sizes.flatMap((size) => size.items.map(([name, quantity, unit]) => ({ groupLabel: size.label, name, quantity, unit })));

    const input = RecipeInputSchema.parse({
      brandId: brand.id,
      categoryId: category.id,
      externalId: p.dishCode,
      slug,
      title: p.title,
      excerpt: p.description.slice(0, 200),
      description: p.description,
      heroImageId,
      prepMinutes: p.prepMinutes,
      cookMinutes: p.cookMinutes,
      totalMinutes: p.totalMinutes,
      servings: 1,
      yieldText: p.yieldText ?? '1 pizza\n(11" or 15")',
      course: "Pizza",
      dietary: p.dietary,
      equipment: p.equipment,
      notes: p.notes ?? null,
      dishCode: p.dishCode,
      author: p.author ?? "Bookends Culinary",
      approvedBy: p.approvedBy ?? "Husen Khan",
      effectiveDate: new Date(`${p.effective ?? "2026-04-16"}T12:00:00Z`),
      nextReviewDate: new Date(`${p.nextReview ?? "2027-03-16"}T12:00:00Z`),
      miseEnPlace: p.miseEnPlace,
      plating: p.plating,
      holding: p.holding,
      allergens: p.allergens,
      station: p.station ?? "Deck Oven",
      summary: p.summary,
      sopVersion: p.version ?? "1.0",
      qualityCheck: p.qualityCheck ?? [],
      sopSections: p.sopSections ?? null,
      customFields: p.timeText ? { timeText: p.timeText } : {},
      ingredients: ingredients.map((i, position) => ({
        position,
        groupLabel: i.groupLabel,
        quantity: i.quantity,
        unit: i.unit,
        name: i.name,
        raw: `${i.name} ${i.quantity ?? ""} ${i.unit}`.replace(/\s+/g, " ").trim(),
      })),
      steps: p.steps.map((body, position) => ({ phase: "COOK", position, body })),
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
      sopSections: input.sopSections ?? null,
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

    console.log(`${existing ? "Updated" : "Created"} ${p.dishCode} ${p.title} → /capiche/recipes/${recipe.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
