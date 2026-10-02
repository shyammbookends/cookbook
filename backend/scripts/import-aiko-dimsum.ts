/**
 * Imports Aiko Kitchen's DIM SUM SOPs (transcribed from rec c.pdf, one recipe per
 * page) into the Aiko brand's DIM SUM category, with their photos (cropped from the
 * PDF into backend/data/aiko-dimsum). These cards use the dedicated Dim Sum design
 * (lib/sop/aiko-dimsum.ts); the fields without a column of their own are stored in
 * customFields.dimsum. Safe to re-run: recipes are matched by externalId and replaced.
 *
 *   npx tsx --tsconfig tsconfig.json --conditions=react-server backend/scripts/import-aiko-dimsum.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "@/server/db";
import { uploadImage } from "@/server/media/upload";
import { createRecipe } from "@/server/services/recipe";
import { RecipeInputSchema } from "@/lib/schemas/recipe";

const PHOTOS = path.resolve("backend/data/aiko-dimsum");
const AUTHOR = "Bookend's Hospitality";
const APPROVED = "Husen Khan";

type Guide = { title: string; bullets?: string[]; steps?: { icon: string; label: string }[]; icon?: string };

interface Dim {
  code: string;
  photo: string;
  slug: string;
  title: string;
  description: string;
  summary: [string, string][];
  dietary: string;
  /** Header strip values (the PDF leaves some blank). */
  strip: Record<string, string>;
  highlights: string[];
  qc: string[];
  serving: string[];
  /** "Group|Name|Value" rows; group may be empty. */
  ingredients: string[];
  mise: string[];
  equipment: string[];
  holding: string[];
  plating: string[];
  serviceNotes?: string[];
  /** Method: plain step strings, or "TITLE::step" to open a titled section. */
  steps: string[];
  extras: Record<string, unknown>;
}

const STD_HEADERS = { "": ["Ingredients", "Gram"] };
const wrap = (...x: [string, string][]) => x.map(([icon, label]) => ({ icon, label }));
const STD_SUMMARY = (type: string, portion: string, diet: string, allergens: string): [string, string][] => [
  ["Dish Type", type], ["Portion", portion], ["Dietary", diet], ["Allergens", allergens], ["Service", "Hot"],
];

