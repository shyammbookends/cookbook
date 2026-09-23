/**
 * The Excel template's column list — the single source of truth for the
 * template generator, the header auto-mapper and (indirectly, via
 * normalize.ts) the importer's field-level error messages.
 */
export interface ColumnDef {
  key: string;
  label: string;
  required: boolean;
  example: string;
  help: string;
  aliases: string[]; // lowercased, matched fuzzily against the header row
}

export const IMPORT_COLUMNS: ColumnDef[] = [
  { key: "external_id", label: "External ID", required: false, example: "CAP-001",
    help: "Your own stable ID. Re-importing the same external_id updates that recipe instead of creating a duplicate.",
    aliases: ["external id", "id", "sku", "code"] },
  { key: "title", label: "Title", required: true, example: "Hot Honey Pepperoni",
    help: "Recipe name, max 160 characters.", aliases: ["recipe name", "name", "dish", "recipe title"] },
  { key: "brand", label: "Brand", required: true, example: "Capiche",
    help: "Must be one of the active brand names or slugs.", aliases: ["section", "site", "brand name"] },
  { key: "category", label: "Category", required: false, example: "Pizzas",
    help: "Must exist for that brand, unless you enable 'create missing categories'.", aliases: ["type", "collection"] },
  { key: "slug", label: "Slug", required: false, example: "hot-honey-pepperoni",
    help: "Auto-generated from the title if left blank.", aliases: ["url", "permalink"] },
  { key: "excerpt", label: "Card excerpt", required: false, example: "Sweet heat, big crunch.",
    help: "Short card copy, max 200 characters.", aliases: ["summary", "short description"] },
  { key: "description", label: "Description", required: false, example: "A pizzeria classic...",
    help: "Long description.", aliases: ["details", "about"] },
  { key: "ingredients", label: "Ingredients", required: true, example: "200g flour, sifted\n2 tbsp olive oil",
    help: "One ingredient per line. Start a line with ## to add a group header (e.g. ## For the sauce).",
    aliases: ["ingredient list"] },
  { key: "prep_steps", label: "Prep steps", required: false, example: "Mix the dough\nLet it rest 1 hour",
    help: "One step per line.", aliases: ["preparation", "prep instructions", "prep"] },
  { key: "cook_steps", label: "Cook steps", required: true, example: "Bake at 250C for 8 minutes",
    help: "One step per line. At least one of prep_steps or cook_steps is required.", aliases: ["instructions", "method", "directions", "cooking instructions", "cook"] },
  { key: "prep_time", label: "Prep time", required: false, example: "20 min", help: "e.g. 20, 20 min, 1h 20m.", aliases: ["prep minutes", "preparation time"] },
  { key: "cook_time", label: "Cook time", required: false, example: "1h 20m", help: "Same formats as prep time.", aliases: ["cook minutes", "cooking time"] },
  { key: "rest_time", label: "Rest time", required: false, example: "30 min", help: "Resting/proofing time.", aliases: ["resting time"] },
  { key: "total_time", label: "Total time", required: false, example: "", help: "Auto-computed from prep+cook+rest if left blank.", aliases: [] },
  { key: "servings", label: "Servings", required: false, example: "4", help: "Whole number.", aliases: ["serves"] },
  { key: "yield", label: "Yield", required: false, example: "12 slices", help: "Free text yield, e.g. '12 slices'.", aliases: ["makes"] },
  { key: "difficulty", label: "Difficulty", required: false, example: "Medium", help: "Easy / Medium / Hard.", aliases: ["level"] },
  { key: "cuisine", label: "Cuisine", required: false, example: "Italian-American", aliases: [], help: "" },
  { key: "course", label: "Course", required: false, example: "Main", aliases: [], help: "" },
  { key: "dietary", label: "Dietary", required: false, example: "Vegetarian, Jain", help: "Comma-separated.", aliases: ["diet"] },
  { key: "spice_level", label: "Spice level", required: false, example: "3", help: "0–5.", aliases: ["heat level", "spiciness"] },
  { key: "tags", label: "Tags", required: false, example: "spicy, party, bestseller", help: "Comma-separated.", aliases: ["keywords"] },
  { key: "hero_image", label: "Hero image", required: false, example: "https://example.com/pizza.jpg",
    help: "A URL, or a filename inside the uploaded images ZIP.", aliases: ["image", "image url", "photo"] },
  { key: "gallery_images", label: "Gallery images", required: false, example: "", help: "Multiple, one per line (URLs or ZIP filenames).", aliases: ["gallery", "additional images"] },
  { key: "calories", label: "Calories", required: false, example: "320", aliases: ["kcal"], help: "" },
  { key: "protein_g", label: "Protein (g)", required: false, example: "12", aliases: ["protein"], help: "" },
  { key: "carbs_g", label: "Carbs (g)", required: false, example: "40", aliases: ["carbs", "carbohydrates"], help: "" },
  { key: "fat_g", label: "Fat (g)", required: false, example: "10", aliases: ["fat"], help: "" },
  { key: "fiber_g", label: "Fiber (g)", required: false, example: "3", aliases: ["fibre", "fibre_g"], help: "" },
  { key: "sugar_g", label: "Sugar (g)", required: false, example: "5", aliases: ["sugar"], help: "" },
  { key: "sodium_mg", label: "Sodium (mg)", required: false, example: "450", aliases: ["sodium"], help: "" },
  { key: "notes", label: "Notes", required: false, example: "", aliases: [], help: "" },
  { key: "tips", label: "Tips", required: false, example: "", aliases: ["chef tips", "pro tips"], help: "" },
  { key: "equipment", label: "Equipment", required: false, example: "Stand mixer, pizza stone", help: "Comma-separated.", aliases: [] },
  { key: "seo_title", label: "SEO title", required: false, example: "", help: "Max 60 characters (warning if longer).", aliases: ["meta title"] },
  { key: "seo_description", label: "SEO description", required: false, example: "", help: "Max 160 characters (warning if longer).", aliases: ["meta description"] },
  { key: "status", label: "Status", required: false, example: "Draft", help: "Draft / Published. Defaults to Draft.", aliases: [] },
  { key: "featured", label: "Featured", required: false, example: "No", help: "Yes / No.", aliases: [] },
  { key: "dish_code", label: "Dish Code", required: false, example: "CP-01", help: "Internal code for the dish.", aliases: ["code", "dishcode"] },
  { key: "version", label: "Version", required: false, example: "1", help: "Version number.", aliases: ["v"] },
  { key: "author", label: "Author", required: false, example: "Chef John", help: "Who created the recipe.", aliases: ["creator"] },
  { key: "approved_by", label: "Approved By", required: false, example: "Executive Chef", help: "Who approved the recipe.", aliases: ["approver"] },
  { key: "effective_date", label: "Effective Date", required: false, example: "2026-04-16", help: "YYYY-MM-DD", aliases: ["effective"] },
  { key: "next_review_date", label: "Next Review Date", required: false, example: "2027-03-16", help: "YYYY-MM-DD", aliases: ["review date", "next review"] },
  { key: "mise_en_place", label: "Mise En Place", required: false, example: "Wash lettuce", help: "One step per line.", aliases: ["prep list", "mise"] },
  { key: "plating", label: "Plating", required: false, example: "Serve in a bowl", help: "Plating instructions.", aliases: ["presentation"] },
  { key: "holding", label: "Holding", required: false, example: "Keep warm", help: "Holding instructions.", aliases: ["storage"] },
  { key: "allergens", label: "Allergens", required: false, example: "Gluten, Milk", help: "Allergen warnings.", aliases: ["allergy"] },
];

