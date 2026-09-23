import { z } from "zod";

export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export const STEP_PHASES = ["PREP", "COOK", "FINISH"] as const;
export const RECIPE_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const IngredientSchema = z.object({
  position: z.number().int().min(0),
  groupLabel: z.string().trim().max(80).optional().nullable(),
  quantity: z.number().nonnegative().optional().nullable(),
  quantityMax: z.number().nonnegative().optional().nullable(),
  unit: z.string().trim().max(20).optional().nullable(),
  name: z.string().trim().min(1, "Ingredient name is required").max(200),
  note: z.string().trim().max(200).optional().nullable(),
  raw: z.string().trim().min(1).max(300),
});
export type IngredientInput = z.infer<typeof IngredientSchema>;

export const StepSchema = z.object({
  phase: z.enum(STEP_PHASES),
  position: z.number().int().min(0),
  title: z.string().trim().max(120).optional().nullable(),
  body: z.string().trim().min(1, "Step text is required").max(4000),
  imageId: z.string().cuid().optional().nullable(),
  timerMinutes: z.number().int().nonnegative().max(1440).optional().nullable(),
});
export type StepInput = z.infer<typeof StepSchema>;

export const NutritionSchema = z
  .object({
    calories: z.number().nonnegative().optional().nullable(),
    proteinG: z.number().nonnegative().optional().nullable(),
    carbsG: z.number().nonnegative().optional().nullable(),
    fatG: z.number().nonnegative().optional().nullable(),
    fiberG: z.number().nonnegative().optional().nullable(),
    sugarG: z.number().nonnegative().optional().nullable(),
    sodiumMg: z.number().nonnegative().optional().nullable(),
  })
  .partial();
export type NutritionInput = z.infer<typeof NutritionSchema>;

/**
 * The core recipe shape. Used to validate:
 *  - the admin recipe form (create/update)
 *  - a normalized Excel import row (same shape, looser required-ness handled
 *    by the import validator, which reports per-field issues instead of a
 *    single Zod error)
 *
 * Fields NOT in this schema (FieldDefinition-driven `customFields`) are
 * validated separately at runtime with `buildCustomFieldsSchema`, because
 * their shape depends on data stored in the database, not on static code.
 */
export const RecipeInputSchema = z.object({
  brandId: z.string().cuid({ message: "Choose a brand." }),
  categoryId: z.string().cuid().optional().nullable(),
  externalId: z.string().trim().max(120).optional().nullable(),

  slug: z.string().trim().max(160).optional(), // auto-generated if omitted
  title: z.string().trim().min(2, "Title is required").max(160),
  subtitle: z.string().trim().max(200).optional().nullable(),
  excerpt: z.string().trim().max(220).optional().nullable(),
  description: z.string().trim().max(8000).optional().nullable(),

  heroImageId: z.string().cuid().optional().nullable(),

  prepMinutes: z.number().int().min(0).max(10000).optional().nullable(),
  cookMinutes: z.number().int().min(0).max(10000).optional().nullable(),
  restMinutes: z.number().int().min(0).max(10000).optional().nullable(),
  totalMinutes: z.number().int().min(0).max(20000).optional().nullable(),

  servings: z.number().int().positive().max(1000).optional().nullable(),
  yieldText: z.string().trim().max(60).optional().nullable(),

  difficulty: z.enum(DIFFICULTIES).optional().nullable(),
  cuisine: z.string().trim().max(60).optional().nullable(),
  course: z.string().trim().max(60).optional().nullable(),
  dietary: z.array(z.string().trim().max(40)).default([]),
  spiceLevel: z.number().int().min(0).max(5).optional().nullable(),
  equipment: z.array(z.string().trim().max(80)).default([]),

  nutrition: NutritionSchema.optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  tips: z.string().trim().max(2000).optional().nullable(),

  dishCode: z.string().trim().max(60).optional().nullable(),
  author: z.string().trim().max(120).optional().nullable(),
  approvedBy: z.string().trim().max(120).optional().nullable(),
  effectiveDate: z.coerce.date().optional().nullable(),
  nextReviewDate: z.coerce.date().optional().nullable(),
  miseEnPlace: z.array(z.string().trim().max(200)).default([]),
  plating: z.string().trim().max(2000).optional().nullable(),
  holding: z.string().trim().max(2000).optional().nullable(),
  allergens: z.string().trim().max(500).optional().nullable(),

  customFields: z.record(z.string(), z.unknown()).default({}),

  tagIds: z.array(z.string().cuid()).default([]),
  ingredients: z.array(IngredientSchema).min(1, "Add at least one ingredient"),
  steps: z.array(StepSchema).min(1, "Add at least one step"),
  galleryMediaIds: z.array(z.string().cuid()).default([]),

  status: z.enum(RECIPE_STATUSES).default("DRAFT"),
  publishAt: z.coerce.date().optional().nullable(),
  featured: z.boolean().default(false),

  seoTitle: z.string().trim().max(70).optional().nullable(),
  seoDescription: z.string().trim().max(170).optional().nullable(),
  noindex: z.boolean().default(false),
});
export type RecipeInput = z.infer<typeof RecipeInputSchema>;
/** Pre-default shape (array/object defaults optional) — what a form's field values actually look like before submit. */
export type RecipeFormValues = z.input<typeof RecipeInputSchema>;

/** Looser variant for autosave drafts: only title + brand are required. */
export const RecipeDraftSchema = RecipeInputSchema.partial({
  ingredients: true,
  steps: true,
}).extend({
  ingredients: z.array(IngredientSchema).default([]),
  steps: z.array(StepSchema).default([]),
});

/** Publish-readiness checklist, run before status can move to PUBLISHED. */
export function publishChecklist(recipe: {
  title?: string | null;
  heroImageId?: string | null;
  ingredients?: unknown[];
  steps?: unknown[];
  brandId?: string | null;
}): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!recipe.title || recipe.title.trim().length < 2) missing.push("Title");
  if (!recipe.brandId) missing.push("Brand");
  if (!recipe.heroImageId) missing.push("Hero image");
  if (!recipe.ingredients || recipe.ingredients.length === 0) missing.push("At least one ingredient");
  if (!recipe.steps || recipe.steps.length === 0) missing.push("At least one step");
  return { ok: missing.length === 0, missing };
}