const DIMS: Dim[] = [
  {
    code: "DS-001", photo: "photo-1-chestnut-gyoza.jpg", slug: "chestnut-gyoza", title: "Chestnut Gyoza",
    description: "Delicate pan-fried dumplings filled with chestnut, aromatics and vegetables. Crisp on the bottom, juicy inside and steamed to perfection.",
    summary: STD_SUMMARY("Pan Fried & Steamed", "6 pcs", "Vegetarian", "Gluten, MSG"), dietary: "Vegetarian", strip: {},
    highlights: ["Crispy base", "Juicy chestnut filling", "Steamed for tenderness", "Perfect texture balance"],
    qc: ["Neat pleats", "No leakage", "Crisp base", "Steamed top", "Filling hot through"],
    serving: ["Serve 6 pcs hot with dipping sauce (as per service)."],
    ingredients: ["|Chestnut|550", "|Thai chilli|6", "|Red Bhavnagri chilli|75", "|Onion|110", "|Stock powder|12", "|MSG|8", "|White pepper|5", "|Salt|2", "|Slurry|25", "|Gyoza wrappers|6 pcs", "|Oil + Water (for steaming)|As required"],
    mise: [], equipment: [],
    holding: ["Prepare gyoza and refrigerate uncovered for up to 6 hours.", "Do not freeze after assembling.", "Cook to order for best quality.", "Leftover cooked gyoza not recommended."],
    plating: ["Arrange 6 pcs neatly on plate.", "Ensure crisp side faces up slightly.", "Serve with dipping sauce.", "Garnish with spring onion if required."],
    serviceNotes: ["Cook gyoza to order.", "Serve immediately after cooking.", "Ensure crisp base before serving.", "Keep warm (not hot holding) if short hold."],
    steps: [
      "Prepare filling: mix/chop chestnut with chillies and onion. Cook until aromatic.",
      "Season with stock powder, MSG, white pepper, salt.",
      "Add slurry; cook until mixture binds. Cool completely.",
      "Fill wrappers with 18 g filling; pleat tightly.",
      "Pan-fry gyoza in oil until base golden.",
      "Add water, cover and steam 4–5 min.",
      "Remove lid; re-crisp base 30–45 sec.",
    ],
    extras: {
      ingHeaders: { "": ["Item", "Gram"] }, methodStyle: "numbers", guidesLayout: "row",
      guides: [
        { title: "FILLING PREP GUIDE", bullets: ["Finely chop chestnut.", "Finely chop chillies and onion.", "Sauté until moisture evaporates.", "Add seasoning and slurry.", "Cook until mixture holds shape.", "Cool completely before filling."] },
        { title: "GYOZA PLEATING GUIDE", steps: wrap(["fill", "1. Place filling in center."], ["half", "2. Fold wrapper in half."], ["pleat", "3. Create first pleat."], ["pleated", "4. Continue pleating."], ["sealed", "5. Press and seal tightly."]) },
        { title: "COOKING GUIDE", bullets: ["Use a non-stick or well seasoned pan.", "Medium high heat for pan-fry.", "Add water just enough to steam.", "Do not over steam.", "Re-crisp for best texture."] },
      ],
      dip: { title: "DIPPING SAUCE SUGGESTION (optional)", items: ["Soy sauce 2 tbsp", "Rice vinegar 1 tbsp", "Chilli oil 1 tsp", "Sliced garlic (fried)", "Spring onion"] },
    },
  },
  {
    code: "DS-002", photo: "photo-2-okonomiyaki-gyoza.jpg", slug: "okonomiyaki-gyoza", title: "Okonomiyaki Gyoza (6 Pcs)",
    description: "Japanese-inspired gyoza with okonomiyaki style vegetable & soy keema filling, pan-fried for a crispy base and juicy filling, topped with okonomiyaki sauces.",
    summary: STD_SUMMARY("Pan Fried & Steamed", "6 pcs", "Vegetarian", "Gluten, Soy, Sesame"), dietary: "Vegetarian",
    strip: { type: "Wok / Fry", dietary: "Vegetarian", portion: "6 pcs", service: "Hot", allergens: "Gluten, Soy, Sesame" },
    highlights: ["Crispy base", "Juicy soy keema filling", "Steamed for tenderness", "Okonomiyaki style flavour", "Perfect texture balance"],
    qc: ["Filling dry; internal temp ≥ 74°C", "Neat pleats", "No leakage", "Crisp base", "Juicy filling"],
    serving: ["Serve 6 pcs hot with sauces and garnishes."],
    ingredients: [
      "Cook 1:|Oil|20 g", "Cook 1:|Garlic|10 g", "Cook 1:|Ginger|3 g (paste)",
      "Cook 2:|Chinese cabbage|50 g", "Cook 2:|Indian cabbage|40 g", "Cook 2:|Carrot|30 g", "Cook 2:|Water chestnut|20 g", "Cook 2:|White spring onion|15 g",
      "Cook 3:|Chilli besan paste|5 g", "Cook 3:|Gochujang|5 g", "Cook 3:|Thai chilli|2 g",
      "Cook 4:|Soy|5 g", "Cook 4:|Sesame oil|2 g", "Cook 4:|Salt|2 g", "Cook 4:|MSG|1 g", "Cook 4:|White pepper|1 g", "Cook 4:|Stock pwd|3 g", "Cook 4:|Boiled soy keema|100 g", "Cook 4:|Basil|5 g", "Cook 4:|Coriander leaf|5 g", "Cook 4:|Coriander stem|5 g",
      "Final mix:|Pickled ginger|5 g", "Final mix:|Tempura flakes|20 g",
      "Soy-ketchup glaze:|Ketchup|80 g", "Soy-ketchup glaze:|Soy|40 g", "Soy-ketchup glaze:|Maple|6 g", "Soy-ketchup glaze:|Rice vinegar|10 g",
      "Tuile batter:|Flour|17 g", "Tuile batter:|Water|90 g", "Tuile batter:|Oil|60 g", "Tuile batter:|Salt|– pinch",
      "Mustard mayo:|Mayo|200 g", "Mustard mayo:|Mustard|10 g", "Mustard mayo:|Sugar|4 g", "Mustard mayo:|Salt|2 g",
    ],
    mise: ["Cooked veg filling; soy keema; tuile batter; sauces."], equipment: ["Pan, bowl, brush."],
    holding: ["Prepare gyoza and refrigerate uncovered for up to 6 hours.", "Do not freeze after assembling.", "Cook to order for best quality.", "Leftover cooked gyoza not recommended."],
    plating: ["Fan gyoza on plate, sauces zig-zag.", "Drizzle mustard mayo + soy-ketchup glaze.", "Garnish with chilli, spring onion and sesame."],
    serviceNotes: ["Cook gyoza to order.", "Serve immediately after cooking.", "Ensure crisp base before serving.", "Keep warm (not hot holding) if short hold."],
    steps: [
      "Cook stages 1–4 sequentially; dry the mix fully. Fold in pickled ginger and tempura flakes.",
      "Fill gyoza skins with filling; pleat tightly (18 g filling per gyoza).",
      "Heat non-stick pan; add oil. Place gyoza; pan-fry until base golden.",
      "Add water, cover and steam for 4–5 minutes.",
      "Remove lid; re-crisp base for 30–45 seconds.",
      "Plate in a fan pattern.",
      "Drizzle mustard mayo and soy-ketchup glaze.",
      "Garnish with chilli, spring onion and sesame.",
    ],
    extras: {
      ingHeading: "INGREDIENTS (BY STAGE)", ingStages: true, methodStyle: "plain", guidesLayout: "row",
      guides: [
        { title: "FILLING PREP GUIDE", bullets: ["Finely chop all vegetables.", "Cook each stage properly.", "Dry moisture completely.", "Mix and fold gently.", "Chill if needed before filling."] },
        { title: "GYOZA PLEATING GUIDE", steps: wrap(["fill", "1. Place filling in center."], ["half", "2. Fold wrapper in half."], ["pleat", "3. Create small pleats."], ["pleated", "4. Continue pleating."], ["sealed", "5. Press and seal tightly."]) },
        { title: "COOKING GUIDE", bullets: ["Use non-stick or well seasoned pan.", "Medium high heat for pan-fry.", "Add water just enough to steam.", "Do not over steam.", "Re-crisp for best texture."] },
      ],
      components: {
        title: "SAUCE & GARNISH COMPONENTS",
        cols: [
          { title: "SOY-KETCHUP GLAZE", text: "Ketchup 80 g | Soy 40 g | Maple 6 g | Rice vinegar 10 g" },
          { title: "MUSTARD MAYO", text: "Mayo 200 g | Mustard 10 g | Sugar 4 g | Salt 2 g" },
          { title: "GARNISH", text: "Chilli | Spring onion | Sesame seeds" },
        ],
      },
    },
  },
  {
    code: "DS-003", photo: "photo-3-truffle-edamame-dimsums.jpg", slug: "truffle-edamame-dimsums", title: "Truffle Edamame Dimsums",
    description: "Delicate steamed dim sums with a creamy edamame and truffle filling. Light, aromatic and perfectly balanced.",
    summary: STD_SUMMARY("Steamed Dim Sum", "4 pcs", "Vegetarian", "Dairy, Soy"), dietary: "Vegetarian", strip: {},
    highlights: ["Creamy edamame filling", "Truffle aroma", "Soft wrapper", "Light and delicate", "Perfect as appetizer"],
    qc: ["Creamy centre", "Truffle aroma", "Wrapper intact", "Well sealed", "Fully cooked"],
    serving: ["Serve hot; optional truffle oil finish."],
    ingredients: ["|Blanched edamame|250", "|Cream cheese|50", "|Salt|4", "|Black pepper|4", "|Truffle oil|25", "|Truffle pate|5", "|Water|20", "|Wrappers|4 pcs"],
    mise: ["Blanched edamame ready", "Cream cheese at room temperature", "Truffle ingredients measured", "Wrappers covered with damp cloth"], equipment: ["Steamer, mixing bowl, spatula, steamer liner."],
    holding: ["Prepare filling and refrigerate up to 12 hrs.", "Assembled dimsums can be refrigerated up to 6 hrs.", "Do not freeze after assembling.", "Steam just before service."],
    plating: ["Arrange 4 pcs in steamer or on plate.", "Drizzle truffle oil (optional).", "Garnish with microgreens or truffle flakes if required.", "Serve immediately hot."],
    steps: [
      "Pulse edamame to coarse mince.",
      "Mix with cream cheese, salt, pepper, truffle oil, truffle pate; add water to adjust texture.",
      "Fill wrappers evenly and seal.",
      "Steam 4–5 minutes until cooked.",
    ],
    extras: {
      ingPill: true, ingHeaders: { "": ["Ingredients", "Gram"] }, methodStyle: "numbers", guidesLayout: "row",
      guides: [
        { title: "FILLING PREP GUIDE", bullets: ["Pulse edamame to coarse texture.", "Mix all ingredients gently.", "Adjust consistency with water.", "Filling should be creamy, not runny."] },
        { title: "WRAPPING GUIDE", steps: wrap(["fill", "1. Place filling in center."], ["half", "2. Fold edges together."], ["peak", "3. Seal tightly to form peak."], ["bun", "4. Ensure no gaps."]) },
        { title: "STEAMING GUIDE", bullets: ["Use bamboo steamer.", "Preheat steamer properly.", "Steam on medium heat.", "Do not over steam.", "Steam 4–5 min until cooked."] },
      ],
      qcMarkers: ["Creamy centre", "Distinct truffle aroma", "Wrapper intact", "No leakage"],
      faults: [["Leaks filling", "Seal properly, do not overfill."], ["Tough wrapper", "Do not over steam."], ["Dry filling", "Add little water or cream cheese."]],
    },
  },
  {
    code: "DS-004", photo: "photo-4-saucy-momos.jpg", slug: "saucy-momos", title: "Saucy Momos",
    description: "Steamed momos with flavourful vegetable filling, served in a rich, smooth and slightly spicy sauce.",
    summary: STD_SUMMARY("Steamed Momos", "5 pcs", "Vegetarian", "Soy, MSG"), dietary: "Vegetarian",
    strip: { type: "Steam", dietary: "Vegetarian", portion: "5 pcs", service: "Hot", allergens: "Soy, MSG" },
    highlights: ["Juicy vegetable filling", "Smooth & flavourful sauce", "Steamed to perfection", "Balanced heat & sweetness", "Perfect texture & aroma"],
    qc: ["Momos intact", "Sauce smooth, glossy", "Filling cooked well", "Properly sealed", "Balanced taste"],
    serving: ["Serve hot immediately."],
    ingredients: [
      "FILLING|Indian cabbage|500", "FILLING|Onion|100", "FILLING|Carrot|50", "FILLING|Spring onion|10", "FILLING|Silken tofu|175", "FILLING|Salt|6", "FILLING|White pepper|4", "FILLING|MSG|6", "FILLING|Stock powder|8",
      "SAUCE|Garlic|30", "SAUCE|Thai chilli|3", "SAUCE|Tomato|500", "SAUCE|Gochujang|8", "SAUCE|Gochugaru|15", "SAUCE|Coconut cream|50", "SAUCE|Honey|20", "SAUCE|Salt|6", "SAUCE|MSG|3", "SAUCE|Stock powder|6",
      "OTHERS|Wrappers|5 pcs",
    ],
    mise: ["All vegetables washed & chopped.", "Silken tofu drained.", "Sauce ingredients measured.", "Wrappers covered with damp cloth."], equipment: ["Steamer, mixing bowl, knife, chopping board, pan, ladle."],
    holding: ["Cooked filling: refrigerate up to 12 hrs.", "Assembled raw momos: refrigerate (covered) up to 6 hrs.", "Do not freeze.", "Cooked momos: serve immediately.", "Reheat by steaming if required."],
    plating: ["Spread sauce evenly.", "Arrange 5 momos neatly.", "Garnish with spring onion or sesame seeds (optional).", "Drizzle with little chili oil if required."],
    serviceNotes: ["Serve immediately after plating.", "Keep sauce hot and smooth.", "Ensure momos are not sitting in sauce for long.", "Maintain consistency in portion."],
    steps: [
      "A. COOK FILLING::Sauté onion until translucent.", "Add cabbage and carrot; cook on high flame until moisture evaporates.", "Add spring onion and silken tofu.", "Add salt, white pepper, MSG and stock powder.", "Mix well and cook until dry.", "Cool completely before shaping.",
      "B. ASSEMBLE MOMOS::Place required filling in the center of each wrapper.", "Pleat and seal properly.", "Ensure no leakage and even shape.",
      "C. COOK::Place momos in steamer.", "Steam for 4–5 minutes until fully cooked.",
      "D. PREPARE SAUCE::Heat sauce base (prepared as per recipe) in a pan.", "Simmer gently and adjust consistency.", "Keep warm for service.",
      "E. PLATE::Spread hot sauce in serving plate or bowl.", "Place steamed momos on top.", "Serve hot immediately.",
    ],
    extras: {
      ingPill: true, methodPill: true, ingHeaders: { "": ["Ingredients", "Gram"], OTHERS: ["", ""] }, ingGroupStyle: "orange", methodStyle: "sections-num", guidesLayout: "row",
      guides: [
        { title: "FILLING PREP GUIDE", bullets: ["Finely chop all vegetables.", "Cook on high flame.", "Dry the mixture completely.", "Add tofu last; mix gently.", "Cool completely before use."] },
        { title: "SHAPING GUIDE", steps: wrap(["fill", "1. Place filling in center."], ["half", "2. Fold wrapper in half."], ["bun", "3. Pleat from one side to other."], ["bun", "4. Seal tightly with light press."]) },
        { title: "STEAMING GUIDE", bullets: ["Use well-greased steamer plate/liner.", "Do not overcrowd.", "Steam on medium-high heat.", "Steam 4–5 min until cooked.", "Do not over steam."] },
      ],
      qcMarkers: ["Momos intact and well sealed", "Filling cooked, not watery", "Sauce smooth and glossy", "Balanced heat and sweetness", "Consistent taste"],
      faults: [["Leakage during steaming", "Seal properly; do not overfill."], ["Dry filling", "Add silken tofu and cook properly; do not overcook."], ["Thick sauce", "Adjust with little water or coconut cream."], ["Bland taste", "Balance with salt, gochujang, honey."]],
    },
  },
  {
    code: "DS-005", photo: "photo-5-cheese-chilli-dumplings.jpg", slug: "cheese-chilli-dumplings", title: "Cheese Chilli Dumplings",
    description: "Steamed dumplings filled with a creamy cheese and chestnut filling, served on a flavourful green sauce and garnished with crispy fried onion and pickled Bhavnagri.",
    summary: STD_SUMMARY("Steamed Dumplings", "5 pcs", "Vegetarian", "Dairy, Gluten"), dietary: "Vegetarian",
    strip: { type: "Steam", dietary: "Vegetarian", portion: "5 pcs", service: "Hot", allergens: "Dairy, Gluten" },
    highlights: ["Creamy cheese filling", "Balanced chilli heat", "Smooth green sauce base", "Steamed to perfection", "Garnished for texture and flavour"],
    qc: ["Creamy centre", "Balanced chilli heat", "Wrapper intact", "No leakage", "Sauce smooth, glossy", "Well sealed & cooked"],
    serving: ["Serve hot with sauce underneath as standard."],
    ingredients: [
      "A. FILLING|Cream cheese|95", "A. FILLING|Tofu|100", "A. FILLING|Chestnut|100", "A. FILLING|Salt|6", "A. FILLING|Sugar|2", "A. FILLING|White pepper|1", "A. FILLING|Basil|10", "A. FILLING|Hot sauce|3.5", "A. FILLING|Shaoxing wine|5",
      "B. SAUCE|Garlic|30", "B. SAUCE|Ginger|5", "B. SAUCE|Jalapeños|10", "B. SAUCE|Green Bhavnagari chilli|150", "B. SAUCE|Kaffir lime leaf|1", "B. SAUCE|Lemongrass|5", "B. SAUCE|Tomato|50", "B. SAUCE|Salt|10", "B. SAUCE|Sugar|8", "B. SAUCE|Cumin powder|6", "B. SAUCE|Hing|1", "B. SAUCE|Rice vinegar|10", "B. SAUCE|Lemon juice|20", "B. SAUCE|Basil|5", "B. SAUCE|Coriander|3",
      "OTHERS|Wrappers|5 pcs",
      "GARNISH (AS PER SERVICE)|Fried onion|As required", "GARNISH (AS PER SERVICE)|Pickled red Bhavnagri|As required",
    ],
    mise: ["All filling ingredients measured and prepped.", "Sauce ingredients prepped and blended.", "Wrappers at room temperature.", "Steamer ready."], equipment: [],
    holding: ["Prepare filling and refrigerate up to 12 hrs.", "Sauce can be refrigerated up to 24 hrs.", "Assembled momos: refrigerate up to 6 hrs.", "Do not freeze assembled momos."],
    plating: ["Spread sauce evenly.", "Place 5 dumplings neatly.", "Garnish with fried onion and pickled Bhavnagri.", "Serve hot."],
    serviceNotes: ["Steam just before service.", "Keep sauce warm.", "Maintain consistent portioning.", "Serve immediately for best taste."],
    steps: [
      "1. PREPARE FILLING::Mix all filling ingredients thoroughly.", "Chill the filling for easy wrapping.",
      "2. ASSEMBLE DUMPLINGS::Place required filling in the center of each wrapper.", "Seal edges tightly to form momos.",
      "3. STEAM::Steam dumplings for 4–5 minutes until cooked.",
      "4. PREPARE SAUCE::Blend or crush all sauce ingredients to a smooth paste.", "Heat in a pan and simmer.", "Adjust consistency and seasoning as required.",
      "5. PLATE::Spread green sauce on the base of the plate.", "Place steamed dumplings on top.",
      "6. GARNISH::Top with fried onion and pickled red Bhavnagri.",
    ],
    extras: {
      ingPill: true, ingHeaders: { "": ["Ingredients", "Gram"], OTHERS: ["Ingredients", "Qty"], "GARNISH (AS PER SERVICE)": ["Ingredients", "Qty"] },
      ingColumns: [["A. FILLING", "OTHERS"], ["B. SAUCE", "GARNISH (AS PER SERVICE)"]], ingGroupStyle: "orange", methodStyle: "sections-bullets", guidesLayout: "row",
      guides: [
        { title: "FILLING PREP GUIDE", bullets: ["Finely chop chestnut.", "Crumble tofu.", "Mix all ingredients well.", "Chill before use."] },
        { title: "WRAPPING GUIDE", steps: wrap(["fill", "1. Place filling in center."], ["half", "2. Fold edges together."], ["bun", "3. Pleat and seal tightly."], ["bun", "4. Ensure no gaps."]) },
        { title: "STEAMING GUIDE", bullets: ["Use steamer with liner.", "Do not overcrowd.", "Steam on medium heat.", "Steam 4–5 min until cooked."] },
        { title: "SAUCE GUIDE", bullets: ["Blend to smooth paste.", "Simmer until aromatic.", "Adjust thickness as required.", "Keep warm for service."] },
      ],
      qcMarkers: ["Creamy and soft centre.", "Balanced chilli flavour.", "Sauce smooth and glossy.", "Dumpling shape uniform."],
      faults: [["Leakage during steaming", "Seal properly; do not overfill."], ["Tough wrapper", "Do not overcook."], ["Sauce too thick", "Add little water or lemon juice."], ["Too spicy", "Adjust with sugar and lemon juice."]],
    },
  },
  {
    code: "DS-006", photo: "photo-6-chilli-oil-dumplings.jpg", slug: "chilli-oil-dumplings", title: "Chilli Oil Dumplings",
    description: "Steamed dumplings tossed in our signature chilli oil sauce made with a house paste, stock and peanuts. Spicy, aromatic and packed with texture.",
    summary: STD_SUMMARY("Steamed Dumplings", "5 pcs", "Vegetarian", "Soy"), dietary: "Vegetarian",
    strip: { type: "Steam", dietary: "Vegetarian", portion: "5 pcs", service: "Hot", allergens: "Soy" },
    highlights: ["Spicy & aromatic chilli oil sauce", "House-made chilli paste", "Steamed dumplings", "Crunchy peanuts & noodles", "Perfect balance of heat & umami"],
    qc: ["Dumplings sealed well", "Skin intact, no leakage", "Sauce glossy & balanced", "Peanuts add crunch", "Serve hot"],
    serving: ["Serve hot with sauce underneath as standard."],
    ingredients: [
      "|Gyoza skin|5.00", "|Chilli Oil Dumplings filling|75.00", "|Oil|10.00", "|Red chilli powder|1.00", "|Chilli Oil Dumplings paste|20.00", "|Stock water|100.00", "|Salt|1.00", "|Msg|1.00", "|Stock powder|1.00", "|Sichuan powder|1.00", "|Toasted Peanuts|4.00", "|White spring onion|2.00", "|Green spring onion|2.00", "|Fried glass noodles|4.00",
      "FILLING INGREDIENTS|Cabbage (finely chopped)|500.00", "FILLING INGREDIENTS|Firm Tofu (pressed + crumbled)|500.00", "FILLING INGREDIENTS|Carrot (fine chop)|200.00", "FILLING INGREDIENTS|Spring Onion Whites|100.00", "FILLING INGREDIENTS|Ginger (fine chop)|15.00", "FILLING INGREDIENTS|Garlic|15.00", "FILLING INGREDIENTS|Soy Sauce|40.00", "FILLING INGREDIENTS|Sesame Oil|20.00", "FILLING INGREDIENTS|White Pepper|5.00", "FILLING INGREDIENTS|Salt|5.00", "FILLING INGREDIENTS|Cornstarch|25.00", "FILLING INGREDIENTS|Silken Tofu Puree|100.00", "FILLING INGREDIENTS|Green Chilli|5.00", "FILLING INGREDIENTS|Stock Powder|5.00",
      "CHILLI OIL DUMPLINGS PASTE|Garlic|30.00", "CHILLI OIL DUMPLINGS PASTE|Ginger|15.00", "CHILLI OIL DUMPLINGS PASTE|Gochugaru|25.00", "CHILLI OIL DUMPLINGS PASTE|Gochujang|60.00", "CHILLI OIL DUMPLINGS PASTE|Soy Sauce|40.00", "CHILLI OIL DUMPLINGS PASTE|Vinegar|15.00", "CHILLI OIL DUMPLINGS PASTE|Sugar|25.00", "CHILLI OIL DUMPLINGS PASTE|Stock Powder|8.00", "CHILLI OIL DUMPLINGS PASTE|Red Chilli Powder|5.00",
    ],
    mise: ["All filling ingredients chopped and measured.", "Paste prepared and stored.", "Stock water ready.", "Garnishes prepared.", "Equipment: steamer, pan, ladle, bowl."], equipment: [],
    holding: ["Uncooked dumplings: refrigerate up to 12 hrs.", "Cooked dumplings: refrigerate up to 6 hrs.", "Reheat by steaming.", "Sauce: hold warm up to 4 hrs."],
    plating: ["Spread sauce evenly.", "Arrange 5 dumplings neatly.", "Top with peanuts, spring onion and fried noodles.", "Serve hot."],
    serviceNotes: ["Serve immediately after plating.", "Keep sauce hot.", "Do not let dumplings sit in sauce for long.", "Maintain consistent portion."],
    steps: [
      "1. PREPARE FILLING::Mix all filling ingredients thoroughly.", "Refrigerate for 15–20 min for easier handling.",
      "2. MAKE CHILLI OIL DUMPLINGS PASTE::Blend all paste ingredients to a smooth, thick paste.", "Store in an airtight container.",
      "3. ASSEMBLE DUMPLINGS::Place required filling in the center of each wrapper.", "Seal edges tightly to form dumplings.",
      "4. STEAM DUMPLINGS::Steam for 4–5 minutes until fully cooked.",
      "5. PREPARE SAUCE::Heat oil in a pan, add chilli paste and sauté for 30 seconds.", "Add stock water, red chilli powder, salt, msg, stock powder and Sichuan powder. Stir well.", "Simmer for 2–3 minutes. Adjust seasoning.",
      "6. FINISH & PLATE::Spread hot sauce on serving plate.", "Place steamed dumplings on top.", "Garnish with toasted peanuts, white & green spring onion and fried glass noodles.", "Serve immediately.",
    ],
    extras: {
      ingHeading: "INGREDIENTS (PER PORTION)", ingPill: true, ingHeaders: { "": ["Ingredients", "Gram"] },
      ingColumns: [[""], ["FILLING INGREDIENTS", "CHILLI OIL DUMPLINGS PASTE"]], ingGroupStyle: "center", methodStyle: "sections-bullets", guidesLayout: "row",
      guides: [
        { title: "WRAPPING GUIDE", steps: wrap(["fill", "1. Place filling in center."], ["slit", "2. Fold edges together."], ["pleated", "3. Pleat and seal tightly."], ["bun", "4. Ensure no gaps."]) },
        { title: "STEAMING GUIDE", bullets: ["Use steamer with liner.", "Do not overcrowd.", "Steam on medium heat.", "Steam 4–5 min until cooked."] },
        { title: "SAUCE GUIDE", bullets: ["Sauté paste in oil well.", "Add stock gradually.", "Simmer to desired consistency.", "Keep warm for service."] },
        { title: "GARNISH GUIDE", bullets: ["Add crushed peanuts for crunch.", "Top with spring onion.", "Add fried glass noodles for texture."] },
      ],
      qcMarkers: ["Dumplings sealed, no leakage.", "Skin soft, not torn.", "Sauce smooth, glossy & well-balanced.", "Crunch from peanuts & noodles.", "Balanced heat & umami."],
      faults: [["Dumplings leaking", "Seal properly; do not overfill."], ["Skin breaking", "Use proper moisture; handle gently."], ["Sauce too thin", "Simmer longer; add paste if needed."], ["Too salty", "Adjust with stock water."], ["Too spicy", "Adjust with sugar & stock."]],
    },
  },
  {
    code: "DS-007", photo: "photo-7-new-dimsum-platter.jpg", slug: "new-dimsum-platter", title: "New Dimsum Platter",
    description: "A curated selection of handcrafted dimsum, steamed to perfection and served with signature dips and sauces.\nA perfect balance of flavours and textures.",
    summary: STD_SUMMARY("Steamed Dim Sum Platter", "5 pcs", "Vegetarian", "Dairy, Gluten"), dietary: "Vegetarian", strip: {},
    highlights: ["Handcrafted dimsum varieties", "Steamed for perfect texture", "Balanced flavours and colours", "Served with signature dips", "Ideal as a sharing platter"],
    qc: ["Dumpling shape uniform", "Wrappers intact", "Proper sealing", "Evenly steamed", "Sauce consistency smooth"],
    serving: ["Serve hot immediately with dips and sauces.", "Maintain temperature until served."],
    ingredients: ["|Saucy Momos|2 pcs", "|Forest Dumplings|2 pcs", "|Truffle Edamame Dumplings|2 pcs", "|Cheese & Chilli Dumplings|2 pcs", "|Chestnut Gyoza|2 pcs", "|* Broad Beans|30 g", "|Gyoza Dip|25 g", "|Chilli Crisp|15 g", "|Forest Dip|25 g", "|Red Momos Sauce|30 g"],
    mise: ["Prepare and portion all dim sums.", "Keep steamer lined and ready.", "Portion dips and sauces.", "Keep broad beans ready.", "Ensure service ware is clean."], equipment: [],
    holding: ["Store raw dim sums in chiller up to 12 hrs.", "Do not freeze assembled platter.", "Steam and serve only."],
    plating: ["Keep arrangement as per standard.", "Dip bowls in the centre.", "Garnish only if specified.", "Wipe edges before serving."],
    serviceNotes: ["Serve immediately after steaming.", "Keep steamer warm until service.", "Maintain hygiene and temperature.", "For best taste, consume hot."],
    steps: [
      "1. PREPARE DUMPLINGS::Ensure all dim sums are prepared, sealed and ready to steam.",
      "2. STEAM DUMPLINGS::Steam all dumplings for 4–5 minutes on medium heat until cooked.",
      "3. PREPARE DIPS & SAUCES::Portion dips and sauces as per the given gram weight in small bowls.",
      "4. ASSEMBLE PLATTER::Arrange all dim sums in a bamboo steamer as shown.", "Place the dip bowls in the centre or alongside.",
      "5. SERVE::Serve hot immediately.",
    ],
    extras: {
      ingHeading: "INGREDIENTS (PER PLATTER)", ingHeaders: { "": ["Ingredients", "Qty / Gram"] }, methodStyle: "sections-bullets", guidesLayout: "side",
      guides: [
        { title: "STEAMING GUIDE", icon: "steamer", bullets: ["Use steamer with liner.", "Do not overcrowd.", "Steam on medium heat for 4–5 min."] },
        { title: "SAUCE GUIDE", icon: "sauce", bullets: ["Serve sauces in small bowls.", "Keep consistency smooth.", "Adjust seasoning if required."] },
        { title: "PLATING GUIDE", icon: "plating", bullets: ["Arrange dim sums neatly.", "Maintain colour balance.", "Serve with dips and sauces."] },
      ],
      qcMarkers: ["Wrappers intact and not torn.", "Even cooking and colour.", "Filling moist and flavourful.", "Dips and sauces at correct consistency."],
      faults: [["Wrapper torn", "Handle gently, don't overfill."], ["Undercooked", "Steam for additional 1–2 min."], ["Dry filling", "Check filling moisture & sealing."], ["Sauce too thick", "Adjust with water or lemon juice."]],
    },
  },
];

