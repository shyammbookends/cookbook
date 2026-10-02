import { parseDurationMinutes } from "@/lib/duration";
import { parseIngredientBlock, parseStepBlock } from "@/lib/ingredientParser";
import { toSlug } from "@/lib/slug";
import { IMPORT_COLUMNS } from "@/server/import/columns";

export interface ImportIssue {
  field: string;
  column: string;
  code: string;
  severity: "error" | "warning";
  message: string;
  suggestion?: string;
}

function columnLabel(key: string): string {
  return IMPORT_COLUMNS.find((c) => c.key === key)?.label ?? key;
}

function issue(field: string, code: string, severity: "error" | "warning", message: string, suggestion?: string): ImportIssue {
  return { field, column: columnLabel(field), code, severity, message, suggestion };
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
}

function splitList(v: unknown): string[] {
  const s = str(v);
  if (!s) return [];
  return s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
}

const YES_WORDS = new Set(["yes", "y", "true", "1", "haan", "हाँ", "featured"]);
function parseBoolean(v: unknown): boolean {
  return YES_WORDS.has(str(v).toLowerCase());
}

const DIFFICULTY_MAP: Record<string, "EASY" | "MEDIUM" | "HARD"> = {
  easy: "EASY", beginner: "EASY",
  medium: "MEDIUM", moderate: "MEDIUM", intermediate: "MEDIUM",
  hard: "HARD", difficult: "HARD", advanced: "HARD",
};

const STATUS_MAP: Record<string, "DRAFT" | "PUBLISHED"> = {
  draft: "DRAFT", published: "PUBLISHED", live: "PUBLISHED", public: "PUBLISHED",
};

export interface NormalizedRow {
  externalId: string | null;
  title: string;
  brandRaw: string;
  categoryRaw: string | null;
  slug: string | null;
  excerpt: string | null;
  description: string | null;
  ingredientGroups: ReturnType<typeof parseIngredientBlock>;
  prepSteps: string[];
  cookSteps: string[];
  prepMinutes: number | null;
  cookMinutes: number | null;
  restMinutes: number | null;
  totalMinutes: number | null;
  servings: number | null;
  yieldText: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD" | null;
  cuisine: string | null;
  course: string | null;
  dietary: string[];
  spiceLevel: number | null;
  tags: string[];
  heroImageRef: string | null;
  galleryImageRefs: string[];
  nutrition: Record<string, number | null>;
  notes: string | null;
  tips: string | null;
  equipment: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  status: "DRAFT" | "PUBLISHED";
  featured: boolean;
  dishCode: string | null;
  version: number;
  author: string | null;
  approvedBy: string | null;
  effectiveDate: Date | null;
  nextReviewDate: Date | null;
  miseEnPlace: string[];
  plating: string | null;
  holding: string | null;
  allergens: string | null;
  station: string | null;
  summary: string | null;
  qualityCheck: string[];
  subtitle: string | null;
  dishType: string | null;
  service: string | null;
  sopSections: string | null;
  customFields: Record<string, unknown>;
}

/**
 * Pure, DB-free normalization: type coercion and format validation only.
 * Anything requiring a database lookup (does this brand/category exist,
 * is this a duplicate) happens in validate.ts.
 */
