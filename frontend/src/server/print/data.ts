import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { asVariants, mediaUrl } from "@/lib/media";
import { dessertExtrasOf } from "@/lib/sop/dessert";
import { dimsumExtrasOf } from "@/lib/sop/aiko-dimsum";
import { drinkExtrasOf } from "@/lib/sop/aiko-drinks";
import { aikoOptsOf } from "@/lib/sop/aiko";
import { garnishOf } from "@/lib/sop/garnish";
import { timeTextOf } from "@/lib/sop/timeText";
import type { PrintRecipe } from "@/lib/recipe-print";
import type { CookbookCategory } from "@/lib/sop/cookbook";
import { sopTemplateOf, type SopTemplateKey } from "@/lib/sop/templates";

/**
 * Published recipes in the shape the printable single-page SOP cards need
 * (see lib/recipe-print.ts): a whole category, one recipe, or every category of
 * a brand (cookbook). Shared by /api/category-pdf (JSON, client-side fallback)
 * and /api/pdf (server-rendered PDF).
 */

export type PrintQuery =
  | { brand: string; kind: "category"; category: string }
  | { brand: string; kind: "recipe"; recipe: string }
  | { brand: string; kind: "cookbook" };

export type PrintData =
  | { kind: "cookbook"; brandName: string; template: SopTemplateKey; categories: CookbookCategory[] }
  | {
      kind: "category" | "recipe";
      brandName: string;
      template: SopTemplateKey;
      categoryName: string | null;
      categoryNumber: number;
      categoryDescription: string | null;
      recipes: PrintRecipe[];
    };

export function parsePrintQuery(params: URLSearchParams): PrintQuery | null {
  const brand = params.get("brand");
  if (!brand) return null;
  if (params.get("cookbook") === "1") return { brand, kind: "cookbook" };
  const category = params.get("category");
  if (category) return { brand, kind: "category", category };
  const recipe = params.get("recipe");
  if (recipe) return { brand, kind: "recipe", recipe };
  return null;
}

function scope(brandId: string): Prisma.RecipeWhereInput {
  return {
    brandId,
    status: "PUBLISHED",
    deletedAt: null,
    OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
  };
}

const RECIPE_SELECT = {
  title: true,
  subtitle: true,
  dishType: true,
  service: true,
  sopSections: true,
  description: true,
  summary: true,
  station: true,
  dishCode: true,
  sopVersion: true,
  version: true,
  author: true,
  approvedBy: true,
  effectiveDate: true,
  nextReviewDate: true,
  yieldText: true,
  prepMinutes: true,
  cookMinutes: true,
  totalMinutes: true,
  customFields: true,
  dietary: true,
  miseEnPlace: true,
  equipment: true,
  qualityCheck: true,
  plating: true,
  holding: true,
  allergens: true,
  notes: true,
  category: { select: { name: true, slug: true } },
  heroImage: { select: { id: true, variants: true } },
  ingredients: { orderBy: { position: "asc" as const } },
  steps: { orderBy: { position: "asc" as const } },
} satisfies Prisma.RecipeSelect;

type RecipeRow = Prisma.RecipeGetPayload<{ select: typeof RECIPE_SELECT }>;

const phaseOrder = { PREP: 0, COOK: 1, FINISH: 2 } as const;

// The card photo is at most ~105 mm wide; 1280 px is print-sharp without bloating the PDF.
const PRINT_IMAGE_MAX_WIDTH = 1280;

function toPrintRecipe(r: RecipeRow): PrintRecipe {
  return {
    title: r.title,
    subtitle: r.subtitle,
    dishType: r.dishType,
    service: r.service,
    sopSections: r.sopSections,
    description: r.description,
    summary: r.summary,
    categoryName: r.category?.name ?? null,
    station: r.station,
    dishCode: r.dishCode,
    heroImageUrl: (() => {
      if (!r.heroImage) return null;
      const webp = asVariants(r.heroImage.variants).filter((v) => v.format === "webp").sort((a, b) => b.w - a.w);
      const pick = webp.find((v) => v.w <= PRINT_IMAGE_MAX_WIDTH) ?? webp[webp.length - 1];
      return pick ? mediaUrl(pick.key) : null;
    })(),
    versionLabel: r.sopVersion?.trim().replace(/^v/i, "") || `${r.version ?? 1}.0`,
    author: r.author,
    approvedBy: r.approvedBy,
    effectiveDate: r.effectiveDate?.toISOString() ?? null,
    nextReviewDate: r.nextReviewDate?.toISOString() ?? null,
    yieldText: r.yieldText,
    prepMinutes: r.prepMinutes,
    cookMinutes: r.cookMinutes,
    totalMinutes: r.totalMinutes,
    timeText: timeTextOf(r.customFields),
    dessert: dessertExtrasOf(r.customFields),
    dimsum: dimsumExtrasOf(r.customFields),
    drink: drinkExtrasOf(r.customFields),
    aiko: aikoOptsOf(r.customFields),
    categorySlug: r.category?.slug ?? null,
    garnish: garnishOf(r.customFields),
    diet: r.dietary.join(", ") || null,
    miseEnPlace: r.miseEnPlace,
    equipment: r.equipment,
    qualityCheck: r.qualityCheck,
    plating: r.plating,
    holding: r.holding,
    allergens: r.allergens,
    notes: r.notes,
    ingredients: r.ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity ? Number(i.quantity) : null,
      unit: i.unit,
      groupLabel: i.groupLabel,
    })),
    steps: [...r.steps]
      .sort((a, b) => phaseOrder[a.phase] - phaseOrder[b.phase] || a.position - b.position)
      .map((s) => ({ title: s.title, body: s.body })),
  };
}

