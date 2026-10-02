/**
 * Adds the 13 Capiche PASTA SOP recipes (from "rec 7.pdf", one recipe per page) with their photos.
 * Photos are cropped from each PDF page into backend/data/capiche-pasta/photo-NN-*.jpg.
 * Idempotent: recipes are matched on (brand, externalId = dish code) and updated in place.
 *
 * Run: npx tsx --conditions=react-server --tsconfig tsconfig.json backend/scripts/seed_capiche_pasta.ts
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/server/db";
import { uploadImage } from "@/server/media/upload";
import { RecipeInputSchema } from "@/lib/schemas/recipe";
import { Prisma } from "@/generated/prisma/client";

const IMAGE_DIR = path.join(process.cwd(), "backend/data/capiche-pasta");

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
}

const BC = "Bookends Culinary";
const HK = "Husen Khan";
const CC = "Capiche Culinary";
const HUK = "Hussain Khan";
const PASTA_EQUIP = ["Pasta boiler", "Sauté pan (28 cm)", "Ladle", "Tongs", "Digital scale", "Timer"];
const BUILD = "Build-to-order only.\nNo reheating.";
const BOWL = "Pasta bowl / plate • Serve hot.";
const GW = "Contains: Gluten (wheat), Milk.";
const KITCHEN_PLATING = "Serve immediately while hot.\nDo not hold after plating.";
const KITCHEN_HOLD = "Best enjoyed fresh.\nNot suitable for holding.";

const DISHES: Dish[] = [
  {
    photo: "photo-01-aglio-olio.jpg", dishCode: "PS-01", title: "Aglio Olio",
    description: "", summary: "A simple yet bold pasta made with lots of garlic, good olive oil and a hint of chilli. Finished with spring onion, fried garlic bits and lemon zest for a bright, aromatic touch.",
    author: "Capiche Culinary Team", approvedBy: "Head Chef", version: "1.0", effective: "2025-08-23", nextReview: "2026-08-23", station: "Hot Range",
    yieldText: "~250 g", prepMinutes: 10, cookMinutes: 20, totalMinutes: 30, timeText: { prep: "10 min", cook: "20 min", total: "30 min" }, dietary: ["V"],
    miseEnPlace: ["Spaghetti boiled 190 g", "Garlic sliced 10 g", "Garlic chopped 25 g", "Spring onion (green part) chopped 20 g", "Fried garlic bits 5 g", "Chilli flakes 1 g", "Olive oil 15 g", "Lemon zest to taste", "Salt to taste", "Black pepper to taste"],
    equipment: ["Pasta boiler", "Sauté pan (28 cm)", "Tongs", "Ladle", "Microplane / Zester", "Timer"],
    ingredients: [
      ["Olive oil", 15, "g"], ["Garlic sliced", 10, "g"], ["Garlic chopped", 25, "g"], ["Dried red chilli flakes", 1, "g"], ["Boiled spaghetti", 190, "g"],
      ["Spring onion (green part) chopped", 20, "g"], ["Fried garlic bits", 5, "g"], ["Salt", null, "To taste"], ["Black pepper", null, "To taste"], ["Lemon zest", null, "To taste"],
    ],
    steps: [
      "Bring a large pot of salted water to a boil. Add spaghetti and cook until al dente. Reserve 2–3 tbsp pasta water and drain.",
      "Heat olive oil in a sauté pan over medium heat.",
      "Add sliced garlic and sauté gently for 1–2 minutes until light golden.",
      "Add chopped garlic and chilli flakes. Cook for 30–40 seconds until aromatic.",
      "Add the cooked spaghetti to the pan.",
      "Add a splash of reserved pasta water. Toss well to emulsify and coat the pasta evenly in the garlic oil.",
      "Season with salt and black pepper. Adjust to taste.",
      "Remove from heat. Add chopped spring onion and toss to combine.",
      "Plate immediately. Garnish with chilli crisp, fried garlic, green garlic, chopped spring onion & lemon zest. Serve hot.",
    ],
    plating: "Pasta bowl/plate.\nServe hot.", holding: BUILD, allergens: "Contains: Gluten (wheat).",
    notes: "CHEF'S TIPS\n• Use medium heat. Garlic should turn golden, not brown.\n• Reserve a little pasta water – it helps create a silky, light coating.\n• Toss off the heat to keep the garlic aroma fresh and bright.\n• Use good quality olive oil – it's the hero ingredient.",
  },
  {
    photo: "photo-02-pomodoro-spaghetti.jpg", dishCode: "PS-02", title: "Pomodoro Spaghetti",
    description: "Classic Italian spaghetti with sweet cherry tomatoes and rich pomodoro sauce, finished with basil and parmesan.",
    summary: "Simple, comforting and full of flavour. Sweet tomatoes, garlic and basil create the perfect balance.",
    author: BC, approvedBy: HK, station: "Hot Range",
    yieldText: "~250 g", prepMinutes: 5, cookMinutes: 3, totalMinutes: 8, timeText: { prep: "5 min", cook: "3 min", total: "~8 min" }, dietary: ["V"],
    miseEnPlace: ["Spaghetti boiled 140 g", "Pomodoro 220 g", "Cherry tomato 40 g", "Basil 4 g + 2 g garnish", "Parmesan grated 7 g"],
    equipment: PASTA_EQUIP,
    ingredients: [
      ["Butter", 20, "g"], ["Oil", 5, "g"], ["Cherry tomato", 40, "g"], ["Pomodoro", 220, "g"], ["Boiled spaghetti", 140, "g"], ["Salt", 6.8, "g"],
      ["Black pepper", 0.5, "g"], ["Chilli flakes", 1, "g"], ["Sugar", 3, "g"], ["Parmesan", 7, "g"], ["Basil", null, "to taste"],
    ],
    steps: ["Heat oil; sauté cherry tomatoes.", "Add pomodoro; season.", "Add spaghetti; toss.", "Simmer; add butter.", "Finish with basil; parmesan garnish."],
    garnish: ["Herbed bread crumbs", "Basil", "Parmesan"],
    plating: BOWL, holding: BUILD, allergens: GW,
  },
  {
    photo: "photo-03-spicy-tomato-cream-macaroni.jpg", dishCode: "PS-03", title: "Spicy Tomato & Cream Macaroni",
    description: "Creamy and spicy tomato pasta with a rich velvety sauce, finished with aromatic herbs and a touch of heat.",
    summary: "Bold, creamy and spicy with a smooth tomato base and a hint of heat. Perfect comfort food.",
    author: BC, approvedBy: HK, station: "Hot Range",
    yieldText: "~250 g", prepMinutes: 10, cookMinutes: 2, totalMinutes: 12, timeText: { prep: "10 min", cook: "2 min", total: "~12 min" }, dietary: ["V"],
    miseEnPlace: ["Boiled macaroni 120 g", "Orange sauce 200 g", "Butter 20 g", "Hot sauce 10 g", "Fresh cream 10 g"],
    equipment: PASTA_EQUIP,
    ingredients: [
      ["Boiled macaroni", 120, "g"], ["Butter", 20, "g"], ["Hot sauce", 10, "g"], ["Salt", 5, "g"], ["Black pepper", 0.5, "g"], ["Fresh cream", 10, "g"],
      ["Orange (creamy tomato) sauce", 200, "g"],
    ],
    steps: ["Heat butter; add hot sauce; season.", "Add orange sauce; stir.", "Add cream; adjust seasoning.", "Toss macaroni; serve."],
    garnish: ["Chopped onion", "Red paprika salsa"],
    plating: BOWL, holding: BUILD, allergens: GW,
  },
  {
    photo: "photo-04-pesto-bucatini.jpg", dishCode: "PS-04", title: "Pesto Bucatini",
    description: "Silky pesto sauces coat perfectly cooked bucatini, finished with toasted pine nuts, edible flowers and a touch of parmesan.",
    summary: "Fresh, vibrant and aromatic. A perfect balance of basil, nuts and cream in every bite.",
    author: BC, approvedBy: HK, station: "Hot Range",
    yieldText: "~250 g", prepMinutes: 10, cookMinutes: 3, totalMinutes: 12, timeText: { prep: "10 min", cook: "2:30 min", total: "~12 min" }, dietary: ["V"],
    miseEnPlace: ["Bucatini boiled 140 g", "Pesto sauce 90 g", "Pesto white sauce 180 g", "Butter 20 g", "Parmesan grated 7 g"],
    equipment: PASTA_EQUIP,
    ingredients: [
      ["Boiled bucatini", 140, "g"], ["Pesto sauce", 90, "g"], ["Pesto white sauce", 180, "g"], ["Butter", 20, "g"], ["Parmesan", 7, "g"], ["Salt", 5, "g"],
      ["Pepper", 1, "g"], ["Chilli flakes", 1, "g"], ["Water", 100, "g"],
    ],
    steps: ["Heat butter; add pesto sauces; season.", "Adjust consistency with water.", "Toss bucatini; simmer briefly.", "Finish with parmesan."],
    garnish: ["Edible Flowers", "Pine Nuts"],
    plating: BOWL, holding: BUILD, allergens: "Contains: Gluten (wheat), Milk, Tree nuts (almonds).",
  },
  {
    photo: "photo-05-alfredo-fettuccine.jpg", dishCode: "PS-05", title: "Alfredo Fettuccine",
    description: "Rich and creamy alfredo fettuccine made with a silky béchamel sauce, finished with parmesan and aromatic herbs.",
    summary: "Creamy, comforting and indulgent with a touch of garlic and herbs. A classic favourite done right.",
    author: BC, approvedBy: HK, station: "Hot Range",
    yieldText: "~250 g", prepMinutes: 10, cookMinutes: 3, totalMinutes: 12, timeText: { prep: "10 min", cook: "2:30 min", total: "~12 min" }, dietary: ["V"],
    miseEnPlace: ["Fettuccine boiled 140 g", "Béchamel 190 g", "Butter 20 g", "Parmesan grated 7 g"],
    equipment: ["Pasta boiler", "Sauté pan 28 cm", "Ladle", "Tongs", "Digital scale", "Timer"],
    ingredients: [
      ["Boiled fettuccine", 140, "g"], ["Béchamel", 190, "g"], ["Butter", 20, "g"], ["Oil", 5, "g"], ["Chopped garlic", 10, "g"], ["Thyme", 1, "g"], ["Parsley", 1, "g"],
      ["Salt", 6, "g"], ["Black pepper", 1, "g"], ["Parmesan", 7, "g"], ["Water", 100, "g"],
    ],
    steps: ["Heat oil & butter; add garlic, herbs.", "Add béchamel; season; adjust with water.", "Toss fettuccine; finish with parmesan."],
    garnish: ["Fried Julienne Leeks", "Onion Seeds", "Chunky Chimichurri", "Parmesan"],
    plating: BOWL, holding: BUILD, allergens: GW,
  },
  {
    photo: "photo-06-lemon-linguini.jpg", dishCode: "PS-06", title: "Lemon Linguini",
    description: "Bright and creamy lemon linguini made with a silky white sauce, mascarpone and fresh lemon, finished with basil and parmesan.",
    summary: "Light, creamy and citrusy with a touch of fresh basil and parmesan. A refreshing classic favourite.",
    author: BC, approvedBy: HK, station: "Hot Range",
    yieldText: "~250 g", prepMinutes: 10, cookMinutes: 3, totalMinutes: 12, timeText: { prep: "10 min", cook: "2:30 min", total: "~12 min" }, dietary: ["V"],
    miseEnPlace: ["Linguini boiled 140 g", "White sauce 180 g", "Mascarpone 60 g", "Lemon zest 5 g", "Lemon juice 18 g", "Basil 2 g", "Parmesan grated 7 g"],
    equipment: ["Sauté pan 28 cm", "Ladle", "Digital scale", "Timer"],
    ingredients: [
      ["Boiled linguini", 140, "g"], ["White sauce", 180, "g"], ["Mascarpone", 60, "g"], ["Lemon zest", 5, "g"], ["Lemon juice", 18, "g"], ["Butter", 20, "g"],
      ["Parmesan", 7, "g"], ["Salt", 0.5, "g"], ["Pepper", 2, "g"], ["Basil", 2, "g"],
    ],
    steps: ["Heat butter; add white sauce, mascarpone.", "Add lemon; season.", "Toss linguini; adjust with water.", "Finish with basil; parmesan."],
    garnish: ["Fresh basil", "Parmesan", "Toasted bread crumbs"],
    plating: "Serve hot.", holding: BUILD, allergens: GW,
  },
  {
    photo: "photo-07-risotto.jpg", dishCode: "PS-07", title: "Risotto",
    description: "Comforting and creamy risotto made with arborio rice, sautéed garlic, asparagus and peas, finished with parmesan.",
    summary: "Creamy, wholesome and comforting with fresh vegetables and parmesan. A timeless classic favourite.",
    author: BC, approvedBy: HK, station: "Hot Range",
    yieldText: "~250 g", prepMinutes: 10, cookMinutes: 20, totalMinutes: 30, timeText: { prep: "10 min", cook: "~20 min", total: "~30 min" }, dietary: ["V"],
    miseEnPlace: ["Cooked arborio rice 100 g", "Asparagus 7 g", "Peas 8 g", "Béchamel 40 g", "Parmesan 5 g"],
    equipment: ["Sauté pan 28 cm", "Ladle", "Tongs", "Digital scale", "Timer"],
    ingredients: [
      ["Cooked arborio rice", 100, "g"], ["Asparagus", 7, "g"], ["Peas", 8, "g"], ["Béchamel", 40, "g"], ["Parmesan", 5, "g"], ["Salt", 5, "g"], ["Pepper", 0.5, "g"],
      ["Garlic", 5, "g"], ["Butter", 20, "g"], ["Oil", 5, "g"], ["Water", 100, "g"],
    ],
    steps: ["Heat butter+oil; sauté garlic, asparagus, peas.", "Add rice; season.", "Add water; add béchamel.", "Finish with parmesan; serve."],
    garnish: ["Fresh dill / herbs", "Edible flowers", "Toasted almonds (optional)", "Parmesan"],
    plating: "Serve hot.", holding: BUILD, allergens: GW,
  },
  {
    photo: "photo-08-lasagna.jpg", dishCode: "PS-10", externalId: "PASTA-PS-10", title: "Lasagna",
    description: "Classic lasagna with rich tomato sauce, creamy béchamel and layers of pasta, finished with parmesan and herbs.",
    summary: "Hearty, cheesy and comforting with perfectly layered flavours.",
    author: BC, approvedBy: HK, station: "Hot Range",
    yieldText: "~6–8 portions\n(1.2 kg)", prepMinutes: 30, cookMinutes: 45, restMinutes: 10, totalMinutes: 75,
    timeText: { prep: "30 min", cook: "40–45 min", total: "~1 hr 15 min" }, dietary: ["Vegetarian"],
    miseEnPlace: [],
    equipment: ["Baking dish (20×30 cm)", "Saucepan", "Whisk", "Ladle", "Spatula", "Oven"],
    ingredients: [
      ["Soy chunks (textured)", 120, "g", "SOY CHUNKS BOLOGNESE SAUCE"], ["Onion (diced)", 60, "g", "SOY CHUNKS BOLOGNESE SAUCE"], ["Carrot (diced)", 50, "g", "SOY CHUNKS BOLOGNESE SAUCE"],
      ["Celery (diced)", 40, "g", "SOY CHUNKS BOLOGNESE SAUCE"], ["Garlic (chopped)", 10, "g", "SOY CHUNKS BOLOGNESE SAUCE"], ["Tomato passata", 400, "g", "SOY CHUNKS BOLOGNESE SAUCE"],
      ["Tomato paste", 20, "g", "SOY CHUNKS BOLOGNESE SAUCE"], ["Olive oil", 15, "g", "SOY CHUNKS BOLOGNESE SAUCE"], ["Salt", 4, "g", "SOY CHUNKS BOLOGNESE SAUCE"],
      ["Pepper", 1, "g", "SOY CHUNKS BOLOGNESE SAUCE"], ["Dried oregano", 2, "g", "SOY CHUNKS BOLOGNESE SAUCE"],
      ["Butter", 40, "g", "BÉCHAMEL SAUCE"], ["Plain flour", 40, "g", "BÉCHAMEL SAUCE"], ["Milk", 500, "g", "BÉCHAMEL SAUCE"], ["Salt", 4, "g", "BÉCHAMEL SAUCE"], ["Nutmeg", 0.5, "g", "BÉCHAMEL SAUCE"],
      ["Lasagna sheets (oven-ready)", 6, "pcs", "ASSEMBLY"], ["Mozzarella (shredded)", 200, "g", "ASSEMBLY"], ["Parmesan (grated)", 30, "g", "ASSEMBLY"],
    ],
    steps: [
      "Heat oil in a pan; sauté onion, carrot, celery and garlic until soft.",
      "Add soaked and drained soy chunks; cook for 3–4 min.",
      "Add tomato passata, tomato paste, oregano, salt and pepper. Simmer 15–20 min.",
      "Make béchamel: melt butter, add flour; cook 1 min. Gradually whisk in milk. Cook until thick. Season with salt and nutmeg.",
      "In a baking dish, layer: bolognese sauce, sheets, béchamel, mozzarella. Repeat layers. Top with parmesan.",
      "Bake at 180°C for 40–45 min or until golden and bubbling. Rest 10 min before serving.",
    ],
    plating: "Serve one slice per portion.", holding: "Best served fresh.\nNo reheating.", allergens: GW,
    notes: "Rest time: 10 min\nTotal weight (approx.): 1.3 kg",
  },
  {
    photo: "photo-09-stuffed-conchiglioni.jpg", dishCode: "PS-11", title: "Stuffed Conchiglioni",
    description: "Large pasta shells stuffed with a creamy kale–ricotta filling, baked on a bed of garlic pomodoro sauce, finished with parmesan, paprika and seeds.",
    summary: "Creamy, herb and baked to perfection in a rich garlic tomato sauce.",
    author: BC, approvedBy: HK, version: "1.1", station: "Hot Range",
    yieldText: "1 portion\n(5 pcs)", prepMinutes: 15, cookMinutes: 6, restMinutes: 5, totalMinutes: 21, timeText: { prep: "15 min", cook: "6 min", total: "~21 min" }, dietary: ["Vegetarian"],
    miseEnPlace: ["Boil conchiglioni al dente", "Prepare kale–ricotta filling", "Make garlic pomodoro sauce", "Grate parmesan ready"],
    equipment: ["Mixing bowl", "Deck oven / baking dish", "Tongs", "Spoon", "Digital scale"],
    ingredients: [
      ["Ricotta cheese", 250, "g", "FILLING:"], ["Cream cheese", 100, "g", "FILLING:"], ["Blanched kale", 100, "g", "FILLING:"], ["Chopped jalapeño", 30, "g", "FILLING:"],
      ["Salt", 1, "g", "FILLING:"], ["Xanthan gum", null, "pinch", "FILLING:"],
      ["Conchiglioni", 5, "pcs", "ASSEMBLY:"], ["Garlic pomodoro sauce", 150, "g", "ASSEMBLY:"], ["Parmesan", 10, "g", "ASSEMBLY:"], ["Red paprika", 10, "g", "ASSEMBLY:"],
      ["Slit onion", 5, "g", "ASSEMBLY:"], ["Sunflower seeds", 5, "g", "ASSEMBLY:"],
    ],
    steps: [
      "Mix ricotta, cream cheese, blanched kale, chopped jalapeño, salt and xanthan gum into a smooth, well-seasoned filling.",
      "Stuff each boiled conchiglioni generously with the kale–ricotta filling.",
      "Spoon garlic pomodoro sauce as a base in a shallow oven dish.",
      "Arrange stuffed shells on the sauce base.",
      "Sprinkle parmesan and red paprika on top.",
      "Bake at 350°C for 6 min until golden and heated through.",
      "Garnish with slit onion and sunflower seeds.",
    ],
    notes: "Rest time: 5 min",
    plating: "Serve 5 pcs in shallow bowl with sauce base.", holding: "Bake fresh to order.\nNo holding.",
    allergens: "Contains: Gluten, Milk.\nCross-contact: may contain nuts, sesame, soy.",
  },
  {
    photo: "photo-10-caramelised-onion-pasta.jpg", dishCode: "PA-07", title: "Caramelised Onion Pasta",
    description: "A rich and comforting pasta made with sweet caramelised onions, garlic and a creamy umami sauce, finished with chilli crisp, parmesan and fresh parsley for a perfect balance of flavour and heat.",
    summary: "Sweet caramelised onions meet creamy umami with a hint of heat—a simple pasta that feels indulgent and deeply satisfying.",
    author: BC, approvedBy: HK, station: "Sauté Pan",
    yieldText: "1 portion", prepMinutes: 10, cookMinutes: 20, totalMinutes: 30, timeText: { prep: "10 min", cook: "20 min", total: "30 min" }, dietary: ["Vegetarian", "Option to make vegan."],
    miseEnPlace: [],
    equipment: ["Sauté pan", "Sauce pan", "Tongs", "Ladle", "Fine grater", "Chopping board & knife"],
    ingredients: [
      ["Olive oil", 10, "g"], ["Chopped garlic", 5, "g"], ["Caramelised onion", 60, "g"], ["1 ladle water", null, "~60 ml"], ["Spaghetti", 140, "g"], ["Mix seasoning", 4, "g"],
      ["Fresh cream", 80, "g"], ["Soya sauce", 10, "g"], ["Chilli crisp", 10, "g"], ["Parmesan", 10, "g"], ["Parsley", null, "to garnish"],
    ],
    steps: [
      "Heat olive oil in a pan over medium heat.",
      "Add chopped garlic and sauté until fragrant.",
      "Add caramelised onion and cook for 1–2 min.",
      "Add 1 ladle of water; bring to a gentle simmer.",
      "Add spaghetti and mix well to coat.",
      "Add mix seasoning, fresh cream and soya sauce. Toss until pasta is creamy and well combined.",
      "Adjust consistency with water if needed.",
      "Finish with chilli crisp and parmesan. Toss to combine.",
      "Plate and garnish with fresh parsley & mix herbs. Serve immediately.",
    ],
    plating: "Pasta bowl • Serve hot.\nGarnish with parsley, mix herbs, chilli crisp & parmesan.",
    holding: "Best served fresh • Reheat gently with a splash of water or cream.",
    allergens: "Contains: Gluten (wheat), Milk, Soy.\nMay contain traces: Nuts, sesame.",
  },
  {
    photo: "photo-11-pink-burrata-pasta.jpg", dishCode: "CA-P02", title: "Pink Burrata Pasta",
    description: "A vibrant and creamy pasta made with roasted beetroot purée and a rich pesto white sauce. Topped with fresh burrata, crushed pistachios and pumpkin seeds, finished with truffle oil for a delightful balance of colour, flavour and texture.",
    summary: null, author: CC, approvedBy: HUK, station: "Hot Kitchen",
    yieldText: "1 portion", prepMinutes: 15, cookMinutes: 20, totalMinutes: 35, timeText: { prep: "15 min", cook: "20 min", total: "35 min" }, dietary: ["Vegetarian"],
    miseEnPlace: [],
    equipment: ["Sauce pan", "Sauté pan", "Blender", "Pasta pot", "Strainer", "Mixing spoon / tongs", "Ladle", "Fine grater", "Chef's knife", "Baking tray", "Aluminium foil"],
    ingredients: [
      ["Beetroot paste", 30, "g", "PASTA & SAUCE"], ["Farfalle pasta", 120, "g", "PASTA & SAUCE"], ["Pesto white base sauce", 50, "g", "PASTA & SAUCE"], ["Salt", 3, "g", "PASTA & SAUCE"],
      ["Black pepper", 1, "g", "PASTA & SAUCE"], ["Parmesan", 8, "g", "PASTA & SAUCE"], ["Chilli flakes", 3, "g", "PASTA & SAUCE"], ["Butter", 20, "g", "PASTA & SAUCE"],
      ["Burrata (smashed)", 1, "dollop", "GARNISH"], ["Pumpkin seeds & pistachios (crushed & mixed)", 5, "g", "GARNISH"], ["Olive oil", 5, "g", "GARNISH"], ["Crushed black pepper", 2, "g", "GARNISH"],
    ],
    steps: [
      "Roast beetroot with olive oil wrapped in foil paper. Once roasted, strain and blend into a purée.",
      "Heat a pan. Add pesto white sauce.",
      "Add farfalle pasta. Season with black pepper, chilli flakes, butter, and salt. Mix well.",
      "Add beetroot purée and toss until the sauce turns pink.",
      "Plate. Garnish with smashed burrata, pesto dollop, pumpkin seeds, pistachios, olive oil & black pepper.",
    ],
    qualityCheck: ["Sauce vibrant pink", "Pasta well-coated", "Burrata fresh and creamy", "Garnish evenly distributed"],
    plating: KITCHEN_PLATING, holding: KITCHEN_HOLD, allergens: "Dairy, Nuts",
    notes: "CHEF'S TIP\nRoast beetroot until tender and sweet for the best colour and flavour. Adjust beetroot paste to achieve your desired pink hue.",
  },
  {
    photo: "photo-12-tomato-butter-risotto.jpg", dishCode: "CA-R01", title: "Tomato Butter Risotto",
    description: "A creamy tomato risotto cooked in a rich butter base, finished with Parmesan and topped with confit cherry tomatoes, basil pesto, arugula and kalonji for a vibrant and comforting dish.",
    summary: null, author: CC, approvedBy: HUK, station: "Hot Kitchen",
    yieldText: "1 portion", prepMinutes: 15, cookMinutes: 30, totalMinutes: 45, timeText: { prep: "15 min", cook: "30 min", total: "45 min" }, dietary: ["Vegetarian"],
    miseEnPlace: [],
    equipment: ["Sauce pan", "Wooden spoon", "Ladle", "Measuring cups", "Measuring spoons", "Chef's knife", "Chopping board", "Grater", "Tongs"],
    ingredients: [
      ["Olive oil", 10, "g", "RISOTTO"], ["Garlic", 5, "g", "RISOTTO"], ["Onion", 5, "g", "RISOTTO"], ["Pomodoro sauce", 90, "g", "RISOTTO"], ["Water", 50, "ml", "RISOTTO"], ["Salt", 3, "g", "RISOTTO"],
      ["Black pepper", 2, "g", "RISOTTO"], ["Risotto rice", 100, "g", "RISOTTO"], ["Parmesan", 10, "g", "RISOTTO"], ["Butter", 20, "g", "RISOTTO"],
      ["Confit cherry tomatoes", 5, "g", "GARNISH"], ["Pesto dollop", 5, "g", "GARNISH"], ["Arugula", 5, "pieces", "GARNISH"], ["Kalonji (chopped)", 1, "g", "GARNISH"],
    ],
    steps: [
      "Heat olive oil in a pan. Add garlic and onion and sauté until softened.",
      "Add pomodoro sauce, water, salt, and black pepper. Stir well.",
      "Add risotto rice and butter. Cook well, stirring frequently. Finish with Parmesan.",
      "Plate and garnish with confit cherry tomatoes, a pesto dollop, arugula, and chopped kalonji.",
    ],
    qualityCheck: ["Rice cooked through but not mushy", "Sauce glossy and rich", "Garnishes fresh", "Served hot"],
    plating: KITCHEN_PLATING, holding: KITCHEN_HOLD, allergens: "Dairy, Gluten",
    notes: "CHEF'S TIP\nStir the risotto frequently and add water gradually to release starch for a creamy texture. Use good quality pomodoro sauce for best flavour.",
  },
  {
    photo: "photo-13-truffle-mac-cheese.jpg", dishCode: "CA-P01", title: "Truffle Mac & Cheese (Pasta)",
    description: "A luxurious baked pasta with a rich, creamy cheese sauce, finished with truffle oil and truffle pâté for an indulgent aroma and golden crust. Comforting, cheesy and deeply satisfying.",
    summary: "Creamy, cheesy and topped with a golden crust—this truffle mac & cheese is pure indulgence in every bite.",
    author: CC, approvedBy: HUK, station: "Hot Kitchen",
    yieldText: "1 portion", prepMinutes: 10, cookMinutes: 20, totalMinutes: 30, timeText: { prep: "10 min", cook: "20 min", total: "30 min" }, dietary: ["Vegetarian"],
    miseEnPlace: [],
    equipment: ["Sauce pan", "Sauté pan", "Oven (deck / convection)", "Ladle", "Tongs", "Fine grater", "Mixing spoon", "Steel plate / baking dish"],
    ingredients: [
      ["Macaroni pasta", 100, "g"], ["Béchamel sauce", 50, "g"], ["Cheddar cheese", 30, "g"], ["Mozzarella cheese", 20, "g"], ["Salt", 3, "g"], ["Black pepper", 1, "g"],
      ["Parmesan", 8, "g"], ["Butter", 20, "g"],
      ["Cheddar cheese", 5, "g", "BEFORE OVEN — TOPPING"], ["Mozzarella cheese", 5, "g", "BEFORE OVEN — TOPPING"], ["Parmesan", 5, "g", "BEFORE OVEN — TOPPING"],
      ["Truffle oil", 3, "g", "GARNISH"], ["Truffle pâté", 3, "g", "GARNISH"], ["Spring onion", 0.5, "piece", "GARNISH"],
    ],
    steps: [
      "Heat a pan. Add béchamel sauce, cheddar cheese, and mozzarella cheese. Melt together.",
      "Add boiled pasta and mix well. Season with salt and black pepper. Add parmesan and butter.",
      "Transfer into a steel plate. Top with cheddar cheese, mozzarella cheese, and parmesan. Bake in oven.",
      "Remove from oven. Garnish with truffle oil, truffle pâté, and spring onion.",
    ],
    qualityCheck: ["Pasta al dente", "Sauce creamy and well-coated", "Cheese golden on top", "Truffle aroma present"],
    plating: "Serve immediately while hot. Do not hold after plating.", holding: "Best enjoyed fresh. Not suitable for holding.", allergens: "Dairy, Gluten",
    notes: "CHEF'S TIP\nFor extra depth, finish with a few drops of truffle oil just before serving.",
  },
];

const slugify = (s: string) => s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function main() {
  const brand = await db.brand.findUniqueOrThrow({ where: { slug: "capiche" } });
  const category = await db.category.findUniqueOrThrow({ where: { brandId_slug: { brandId: brand.id, slug: "pasta" } } });
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
      prepMinutes: d.prepMinutes,
      cookMinutes: d.cookMinutes,
      restMinutes: d.restMinutes ?? null,
      totalMinutes: d.totalMinutes,
      servings: 1,
      yieldText: d.yieldText,
      course: "Pasta",
      dietary: d.dietary,
      equipment: d.equipment,
      notes: d.notes ?? null,
      dishCode: d.dishCode,
      author: d.author,
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
      customFields: { ...(d.timeText ? { timeText: d.timeText } : {}), ...(d.garnish?.length ? { garnish: d.garnish } : {}) },
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