/** "18 g" → 18 + "g"; anything printed differently ("5.00", "As required", "g (paste)") is kept verbatim as the unit. */
function parseQty(text: string): { quantity: number | null; unit: string | null } {
  const m = text.match(/^(\d+(?:\.\d*[1-9])?)(?:\s+(\S.*))?$/);
  if (m) return { quantity: Number(m[1]), unit: m[2] ?? null };
  return { quantity: null, unit: text };
}

async function main() {
  const brand = await db.brand.findUniqueOrThrow({ where: { slug: "aiko" } });
  const admin = await db.admin.findFirstOrThrow({ where: { role: "OWNER", isActive: true } });
  const category = await db.category.findUniqueOrThrow({ where: { brandId_slug: { brandId: brand.id, slug: "dim-sum" } } });

  for (const s of DIMS) {
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
      const [group, name, value] = row.split("|");
      const { quantity, unit } = parseQty(value);
      return { position, groupLabel: group || null, quantity, unit, name, raw: `${name} ${value}` };
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
      dietary: [s.dietary],
      dishCode: s.code,
      author: AUTHOR,
      approvedBy: APPROVED,
      allergens: sum["Allergens"],
      dishType: sum["Dish Type"],
      service: sum["Service"],
      qualityCheck: s.qc,
      miseEnPlace: s.mise,
      equipment: s.equipment,
      holding: s.holding.join("\n"),
      plating: s.plating.join("\n"),
      customFields: {
        dimsum: {
          strip: Object.fromEntries(Object.entries(s.strip).map(([k, v]) => [k, v.toUpperCase()])),
          summary: s.summary,
          highlights: s.highlights,
          serving: s.serving,
          serviceNotes: s.serviceNotes,
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
