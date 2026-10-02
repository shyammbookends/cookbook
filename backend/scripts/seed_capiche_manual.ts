/**
 * Adds the 18 recipes of "Capiche_Bookends_Category_Format_Recipe_Manual_One_Page_Each_FINAL.pdf"
 * (one recipe per page) to their Capiche categories, in the site's own card designs:
 *   page 1 → Appetiser, 2–5 → Pasta, 6–13 → Pizza, 14–16 → Drinks, 17–18 → Desserts.
 * Photos live in backend/data/capiche-mix/photo-NN-*.jpg (one per page, taken from the PDF).
 * Idempotent: recipes are matched on (brand, externalId = "MX-NN") and updated in place.
 *
 * Run: npx tsx --conditions=react-server --tsconfig tsconfig.json backend/scripts/seed_capiche_manual.ts
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/server/db";
import { uploadImage } from "@/server/media/upload";
import { RecipeInputSchema } from "@/lib/schemas/recipe";
import { Prisma } from "@/generated/prisma/client";

const IMAGE_DIR = path.join(process.cwd(), "backend/data/capiche-mix");

type Ing = [name: string, quantity: number | null, unit: string, groupLabel?: string];
type Stat = { label: string; value: string; icon: "tag" | "pot" | "user" | "leaf" | "snow" | "clock" | "cup" | "ice" };

interface Dish {
  page: number;
  photo: string;
  category: "appetiser" | "pasta" | "pizza" | "drinks" | "desserts";
  title: string;
  subtitle?: string;
  summary?: string;
  station?: string;
  yieldText: string;
  dietary: string[];
  stats: Stat[];
  miseEnPlace: string[];
  ingredients: Ing[];
  /** "SECTION TITLE::step text" starts a new titled method section (numbering restarts). */
  steps: string[];
  plating?: string;
  allergens?: string;
  notes?: string;
  /** Extra Desserts / Drinks card fields (lib/sop/dessert.ts). */
  card?: Record<string, unknown>;
}

const AUTHOR = "Bookends Culinary";
const APPROVED = "Husen Khan";
const EFFECTIVE = "2026-08-24";
const NEXT_REVIEW = "2027-08-24";

const JAIN = ["Jain Vegetarian"];
const VEG = ["Vegetarian"];
const GW_MILK = "Contains: Gluten (wheat), Milk.";