export function normalizeRow(record: Record<string, unknown>): { normalized: NormalizedRow; issues: ImportIssue[] } {
  const issues: ImportIssue[] = [];

  const title = str(record.title);
  if (!title) issues.push(issue("title", "REQUIRED", "error", "Recipe title is missing."));

  const brandRaw = str(record.brand);
  if (!brandRaw) issues.push(issue("brand", "REQUIRED", "error", "Brand is missing."));

  const ingredientsRaw = str(record.ingredients);
  if (!ingredientsRaw) issues.push(issue("ingredients", "REQUIRED", "error", "Ingredients are missing."));
  const ingredientGroups = ingredientsRaw ? parseIngredientBlock(ingredientsRaw) : [];
  if (ingredientsRaw && ingredientGroups.every((g) => g.lines.length === 0)) {
    issues.push(issue("ingredients", "UNPARSEABLE", "warning", "Couldn't parse any ingredient lines from this text."));
  }

  const prepSteps = record.prep_steps ? parseStepBlock(str(record.prep_steps)) : [];
  const cookSteps = record.cook_steps ? parseStepBlock(str(record.cook_steps)) : [];
  if (prepSteps.length === 0 && cookSteps.length === 0) {
    issues.push(issue("cook_steps", "REQUIRED", "error", "At least one prep or cook step is required."));
  }

  const prepMinutes = record.prep_time ? parseDurationMinutes(record.prep_time) : null;
  if (record.prep_time && prepMinutes === null) {
    issues.push(issue("prep_time", "INVALID_DURATION", "warning", `Couldn't understand "${str(record.prep_time)}" as a duration; left blank.`));
  }
  const cookMinutes = record.cook_time ? parseDurationMinutes(record.cook_time) : null;
  if (record.cook_time && cookMinutes === null) {
    issues.push(issue("cook_time", "INVALID_DURATION", "warning", `Couldn't understand "${str(record.cook_time)}" as a duration; left blank.`));
  }
  const restMinutes = record.rest_time ? parseDurationMinutes(record.rest_time) : null;
  const explicitTotal = record.total_time ? parseDurationMinutes(record.total_time) : null;
  const totalMinutes = explicitTotal ?? (prepMinutes || cookMinutes || restMinutes
    ? (prepMinutes ?? 0) + (cookMinutes ?? 0) + (restMinutes ?? 0)
    : null);

  let servings: number | null = null;
  if (record.servings) {
    const n = Number(str(record.servings).replace(/[^\d.]/g, ""));
    if (Number.isFinite(n) && n > 0) servings = Math.round(n);
    else issues.push(issue("servings", "INVALID_NUMBER", "warning", `"${str(record.servings)}" is not a valid number of servings; left blank.`));
  }

  let difficulty: "EASY" | "MEDIUM" | "HARD" | null = null;
  if (record.difficulty) {
    const key = str(record.difficulty).toLowerCase();
    difficulty = DIFFICULTY_MAP[key] ?? null;
    if (!difficulty) issues.push(issue("difficulty", "INVALID_ENUM", "warning", `"${str(record.difficulty)}" is not Easy/Medium/Hard; left blank.`));
  }

  let spiceLevel: number | null = null;
  if (record.spice_level) {
    const n = Number(str(record.spice_level));
    if (Number.isFinite(n) && n >= 0 && n <= 5) spiceLevel = Math.round(n);
    else issues.push(issue("spice_level", "OUT_OF_RANGE", "warning", `Spice level must be 0–5; "${str(record.spice_level)}" ignored.`));
  }

  const nutrition: Record<string, number | null> = {};
  for (const [col, key] of [
    ["calories", "calories"], ["protein_g", "proteinG"], ["carbs_g", "carbsG"],
    ["fat_g", "fatG"], ["fiber_g", "fiberG"], ["sugar_g", "sugarG"], ["sodium_mg", "sodiumMg"],
  ] as const) {
    if (record[col] !== undefined && record[col] !== "") {
      const n = Number(str(record[col]));
      if (Number.isFinite(n) && n >= 0) nutrition[key] = n;
      else issues.push(issue(col, "INVALID_NUMBER", "warning", `"${str(record[col])}" is not a valid number; ignored.`));
    }
  }

  let status: "DRAFT" | "PUBLISHED" = "DRAFT";
  if (record.status) {
    const mapped = STATUS_MAP[str(record.status).toLowerCase()];
    if (mapped) status = mapped;
    else issues.push(issue("status", "INVALID_ENUM", "warning", `"${str(record.status)}" is not Draft/Published; defaulting to Draft.`));
  }

  const seoTitle = str(record.seo_title) || null;
  if (seoTitle && seoTitle.length > 60) {
    issues.push(issue("seo_title", "TOO_LONG", "warning", `SEO title is ${seoTitle.length} characters (recommended ≤60).`));
  }
  const seoDescription = str(record.seo_description) || null;
  if (seoDescription && seoDescription.length > 160) {
    issues.push(issue("seo_description", "TOO_LONG", "warning", `SEO description is ${seoDescription.length} characters (recommended ≤160).`));
  }

  if (!str(record.hero_image)) {
    issues.push(issue("hero_image", "MISSING_IMAGE", "warning", "Image URL missing. Recipe will be imported with a placeholder."));
  }

  const customFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith("custom:")) {
      customFields[key.slice("custom:".length)] = str(value);
    }
  }

  const normalized: NormalizedRow = {
    externalId: str(record.external_id) || null,
    title,
    brandRaw,
    categoryRaw: str(record.category) || null,
    slug: str(record.slug) ? toSlug(str(record.slug)) : null,
    excerpt: str(record.excerpt).slice(0, 220) || null,
    description: str(record.description) || null,
    ingredientGroups,
    prepSteps,
    cookSteps,
    prepMinutes,
    cookMinutes,
    restMinutes,
    totalMinutes,
    servings,
    yieldText: str(record.yield) || null,
    difficulty,
    cuisine: str(record.cuisine) || null,
    course: str(record.course) || null,
    dietary: splitList(record.dietary),
    spiceLevel,
    tags: splitList(record.tags),
    heroImageRef: str(record.hero_image) || null,
    galleryImageRefs: splitList(record.gallery_images),
    nutrition,
    notes: str(record.notes) || null,
    tips: str(record.tips) || null,
    equipment: splitList(record.equipment),
    seoTitle,
    seoDescription,
    status,
    featured: parseBoolean(record.featured),
    dishCode: str(record.dish_code) || null,
    version: parseInt(str(record.version)) || 1,
    author: str(record.author) || null,
    approvedBy: str(record.approved_by) || null,
    effectiveDate: str(record.effective_date) ? new Date(str(record.effective_date)) : null,
    nextReviewDate: str(record.next_review_date) ? new Date(str(record.next_review_date)) : null,
    miseEnPlace: splitList(record.mise_en_place),
    plating: str(record.plating) || null,
    holding: str(record.holding) || null,
    allergens: str(record.allergens) || null,
    station: str(record.station) || null,
    summary: str(record.summary) || null,
    // Newlines only — a single check may contain commas.
    qualityCheck: str(record.quality_check).split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
    subtitle: str(record.subtitle) || null,
    dishType: str(record.dish_type) || null,
    service: str(record.service) || null,
    sopSections: str(record.sop_sections) || null,
    customFields,
  };

  return { normalized, issues };
}