/** Returns null when the brand / category does not exist. */
export async function loadPrintData(q: PrintQuery): Promise<PrintData | null> {
  const brand = await db.brand.findFirst({ where: { slug: q.brand, status: "ACTIVE" } });
  if (!brand) return null;
  const template = sopTemplateOf(brand.theme);

  if (q.kind === "cookbook") {
    const categories = await db.category.findMany({ where: { brandId: brand.id }, orderBy: { sortOrder: "asc" } });
    const rows = await Promise.all(
      categories.map((c) =>
        db.recipe.findMany({
          where: { categoryId: c.id, ...scope(brand.id) },
          select: RECIPE_SELECT,
          // Same order as the category page on the site (newest first).
          orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
        }),
      ),
    );
    return {
      kind: "cookbook",
      brandName: brand.name,
      template,
      categories: categories
        .map((c, i) => ({ name: c.name, slug: c.slug, recipes: rows[i].map(toPrintRecipe) }))
        .filter((c) => c.recipes.length > 0),
    };
  }

  let categoryName: string | null = null;
  let categoryNumber = 1;
  let categoryDescription: string | null = null;
  if (q.kind === "category") {
    const category = await db.category.findFirst({ where: { brandId: brand.id, slug: q.category } });
    if (!category) return null;
    categoryName = category.name;
    categoryDescription = category.description;
    categoryNumber = (await db.category.count({ where: { brandId: brand.id, sortOrder: { lt: category.sortOrder } } })) + 1;
  }

  const recipes = await db.recipe.findMany({
    where: {
      ...(q.kind === "category" ? { category: { slug: q.category } } : { slug: q.recipe }),
      ...scope(brand.id),
    },
    select: RECIPE_SELECT,
    orderBy: { title: "asc" },
  });

  return {
    kind: q.kind,
    brandName: brand.name,
    template,
    categoryName,
    categoryNumber,
    categoryDescription,
    recipes: recipes.map(toPrintRecipe),
  };
}

/**
 * A short fingerprint of everything a download depends on. It changes whenever a
 * recipe in scope is added, edited, (un)published or deleted, or the brand /
 * category is edited, or the app is redeployed — so a cached PDF for an old
 * fingerprint is simply never requested again.
 */
export async function printVersion(q: PrintQuery): Promise<string | null> {
  const brand = await db.brand.findFirst({ where: { slug: q.brand, status: "ACTIVE" }, select: { id: true, updatedAt: true } });
  if (!brand) return null;

  const where: Prisma.RecipeWhereInput =
    q.kind === "cookbook" ? scope(brand.id)
    : q.kind === "category" ? { category: { slug: q.category }, ...scope(brand.id) }
    : { slug: q.recipe, ...scope(brand.id) };

  const [recipes, categories] = await Promise.all([
    db.recipe.aggregate({ where, _max: { updatedAt: true }, _count: { _all: true } }),
    db.category.aggregate({
      where: { brandId: brand.id, ...(q.kind === "category" ? { slug: q.category } : {}) },
      _max: { updatedAt: true },
      _count: { _all: true },
    }),
  ]);
  if (q.kind === "category" && categories._count._all === 0) return null;

  return createHash("sha256")
    .update(
      JSON.stringify([
        process.env.VERCEL_DEPLOYMENT_ID ?? process.env.NEXT_DEPLOYMENT_ID ?? "local",
        brand.updatedAt,
        recipes._count._all,
        recipes._max.updatedAt,
        categories._count._all,
        categories._max.updatedAt,
      ]),
    )
    .digest("hex")
    .slice(0, 16);
}
