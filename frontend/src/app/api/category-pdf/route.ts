import { NextRequest, NextResponse } from "next/server";
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
import { sopTemplateOf } from "@/lib/sop/templates";

/**
 * GET /api/category-pdf?brand=<slug>&category=<slug>
 * GET /api/category-pdf?brand=<slug>&recipe=<slug>
 * GET /api/category-pdf?brand=<slug>&cookbook=1
 *
 * Returns published recipes (a whole category, one recipe, or every category of
 * the brand) in the shape the printable single-page SOP cards need (see
 * lib/recipe-print.ts). The cookbook mode is read live on every request, so
 * added / removed / unpublished recipes show up in the next download.
 */

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
      const variants = asVariants(r.heroImage.variants);
      const webp = variants.filter((v) => v.format === "webp").sort((a, b) => b.w - a.w)[0];
      return webp ? mediaUrl(webp.key) : null;
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

export async function GET(req: NextRequest) {
  const brandSlug = req.nextUrl.searchParams.get("brand");
  const categorySlug = req.nextUrl.searchParams.get("category");
  const recipeSlug = req.nextUrl.searchParams.get("recipe");
  const cookbook = req.nextUrl.searchParams.get("cookbook") === "1";

  if (!brandSlug || (!categorySlug && !recipeSlug && !cookbook)) {
    return NextResponse.json({ error: "brand and category (or recipe, or cookbook=1) params required" }, { status: 400 });
  }

  const brand = await db.brand.findFirst({ where: { slug: brandSlug, status: "ACTIVE" } });
  if (!brand) return NextResponse.json({ error: "brand not found" }, { status: 404 });

  if (cookbook) {
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
    return NextResponse.json(
      {
        brandName: brand.name,
        template: sopTemplateOf(brand.theme),
        categories: categories
          .map((c, i) => ({ name: c.name, slug: c.slug, recipes: rows[i].map(toPrintRecipe) }))
          .filter((c) => c.recipes.length > 0),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  let categoryName: string | null = null;
  let categoryNumber = 1;
  let categoryDescription: string | null = null;
  if (categorySlug) {
    const category = await db.category.findFirst({ where: { brandId: brand.id, slug: categorySlug } });
    if (!category) return NextResponse.json({ error: "category not found" }, { status: 404 });
    categoryName = category.name;
    categoryDescription = category.description;
    categoryNumber = (await db.category.count({ where: { brandId: brand.id, sortOrder: { lt: category.sortOrder } } })) + 1;
  }

  const recipes = await db.recipe.findMany({
    where: {
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(recipeSlug ? { slug: recipeSlug } : {}),
      ...scope(brand.id),
    },
    select: RECIPE_SELECT,
    orderBy: { title: "asc" },
  });

  return NextResponse.json({
    brandName: brand.name,
    template: sopTemplateOf(brand.theme),
    categoryName,
    categoryNumber,
    categoryDescription,
    recipes: recipes.map(toPrintRecipe),
  });
}