const DISHES: Dish[] = [
  // ───────────── page 1 · Appetiser ─────────────
  {
    page: 1, photo: "photo-01-parmesan-truffle-fries.jpg", category: "appetiser", title: "Parmesan Truffle Fries",
    summary: "Hot • Crisp • Truffle-Forward", station: "Fryer", yieldText: "1 Portion", dietary: VEG,
    stats: [
      { label: "Category", value: "Gourmet Sides", icon: "tag" },
      { label: "Yield", value: "1 Portion", icon: "user" },
      { label: "Cook temp", value: "160°C", icon: "pot" },
      { label: "Dietary", value: "Vegetarian", icon: "leaf" },
    ],
    miseEnPlace: ["Fries (potato) 180 g", "Butter 20 g", "Parmesan Cheese 7.5 g", "Truffle Oil 2 g", "Truffle Pate 3 g", "Parsley, chopped 3 g", "Garlic Ranch Dip as required"],
    ingredients: [
      ["Fries (potato)", 180, "g"], ["Butter", 20, "g"], ["Parmesan Cheese", 7.5, "g"], ["Truffle Oil", 2, "g"], ["Truffle Pate", 3, "g"], ["Parsley, chopped", 3, "g"],
      ["Garlic Ranch Dip", null, "as required", "GARNISH"],
    ],
    steps: [
      "Take 180 g fries and microwave for 2 minutes to soften slightly and speed up the cooking process.",
      "Fry the potatoes at 160°C until cooked through and lightly crisp.",
      "Remove from the fryer and place on tissue paper to absorb excess oil.",
      "In a mixing bowl, melt the butter. Add the fries and toss properly until evenly coated.",
      "Add Parmesan cheese, chopped parsley, and truffle oil. Toss again gently so every fry is evenly coated.",
      "Plate the fries neatly.",
      "Garnish with small dots or spoonfuls of truffle pate on top.",
      "Serve immediately with garlic ranch dip on the side.",
    ],
    plating: "Plate the fries neatly. Garnish with truffle pate and serve immediately with garlic ranch dip on the side.",
    allergens: "Contains: Milk.",
  },
  // ───────────── pages 2–5 · Pasta ─────────────
  {
    page: 2, photo: "photo-02-mushroom-risotto.jpg", category: "pasta", title: "Mushroom Risotto",
    summary: "Creamy • Earthy • Mushroom", station: "Hot Range", yieldText: "1 Portion", dietary: VEG,
    stats: [{ label: "Yield", value: "1 Portion", icon: "user" }, { label: "Dietary", value: "Vegetarian", icon: "leaf" }],
    miseEnPlace: ["Arborio Rice 100 g", "Chopped Mushrooms (Duxelles) 100 g", "Béchamel Sauce 50 g", "Butter 20 g", "Parmesan Cheese 7 g", "Salt to taste", "Black Pepper to taste", "Water as required", "Slit Onion as required", "Sautéed Mushroom Slices as required", "Shimeji Mushroom as required"],
    ingredients: [
      ["Arborio Rice", 100, "g"], ["Chopped Mushrooms (Duxelles)", 100, "g"], ["Béchamel Sauce", 50, "g"], ["Butter", 20, "g"], ["Parmesan Cheese", 7, "g"],
      ["Salt", null, "to taste"], ["Black Pepper", null, "to taste"], ["Water", null, "as required"],
      ["Slit Onion", null, "as required", "GARNISH"], ["Sautéed Mushroom Slices", null, "as required", "GARNISH"], ["Shimeji Mushroom", null, "as required", "GARNISH"],
    ],
    steps: [
      "Heat a pan and add the mushroom duxelles, water, butter, salt, and black pepper. Cook for 1-2 minutes.",
      "Add the Arborio rice. Stir well and cook until the rice becomes creamy and tender.",
      "Add the béchamel sauce and Parmesan cheese. Mix thoroughly and cook for another 2 minutes.",
      "Adjust seasoning if required.",
      "Transfer the risotto to a serving plate.",
      "Garnish with slit onion, sautéed mushroom slices, and shimeji mushroom.",
    ],
    plating: "Transfer to a serving plate and garnish with slit onion, sautéed mushroom slices, and shimeji mushroom.",
    allergens: GW_MILK,
  },
  {
    page: 3, photo: "photo-03-baked-spicy-tomato-cream-macaroni-jain.jpg", category: "pasta", title: "Baked Spicy Tomato Cream Macaroni (Jain)",
    summary: "Baked • Spicy • Tomato Cream", station: "Hot Range", yieldText: "1 Portion", dietary: JAIN,
    stats: [{ label: "Yield", value: "1 Portion", icon: "user" }, { label: "Dietary", value: "Jain Vegetarian", icon: "leaf" }],
    miseEnPlace: ["Macaroni (Boiled) 80 g", "Orange Sauce 120 g", "Gochujang Paste 15 g", "Tomato Paste 12 g", "Butter 10 g", "Fresh Cream 10 g", "Hot Sauce 5 g", "Salt 2 g", "Black Pepper 1 g", "Mozzarella Cheese 30 g", "Parmesan Cheese 7 g", "Fresh Basil Leaves as required"],
    ingredients: [
      ["Macaroni (Boiled)", 80, "g"], ["Orange Sauce", 120, "g"], ["Gochujang Paste", 15, "g"], ["Tomato Paste", 12, "g"], ["Butter", 10, "g"], ["Fresh Cream", 10, "g"],
      ["Hot Sauce", 5, "g"], ["Salt", 2, "g"], ["Black Pepper", 1, "g"],
      ["Mozzarella Cheese", 30, "g", "TOPPING"], ["Parmesan Cheese", 7, "g", "TOPPING"],
      ["Fresh Basil Leaves", null, "as required", "GARNISH"],
    ],
    steps: [
      "Heat a pan over medium flame.",
      "Add orange sauce, gochujang paste and tomato paste. Cook for 1-2 minutes.",
      "Add fresh cream, hot sauce, salt, pepper and butter. Mix well.",
      "Add boiled macaroni and toss until coated.",
      "Transfer to a baking dish.",
      "Top with mozzarella and parmesan cheese.",
      "Bake for 5-7 minutes until golden.",
      "Garnish with basil leaves and serve hot.",
    ],
    plating: "Serve hot in the baking dish or transfer carefully. Finish with fresh basil leaves.",
    allergens: GW_MILK,
  },
  {
    page: 4, photo: "photo-04-cacio-e-pepe-jain.jpg", category: "pasta", title: "Cacio e Pepe (Jain)",
    summary: "Truffle • Pepper • Silky", station: "Hot Range", yieldText: "1 Portion", dietary: JAIN,
    stats: [
      { label: "Category", value: "Italian / Pasta", icon: "tag" },
      { label: "Yield", value: "1 Portion", icon: "user" },
      { label: "Portion", value: "1 Bowl", icon: "user" },
      { label: "Style", value: "Truffle Cacio e Pepe", icon: "pot" },
      { label: "Dietary", value: "Jain Vegetarian", icon: "leaf" },
    ],
    miseEnPlace: ["Spaghetti 190 g", "Water 60 g", "Black Pepper 1 g", "Butter 20 g", "Salt 2 g", "Parmesan 10 g", "Truffle Oil as required", "Truffle Pate as required"],
    ingredients: [
      ["Spaghetti", 190, "g"], ["Water", 60, "g"], ["Black Pepper", 1, "g"], ["Butter", 20, "g"], ["Salt", 2, "g"], ["Parmesan", 10, "g"],
      ["Truffle Oil", null, "as required", "GARNISH"], ["Truffle Pate", null, "as required", "GARNISH"],
    ],
    steps: [
      "Heat a pan.",
      "Add freshly crushed black pepper and roast lightly until aromatic.",
      "Add water and bring to a simmer.",
      "Add cooked spaghetti and toss properly.",
      "Add butter and toss hard until a smooth emulsion forms.",
      "Add truffle oil off heat.",
      "Add parmesan cheese and toss again until evenly coated.",
      "Plate and add truffle pate as garnish.",
    ],
    plating: "Plate immediately and finish with truffle pate. Serve while the emulsion is silky and glossy.",
    allergens: GW_MILK,
    notes: "Chef's Note: Toss the spaghetti vigorously off the heat once parmesan is added - this creates the silky, glossy emulsion.",
  },
  {
    page: 5, photo: "photo-05-lemon-mascarpone-spaghetti-jain.jpg", category: "pasta", title: "Lemon Mascarpone Spaghetti (Jain)",
    summary: "Creamy • Lemon • Mascarpone", station: "Hot Range", yieldText: "1 Portion", dietary: JAIN,
    stats: [{ label: "Yield", value: "1 Portion", icon: "user" }, { label: "Dietary", value: "Jain Vegetarian", icon: "leaf" }],
    miseEnPlace: ["White Sauce 100 g", "Mascarpone Cheese 40 g", "Butter 20 g", "Boiled Spaghetti 140 g", "Parmesan Cheese 7 g", "Lemon Juice 5 ml", "Julienned Basil Leaves as required", "Herb Breadcrumbs 3 g", "Green Garlic 3 g"],
    ingredients: [
      ["White Sauce", 100, "g"], ["Mascarpone Cheese", 40, "g"], ["Butter", 20, "g"], ["Boiled Spaghetti", 140, "g"], ["Parmesan Cheese", 7, "g"], ["Lemon Juice", 5, "ml"],
      ["Julienned Basil Leaves", null, "as required"],
      ["Herb Breadcrumbs", 3, "g", "GARNISH"], ["Green Garlic", 3, "g", "GARNISH"],
    ],
    steps: [
      "Heat a sauté pan over medium heat.",
      "Add white sauce, mascarpone, butter, lemon juice, salt and pepper.",
      "Stir until smooth and creamy.",
      "Add boiled spaghetti and toss well.",
      "Add Parmesan cheese and julienned basil leaves; cook for 1-2 minutes.",
      "Plate the pasta.",
      "Garnish with herb breadcrumbs and chopped green garlic.",
    ],
    plating: "Plate the pasta and garnish with herb breadcrumbs and chopped green garlic.",
    allergens: GW_MILK,
  },
  // ───────────── pages 6–13 · Pizza ─────────────
  {
    page: 6, photo: "photo-06-deadpool-pizza-jain.jpg", category: "pizza", title: "Deadpool Pizza (Jain)",
    summary: "Sweet, spicy, briny.", yieldText: '1 Pizza (11")', dietary: JAIN,
    stats: [
      { label: "Yield", value: '1 Pizza (11")', icon: "user" }, { label: "Portion", value: "6 Slices", icon: "user" },
      { label: "Bake", value: "Two-Stage", icon: "pot" }, { label: "Dietary", value: "Jain Vegetarian", icon: "leaf" },
    ],
    miseEnPlace: ["Pizza Dough 180 g", "Pomodoro Sauce 60 g", "Mozzarella Cheese 60 g", "Jalapeno 10 g", "Onion 10 g", "Kalamata Olive 20 g", "Pineapple Jam 20 g"],
    ingredients: [["Pizza Dough", 180, "g"], ["Pomodoro Sauce", 60, "g"], ["Mozzarella Cheese", 60, "g"], ["Jalapeno", 10, "g"], ["Onion", 10, "g"], ["Kalamata Olive", 20, "g"], ["Pineapple Jam", 20, "g"]],
    steps: [
      "Stretch the dough into an 11-inch pizza base.",
      "Spread the pomodoro sauce evenly, leaving a small border around the edge.",
      "Add mozzarella cheese evenly over the sauce.",
      "Top with jalapeno, onion, and black olive.",
      "Bake the pizza in a preheated oven until it reaches half bake stage.",
      "Remove the pizza from the oven and add pineapple jam in small dollops evenly across the pizza, approximately one dollop per slice area.",
      "Return the pizza to the oven and continue baking until the crust is fully cooked, cheese is melted, and the edges are nicely caramelized.",
      "Remove from the oven, cut into 6 slices, and serve hot.",
    ],
    plating: "Cut into 6 slices and serve hot.", allergens: GW_MILK,
    notes: "Chef's Note: The two-stage bake keeps the pineapple jam from caramelizing too early and preserves its bright sweetness.",
  },
  {
    page: 7, photo: "photo-07-rubirosa-pizza-jain.jpg", category: "pizza", title: "Rubirosa Pizza (Jain)",
    summary: "Spicy, pesto spiral.", yieldText: "1 Pizza", dietary: JAIN,
    stats: [
      { label: "Yield", value: "1 Pizza", icon: "user" }, { label: "Portion", value: "8 Slices", icon: "user" },
      { label: "Dough", value: "180 g", icon: "pot" }, { label: "Dietary", value: "Jain Vegetarian", icon: "leaf" },
    ],
    miseEnPlace: ["Pizza Dough 180 g", "Spicy Pomodoro Sauce 60 g", "Buffalo Mozzarella 50 g", "Pesto 8 g", "Sriracha Sauce 3 g", "Pomodoro Sauce 45 g", "Olive Oil 5 g", "Spicy Pesto as required"],
    ingredients: [
      ["Pizza Dough", 180, "g"], ["Spicy Pomodoro Sauce", 60, "g"], ["Buffalo Mozzarella", 50, "g"], ["Pesto", 8, "g"], ["Sriracha Sauce", 3, "g"], ["Pomodoro Sauce", 45, "g"], ["Olive Oil", 5, "g"],
      ["Spicy Pesto", null, "as required", "GARNISH"],
    ],
    steps: [
      "Take the pizza dough and stretch it evenly into the desired pizza size.",
      "Mix pesto and sriracha sauce into the spicy pomodoro sauce to create the orange sauce.",
      "Apply the orange sauce evenly all over the pizza base, leaving the edges for crust.",
      "Add buffalo mozzarella evenly across the pizza.",
      "Add pomodoro sauce dollops on top.",
      "Drizzle olive oil lightly over the pizza.",
      "Bake in a preheated pizza oven until the crust is cooked perfectly and the cheese is melted.",
      "Remove from the oven and garnish with spicy pesto in a circular motion.",
      "Cut into 8 slices and serve hot.",
    ],
    plating: "Finish with the signature spicy pesto spiral, cut into 8 slices, and serve hot.", allergens: GW_MILK,
    notes: "Plating Note: Pipe the spicy pesto in a continuous spiral from the center outward for the signature Rubirosa look.",
  },
  {
    page: 8, photo: "photo-08-truffle-fun-guy-pizza.jpg", category: "pizza", title: "Truffle Fun-Guy Pizza",
    summary: "Mushroom, truffle, chilli crisp.", yieldText: "1 Small Pizza", dietary: VEG,
    stats: [
      { label: "Yield", value: "1 Small Pizza", icon: "user" }, { label: "Portion", value: "6 Slices", icon: "user" },
      { label: "Oven temp", value: "340°C", icon: "pot" }, { label: "Dietary", value: "Vegetarian", icon: "leaf" },
    ],
    miseEnPlace: [
      "# Duxelle Sauce", "Button Mushrooms (sauteed) 100 g", "Bechamel Sauce 50 g", "Chopped Garlic 10 g", "Butter 10 g", "Salt to taste", "Black Pepper to taste",
      "# Pizza", "Small Pizza Dough/Base 1 nos", "Creamy Duxelle Sauce 70 g", "Mozzarella Cheese 60 g", "Parmesan Cheese 5 g", "Button Mushrooms (sauteed) 40 g", "Shimeji Mushrooms (sauteed) 10 g",
      "# Garnish & Presentation", "Pesto 10 g", "Edible Flowers 2 pcs", "Truffle Oil 2 g", "Truffle Pate 2 g", "Chilli Crisp 5 g",
    ],
    ingredients: [
      ["Button Mushrooms (sauteed)", 100, "g", "DUXELLE SAUCE"], ["Bechamel Sauce", 50, "g", "DUXELLE SAUCE"], ["Chopped Garlic", 10, "g", "DUXELLE SAUCE"], ["Butter", 10, "g", "DUXELLE SAUCE"],
      ["Salt", null, "to taste", "DUXELLE SAUCE"], ["Black Pepper", null, "to taste", "DUXELLE SAUCE"],
      ["Small Pizza Dough/Base", 1, "nos", "PIZZA"], ["Creamy Duxelle Sauce", 70, "g", "PIZZA"], ["Mozzarella Cheese", 60, "g", "PIZZA"], ["Parmesan Cheese", 5, "g", "PIZZA"],
      ["Button Mushrooms (sauteed)", 40, "g", "PIZZA"], ["Shimeji Mushrooms (sauteed)", 10, "g", "PIZZA"],
      ["Pesto", 10, "g", "GARNISH & PRESENTATION"], ["Edible Flowers", 2, "pcs", "GARNISH & PRESENTATION"], ["Truffle Oil", 2, "g", "GARNISH & PRESENTATION"],
      ["Truffle Pate", 2, "g", "GARNISH & PRESENTATION"], ["Chilli Crisp", 5, "g", "GARNISH & PRESENTATION"],
    ],
    steps: [
      "DUXELLE METHOD::Saute the whole button mushrooms until all moisture evaporates.",
      "Season with salt and black pepper.",
      "Blend the bechamel sauce, chopped garlic, and sauteed mushrooms together.",
      "Add butter (10 g) and blend until smooth.",
      "Cool and reserve for pizza assembly.",
      "ASSEMBLY::Roll out the small pizza dough and spread creamy duxelle sauce evenly over the base.",
      "Top with mozzarella and Parmesan cheese.",
      "Add the roasted sliced button mushrooms and sauteed shimeji mushrooms.",
      "Bake in a preheated oven at 340°C until golden and cooked.",
      "Remove from the oven and place on a serving plate.",
      "Cut into 6 equal slices.",
      "FINISHING::Dot 10 g pesto around the pizza.",
      "Drizzle 2 g truffle oil over the top.",
      "Add 2 g truffle pate.",
      "Spoon 5 g chilli crisp evenly across the pizza.",
      "Finish with 2 edible flowers.",
    ],
    plating: "Cut into 6 equal slices. Finish with pesto, truffle oil, truffle pate, chilli crisp and 2 edible flowers.", allergens: GW_MILK,
  },
  {
    page: 9, photo: "photo-09-upside-down-pizza.jpg", category: "pizza", title: "Upside Down Pizza",
    summary: "Cheesy, pomodoro dollops.", yieldText: '1 Pizza (11")', dietary: VEG,
    stats: [
      { label: "Yield", value: '1 Pizza (11")', icon: "user" }, { label: "Portion", value: "6 Slices", icon: "user" },
      { label: "Bake", value: "Two-Stage", icon: "pot" }, { label: "Dietary", value: "Vegetarian", icon: "leaf" },
    ],
    miseEnPlace: ["Pizza Dough 180 g", "Pesto White Sauce + Chopped Garlic 50 g", "Mozzarella, Grated 60 g", "Pomodoro Sauce 60 g", "Basil, Julienne 3 g"],
    ingredients: [["Pizza Dough", 180, "g"], ["Pesto White Sauce + Chopped Garlic", 50, "g"], ["Mozzarella, Grated", 60, "g"], ["Pomodoro Sauce", 60, "g"], ["Basil, Julienne", 3, "g"]],
    steps: [
      "Stretch the dough into an 11-inch base.",
      "Mix chopped garlic into the pesto white sauce.",
      "Spread the pesto white sauce evenly on the pizza base, leaving a small border.",
      "Add grated mozzarella cheese evenly over the sauce.",
      "Bake for a half bake until the base starts setting and the cheese begins melting.",
      "Remove from the oven and add pomodoro sauce in dollops across the pizza.",
      "Return to the oven and continue baking until fully cooked with a crisp base and properly caramelized cheese.",
      "Cut into six slices.",
      "Finish with julienne basil as garnish.",
    ],
    plating: "Cut into 6 slices and finish with julienne basil.", allergens: GW_MILK,
    notes: "Chef's Note: The upside down technique reverses the usual order: cheese goes on first while pomodoro sauce sits in vivid dollops on top.",
  },
  {
    page: 10, photo: "photo-10-fiyah-fiyah-pizza-jain.jpg", category: "pizza", title: "Fiyah Fiyah Pizza (Jain)",
    summary: "Extra hot, ghost pepper.", yieldText: '1 Pizza (11")', dietary: JAIN,
    stats: [
      { label: "Yield", value: '1 Pizza (11")', icon: "user" }, { label: "Portion", value: "6 Slices", icon: "user" },
      { label: "Spice level", value: "Extra Hot", icon: "pot" }, { label: "Dietary", value: "Jain Vegetarian", icon: "leaf" },
    ],
    miseEnPlace: ["Pizza Dough 180 g", "Pomodoro Sauce 60 g", "Mozzarella, Grated 60 g", "Green Chilli, Chopped 4 g", "Red Paprika Slices 6 g", "Jalapenos 12 g", "Ghost Pepper 0.75 g", "Olive Oil 6 g"],
    ingredients: [["Pizza Dough", 180, "g"], ["Pomodoro Sauce", 60, "g"], ["Mozzarella, Grated", 60, "g"], ["Green Chilli, Chopped", 4, "g"], ["Red Paprika Slices", 6, "g"], ["Jalapenos", 12, "g"], ["Ghost Pepper", 0.75, "g"], ["Olive Oil", 6, "g"]],
    steps: [
      "Stretch the dough into an 11-inch pizza base.",
      "Spread pomodoro sauce evenly across the base, leaving a small border.",
      "Add mozzarella cheese evenly.",
      "Top with green chilli, red paprika slices, jalapenos, and ghost pepper carefully.",
      "Drizzle olive oil lightly over the toppings.",
      "Bake until the crust is crisp and the cheese is fully melted with slight roasting on the chillies.",
      "Remove from the oven, cut into 6 slices, and serve.",
    ],
    plating: "Cut into 6 slices and serve. Inform guests of the heat level.", allergens: GW_MILK,
    notes: "Allergen / Spice Caution: Contains ghost pepper, one of the hottest chillies available. Handle with gloves and inform guests of the heat level.",
  },
  {
    page: 11, photo: "photo-11-cupid-pizza.jpg", category: "pizza", title: "Cupid Pizza",
    summary: "Themed, beetroot, pesto heart.", yieldText: "1 Small Pizza", dietary: VEG,
    stats: [
      { label: "Yield", value: "1 Small Pizza", icon: "user" }, { label: "Portion", value: "6 Slices", icon: "user" },
      { label: "Oven temp", value: "340°C", icon: "pot" }, { label: "Dietary", value: "Vegetarian", icon: "leaf" },
    ],
    miseEnPlace: ["Pizza Dough 180 g", "Buffalo Mozzarella Cheese 60 g", "Orange Sauce 60 g", "Fresh Cream 10 g", "Beetroot Paste 50 g", "Pesto (Heart-Shaped Garnish) 10 g"],
    ingredients: [
      ["Pizza Dough", 180, "g"], ["Buffalo Mozzarella Cheese", 60, "g"], ["Orange Sauce", 60, "g"],
      ["Fresh Cream", 10, "g", "BEETROOT MIX"], ["Beetroot Paste", 50, "g", "BEETROOT MIX"],
      ["Pesto (Heart-Shaped Garnish)", 10, "g", "GARNISH"],
    ],
    steps: [
      "Stretch the pizza dough into a small pizza base.",
      "Add dollops of orange sauce and beetroot sauce evenly over the base.",
      "Top with buffalo mozzarella cheese.",
      "Bake in a preheated oven at 340°C until the crust is golden and the cheese is melted.",
      "Remove from the oven and cut into 6 slices.",
      "Plate the pizza neatly.",
      "Garnish with a heart-shaped pesto design before serving.",
    ],
    plating: "Plate neatly and garnish with a heart-shaped pesto design before serving.", allergens: GW_MILK,
  },
  {
    page: 12, photo: "photo-12-tokyo-margherita-pizza-jain.jpg", category: "pizza", title: "Tokyo Margherita Pizza (Jain)",
    summary: "Smoked cheese, gochugaru.", yieldText: "1 Small Pizza", dietary: JAIN,
    stats: [
      { label: "Yield", value: "1 Small Pizza", icon: "user" }, { label: "Portion", value: "6 Slices", icon: "user" },
      { label: "Oven temp", value: "340°C", icon: "pot" }, { label: "Dietary", value: "Jain Vegetarian", icon: "leaf" },
    ],
    miseEnPlace: ["Small Pizza Dough 180 g", "Pomodoro Sauce 60 g", "Smoked Mozzarella Cheese 30 g", "Cheddar Cheese 30 g", "Parmesan Cheese 5 g", "Sea Salt a pinch", "Fresh Basil Leaves as required", "Citric Acid a pinch", "Gochugaru (Korean Red Chili Flakes) a pinch"],
    ingredients: [
      ["Small Pizza Dough", 180, "g"], ["Pomodoro Sauce", 60, "g"], ["Smoked Mozzarella Cheese", 30, "g"], ["Cheddar Cheese", 30, "g"], ["Parmesan Cheese", 5, "g"], ["Sea Salt", null, "a pinch"],
      ["Fresh Basil Leaves", null, "as required", "GARNISH & FINISHING"], ["Citric Acid", null, "a pinch", "GARNISH & FINISHING"], ["Gochugaru (Korean Red Chili Flakes)", null, "a pinch", "GARNISH & FINISHING"],
    ],
    steps: [
      "Stretch the pizza dough into a small pizza base.",
      "Spread the pomodoro sauce evenly over the base.",
      "Top with smoked mozzarella cheese, cheddar cheese, and Parmesan cheese.",
      "Sprinkle a pinch of sea salt.",
      "Bake in a preheated oven at 340°C until the crust is golden and the cheese is melted.",
      "Remove from the oven and cut into 6 slices.",
      "Plate the pizza neatly.",
      "Garnish with fresh basil leaves, citric acid, and gochugaru.",
    ],
    plating: "Plate neatly and garnish with fresh basil leaves, citric acid and gochugaru immediately after baking.", allergens: GW_MILK,
    notes: "Critical Control Points (CCP): Oven must be fully preheated to 340°C for proper crust expansion and charring. Apply garnish immediately after baking.",
  },
  {
    page: 13, photo: "photo-13-cheese-chilli-garlic-pizza.jpg", category: "pizza", title: "Cheese Chilli Garlic Pizza",
    summary: "Cheesy, garlic, chilli.", yieldText: "1 Small Pizza", dietary: VEG,
    stats: [
      { label: "Yield", value: "1 Small Pizza", icon: "user" }, { label: "Portion", value: "6 Slices", icon: "user" },
      { label: "Cook time", value: "5-7 Mins", icon: "pot" }, { label: "Dietary", value: "Vegetarian", icon: "leaf" },
    ],
    miseEnPlace: [
      "# Sauce", "Béchamel Sauce 100 g", "Confit Garlic 10 g",
      "# Pizza", "Small Pizza Base 1 nos", "Sesame Seeds as required", "Mozzarella Cheese 40 g", "Cheddar Cheese 30 g", "Parmesan Cheese 5 g", "Green Chilli (finely sliced) 5 g", "Garlic Slices 25 g", "Oregano 3 g",
      "# Garnish", "Garlic Hot Honey 2 g", "Red Paprika (chopped) 10 g", "Green Garlic (finely chopped) 10 g",
      "# Garlic Hot Honey", "Hot Honey 100 g", "Garlic Paste 30 g",
    ],
    ingredients: [
      ["Béchamel Sauce", 100, "g", "SAUCE"], ["Confit Garlic", 10, "g", "SAUCE"],
      ["Small Pizza Base", 1, "nos", "PIZZA"], ["Sesame Seeds", null, "as required", "PIZZA"], ["Mozzarella Cheese", 40, "g", "PIZZA"], ["Cheddar Cheese", 30, "g", "PIZZA"],
      ["Parmesan Cheese", 5, "g", "PIZZA"], ["Green Chilli (finely sliced)", 5, "g", "PIZZA"], ["Garlic Slices", 25, "g", "PIZZA"], ["Oregano", 3, "g", "PIZZA"],
      ["Garlic Hot Honey", 2, "g", "GARNISH"], ["Red Paprika (chopped)", 10, "g", "GARNISH"], ["Green Garlic (finely chopped)", 10, "g", "GARNISH"],
      ["Hot Honey", 100, "g", "GARLIC HOT HONEY"], ["Garlic Paste", 30, "g", "GARLIC HOT HONEY"],
    ],
    steps: [
      "Prepare the sauce by blending confit garlic with béchamel sauce until smooth.",
      "Prepare the garlic hot honey by blending hot honey and garlic paste together. Keep aside.",
      "Spread the confit garlic béchamel sauce evenly over the small pizza base.",
      "Top with mozzarella cheese, cheddar cheese, and parmesan cheese.",
      "Add sliced garlic, green chilli, and oregano evenly over the pizza.",
      "Bake in a preheated oven for 5-7 minutes or until the cheese is melted and golden.",
      "Remove from the oven and cut the pizza into 6 slices.",
      "Garnish with garlic hot honey drizzle, chopped red paprika, and chopped green garlic.",
    ],
    plating: "Cut into 6 slices and garnish with garlic hot honey drizzle, chopped red paprika, and chopped green garlic.",
    allergens: "Contains: Gluten (wheat), Milk, Sesame.",
    notes: "Garlic Hot Honey: Hot Honey - 100 g; Garlic Paste - 30 g. Blend together and keep aside for garnish drizzle.",
  },
  // ───────────── pages 14–16 · Drinks ─────────────
  {
    page: 14, photo: "photo-14-nutella-shake-jain.jpg", category: "drinks", title: "Nutella Shake (Jain)",
    yieldText: "1 drink", dietary: ["Jain"],
    stats: [{ label: "Process", value: "Add • Pour", icon: "pot" }, { label: "Diet", value: "Jain", icon: "leaf" }],
    miseEnPlace: [],
    ingredients: [["Nutella", 90, "ml"], ["Milk", 120, "ml"], ["Cocoa Powder", 9, "g"], ["Vanilla Ice Cream", 60, "g"]],
    steps: ["Add all ingredients and ice, then blend in the JTC machine.", "Pour into a highball glass."],
    plating: "Not specified in the source SOP.",
    card: {
      hideEmpty: true, panelIcon: "leaf", methodTitle: "Method / Production Protocol", platingTitle: "Plating / Garnish", garnishInfo: "Not specified in the source SOP.",
      photoCaption: "Reference drink photo", assembly: ["Pour into a highball glass."], assemblyGarnish: "Not specified in the source SOP.", stats: undefined,
    },
  },
  {
    page: 15, photo: "photo-15-picante-jain.jpg", category: "drinks", title: "Picante (Jain)",
    yieldText: "1 drink", dietary: ["Jain"],
    stats: [{ label: "Process", value: "Add • Add • Strain", icon: "pot" }, { label: "Diet", value: "Jain", icon: "leaf" }],
    miseEnPlace: [],
    ingredients: [
      ["Pineapple Juice", 120, "ml"], ["Lemon Juice", 20, "ml"], ["Salt", null, "1 pinch"], ["Jalapenos", 5, "g"], ["Coriander", 5, "g"], ["Agave Syrup", 20, "ml"], ["Soda", null, "top up"],
      ["Coriander leaves and jalapenos", null, "", "GARNISH"],
    ],
    steps: [
      "Add jalapenos and coriander to a shaker and muddle properly.",
      "Add lemon juice, pineapple juice, salt, agave syrup, and ice, then shake.",
      "Strain into a glass, top up with soda, and garnish with jalapenos and coriander leaves.",
    ],
    plating: "Jalapenos and coriander leaves.",
    card: {
      hideEmpty: true, panelIcon: "leaf", methodTitle: "Method / Production Protocol", platingTitle: "Plating / Garnish", garnishInfo: "Jalapenos and coriander leaves.",
      photoCaption: "Reference drink photo", assembly: ["Strain into a glass.", "Top up with soda.", "Garnish with jalapenos and coriander leaves."], assemblyGarnish: "Jalapenos and coriander leaves.",
    },
  },
  {
    page: 16, photo: "photo-16-cookies-and-cream-milkshake-jain.jpg", category: "drinks", title: "Cookies & Cream Milkshake (Jain)",
    yieldText: "1 drink", dietary: ["Jain"],
    stats: [{ label: "Process", value: "Blend", icon: "pot" }, { label: "Diet", value: "Jain", icon: "leaf" }],
    miseEnPlace: [],
    ingredients: [
      ["Cookies", null, "4-5 pcs"], ["Vanilla Ice Cream", 120, "g"], ["Cookies & Cream Ice Cream", 60, "g"], ["Milk", 120, "ml"], ["Whipped Cream", 60, "ml"],
      ["Whipped Cream", null, "", "GARNISH"],
    ],
    steps: ["Blend all ingredients in the JTC machine and pour into a highball glass."],
    plating: "Whipped Cream.",
    card: {
      hideEmpty: true, panelIcon: "leaf", methodTitle: "Method / Production Protocol", platingTitle: "Plating / Garnish", garnishInfo: "Whipped Cream.",
      photoCaption: "Reference drink photo", assembly: ["Pour into a highball glass."], assemblyGarnish: "Whipped Cream.",
    },
  },
  // ───────────── pages 17–18 · Desserts ─────────────
  {
    page: 17, photo: "photo-17-nutella-ring-jain.jpg", category: "desserts", title: "Nutella Ring (Jain)", subtitle: "Standard Operating Procedure",
    yieldText: "2 Portions", dietary: ["Jain"],
    stats: [
      { label: "Category", value: "Dessert / Bread", icon: "tag" }, { label: "Yield", value: "2 Portions", icon: "user" },
      { label: "Serve", value: "Hot with Dips", icon: "pot" }, { label: "Diet", value: "Jain", icon: "leaf" },
    ],
    miseEnPlace: [],
    ingredients: [["Small Pizza Dough", null, "1 pc"], ["Nutella", 80, "g"], ["Ricotta Cheese", 50, "g"], ["Roasted Hazelnut", 10, "g"], ["Olive Oil", 1, "g"], ["Vanilla Ice Cream", 80, "g"]],
    steps: [
      "Cut the small dough in half and roll it into a thin rectangular shape using a rolling pin.",
      "Spread Nutella evenly over the dough, leaving a 1 to 2 inch border around the edges for sealing.",
      "Spread plain ricotta cheese over the Nutella layer.",
      "Sprinkle half of the roasted hazelnuts evenly on top.",
      "Roll the dough tightly into a log shape and join the ends to form a ring.",
      "Bake in a preheated oven until golden brown and fully cooked.",
      "Brush lightly with olive oil after baking.",
      "Cut into 2 portions and serve hot with vanilla ice cream and Nutella dip.",
    ],
    notes: "Served hot with vanilla ice cream and a Nutella dip on the side.",
    card: {
      hideEmpty: true, eyebrow: "Dessert / Pastry Kitchen SOP", methodTitle: "SOP / Process", photoCaption: "Final plating reference", notesTitle: "Serving Note",
      serviceStandard: [{ label: "Yield", value: "2 Portions" }, { label: "Serve", value: "Hot with Dips" }],
    },
  },
  {
    page: 18, photo: "photo-18-cinnamon-sugar-doughballs-jain.jpg", category: "desserts", title: "Cinnamon Sugar Doughballs (Jain)", subtitle: "Standard Operating Procedure",
    yieldText: "1 Portion", dietary: ["Jain"],
    stats: [
      { label: "Category", value: "Dessert / Bread", icon: "tag" }, { label: "Yield", value: "1 Portion", icon: "user" },
      { label: "Serve", value: "Warm with Dip", icon: "pot" }, { label: "Diet", value: "Jain", icon: "leaf" },
    ],
    miseEnPlace: [],
    ingredients: [
      ["Dough Balls", 100, "g", "CINNAMON SUGAR DOUGHBALLS"], ["Cinnamon Powder", 0.5, "g", "CINNAMON SUGAR DOUGHBALLS"], ["Caster Sugar", 11.5, "g", "CINNAMON SUGAR DOUGHBALLS"], ["Butter", 0.5, "g", "CINNAMON SUGAR DOUGHBALLS"],
      ["Cream Cheese", 2, "", "CREAM CHEESE DIP"], ["Mascarpone", 2, "", "CREAM CHEESE DIP"], ["Milk", 1.5, "g", "CREAM CHEESE DIP"], ["Icing Sugar", 2.25, "g", "CREAM CHEESE DIP"], ["Lemon Juice", 0.15, "g", "CREAM CHEESE DIP"],
    ],
    steps: [
      "Combine caster sugar and cinnamon powder until evenly distributed.",
      "Heat the butter until fully melted. Place the warm dough balls into a mixing bowl.",
      "Add melted butter gradually and toss evenly to lightly coat the dough balls.",
      "Add the cinnamon sugar mix and toss properly until all dough balls are evenly coated.",
      "Transfer the coated dough balls onto a serving plate, ensuring no floating butter remains.",
      "Serve warm with cream cheese dip on the side.",
      "Add cream cheese, mascarpone, milk, icing sugar, and lemon juice into a blender or mixer jar.",
      "Blend until completely smooth, creamy, and lump-free.",
      "Check consistency and adjust with a small splash of milk if required.",
      "Transfer into a dip bowl and serve alongside the warm cinnamon doughballs.",
    ],
    notes: "Serve the warm cinnamon doughballs with the cream cheese dip on the side.",
    card: {
      hideEmpty: true, eyebrow: "Dessert / Pastry Kitchen SOP", methodTitle: "SOP / Process", photoCaption: "Final plating reference", notesTitle: "Final Plating",
      serviceStandard: [{ label: "Yield", value: "1 Portion" }, { label: "Serve", value: "Warm with Dip" }],
    },
  },
];