export const REQUIRED_COLUMN_KEYS = IMPORT_COLUMNS.filter((c) => c.required).map((c) => c.key);

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
}

/** Fuzzy-matches uploaded header text against known columns (exact, then alias, then loose contains). */
export function autoDetectMapping(headers: string[]): Record<number, string | null> {
  const mapping: Record<number, string | null> = {};
  const used = new Set<string>();

  headers.forEach((header, idx) => {
    const norm = normalizeHeader(header);
    if (!norm) {
      mapping[idx] = null;
      return;
    }
    if (norm.startsWith("custom:") || norm.startsWith("custom ")) {
      mapping[idx] = `custom:${header.trim().split(/[:]/)[1]?.trim() ?? ""}`;
      return;
    }
    let match = IMPORT_COLUMNS.find((c) => !used.has(c.key) && (normalizeHeader(c.label) === norm || c.key === norm.replace(/ /g, "_")));
    if (!match) {
      match = IMPORT_COLUMNS.find((c) => !used.has(c.key) && c.aliases.some((a) => normalizeHeader(a) === norm));
    }
    if (!match) {
      match = IMPORT_COLUMNS.find(
        (c) => !used.has(c.key) && (norm.includes(normalizeHeader(c.label)) || normalizeHeader(c.label).includes(norm)),
      );
    }
    if (match) used.add(match.key);
    mapping[idx] = match?.key ?? null;
  });

  return mapping;
}