const COURSE: Record<Dish["category"], string> = { appetiser: "Appetiser", pasta: "Pasta", pizza: "Pizza", drinks: "Drink", desserts: "Dessert" };
const DESSERT_STYLE = new Set<Dish["category"]>(["drinks", "desserts"]);

const slugify = (s: string) => s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function main() {
  const brand = await db.brand.findUniqueOrThrow({ where: { slug: "capiche" } });
  const categories = new Map(
    (await db.category.findMany({ where: { brandId: brand.id } })).map((c) => [c.slug, c]),
  );
  const owner = await db.admin.findFirst({ where: { role: "OWNER", isActive: true } });

  // New recipes follow the existing ones on each category page (listing is newest-first).
  const baseTime = Date.now() - 3 * 24 * 60 * 60 * 1000;

  for (const d of DISHES) {
    const category = categories.get(d.category);
    if (!category) throw new Error(`Category not found: ${d.category}`);
    const externalId = `MX-${String(d.page).padStart(2, "0")}`;
    const slug = slugify(d.title);
    const existing = await db.recipe.findFirst({ where: { brandId: brand.id, externalId, deletedAt: null } });

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

    // Standard-card recipes carry their own stat row; Desserts / Drinks carry it inside `card`.
    const card = DESSERT_STYLE.has(d.category) ? { ...d.card, stats: d.card?.stats } : { stats: d.stats };
    // Drinks / Desserts show the DESSERT-card stats row too, built from `stats` unless overridden.
    if (DESSERT_STYLE.has(d.category)) (card as Record<string, unknown>).stats = d.stats;

    const input = RecipeInputSchema.parse({
      brandId: brand.id,
      categoryId: category.id,
      externalId,
      slug,
      title: d.title,
      subtitle: d.subtitle ?? null,
      excerpt: (d.summary || d.notes || d.title).slice(0, 200),
      description: null,
      heroImageId,
      servings: 1,
      yieldText: d.yieldText,
      course: COURSE[d.category],
      dietary: d.dietary,
      equipment: [],
      notes: d.notes ?? null,
      author: AUTHOR,
      approvedBy: APPROVED,
      effectiveDate: new Date(`${EFFECTIVE}T12:00:00Z`),
      nextReviewDate: new Date(`${NEXT_REVIEW}T12:00:00Z`),
      miseEnPlace: d.miseEnPlace,
      plating: d.plating ?? null,
      allergens: d.allergens ?? null,
      station: d.station ?? null,
      summary: d.summary ?? null,
      sopVersion: "1.0",
      qualityCheck: [],
      customFields: { card },
      ingredients: d.ingredients.map(([name, quantity, unit, groupLabel], position) => ({
        position,
        groupLabel: groupLabel ?? null,
        quantity,
        unit,
        name,
        raw: `${name} ${quantity ?? ""} ${unit}`.replace(/\s+/g, " ").trim(),
      })),
      steps: d.steps.map((s, position) => {
        const i = s.indexOf("::");
        return i > 0 ? { phase: "COOK", position, title: s.slice(0, i), body: s.slice(i + 2) } : { phase: "COOK", position, body: s };
      }),
      status: "PUBLISHED",
    });

    const data = {
      categoryId: input.categoryId,
      externalId: input.externalId,
      slug,
      title: input.title,
      subtitle: input.subtitle ?? null,
      excerpt: input.excerpt ?? null,
      description: null,
      heroImageId: input.heroImageId,
      servings: input.servings ?? null,
      yieldText: input.yieldText ?? null,
      course: input.course ?? null,
      dietary: input.dietary,
      equipment: input.equipment,
      notes: input.notes ?? null,
      author: input.author ?? null,
      approvedBy: input.approvedBy ?? null,
      effectiveDate: input.effectiveDate ?? null,
      nextReviewDate: input.nextReviewDate ?? null,
      miseEnPlace: input.miseEnPlace,
      plating: input.plating ?? null,
      holding: null,
      allergens: input.allergens ?? null,
      station: input.station ?? null,
      summary: input.summary ?? null,
      sopVersion: input.sopVersion ?? null,
      qualityCheck: input.qualityCheck,
      customFields: input.customFields as Prisma.InputJsonValue,
      ingredientText: input.ingredients.map((i) => i.name).join(" "),
      status: "PUBLISHED" as const,
      publishedAt: new Date(baseTime - d.page * 1000),
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

    console.log(`${existing ? "Updated" : "Created"} p${d.page} ${d.category.padEnd(9)} ${d.title} → /capiche/recipes/${recipe.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
