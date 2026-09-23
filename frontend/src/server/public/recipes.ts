import "server-only";
import { db } from "@/server/db";
import { Prisma } from "@/generated/prisma/client";

/**
 * THE BRAND WALL.
 *
 * Every public recipe query goes through here. `scope(brandId)` is spread
 * LAST into every `where` clause so a bug elsewhere can never widen it —
 * the caller can add extra filters, but can never remove brandId, status,
 * deletedAt or the publish-time check.
 *
 * Tested by tests/integration/brand-isolation.test.ts: two brands are
 * seeded with identical slugs/categories/tags and every function here is
 * asserted to return zero cross-brand results.
 */
function scope(brandId: string): Prisma.RecipeWhereInput {
  return {
    brandId,
    status: "PUBLISHED",
    deletedAt: null,
    OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
  };
}

const CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  heroImage: { select: { id: true, variants: true, blurDataUrl: true, dominantColor: true, alt: true, width: true, height: true } },
  category: { select: { slug: true, name: true } },
  prepMinutes: true,
  cookMinutes: true,
  totalMinutes: true,
  servings: true,
  difficulty: true,
  spiceLevel: true,
  featured: true,
  publishedAt: true,
} satisfies Prisma.RecipeSelect;

export type RecipeCardData = Prisma.RecipeGetPayload<{ select: typeof CARD_SELECT }>;

export interface ListFilters {
  categorySlug?: string;
  tagSlug?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  maxTotalMinutes?: number;
  dietary?: string;
  query?: string;
  sort?: "newest" | "quickest" | "az";
  cursor?: string;
  take?: number;
}

/**
 * The `search` tsvector column is declared `Unsupported` in the Prisma
 * schema (see prisma/README.md), which means the query builder can't see
 * it at all. A free-text query is resolved with a small raw-SQL lookup
 * (brand-scoped in the SQL itself, as a second layer of the brand wall),
 * and the matching ids are then hydrated through the normal query builder
 * so every other filter still applies. Rank order is preserved in JS;
 * search results are not cursor-paginated (capped at `take`).
 */
async function searchRecipeIdsByRank(brandId: string, query: string, take: number): Promise<string[]> {
  const tsQuery = query
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean)
    .map((t) => `${t}:*`) // prefix match, so "pan" matches "paneer"
    .join(" & ");
  if (!tsQuery) return [];

  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Recipe"
    WHERE "brandId" = ${brandId}
      AND status = 'PUBLISHED'
      AND "deletedAt" IS NULL
      AND ("publishAt" IS NULL OR "publishAt" <= now())
      AND search @@ to_tsquery('simple', ${tsQuery})
    ORDER BY ts_rank(search, to_tsquery('simple', ${tsQuery})) DESC
    LIMIT ${take}
  `;
  return rows.map((r) => r.id);
}

export async function listRecipes(
  brandId: string,
  filters: ListFilters = {},
): Promise<{ items: RecipeCardData[]; nextCursor: string | null }> {
  const take = Math.min(filters.take ?? 24, 60);

  if (filters.query) {
    const rankedIds = await searchRecipeIdsByRank(brandId, filters.query, take);
    if (rankedIds.length === 0) return { items: [], nextCursor: null };

    const where: Prisma.RecipeWhereInput = {
      id: { in: rankedIds },
      ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
      ...(filters.tagSlug ? { tags: { some: { tag: { slug: filters.tagSlug, brandId } } } } : {}),
      ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
      ...(filters.maxTotalMinutes ? { totalMinutes: { lte: filters.maxTotalMinutes } } : {}),
      ...(filters.dietary ? { dietary: { has: filters.dietary } } : {}),
      ...scope(brandId), // ALWAYS LAST
    };
    const rows = await db.recipe.findMany({ where, select: CARD_SELECT });
    const rank = new Map(rankedIds.map((id, i) => [id, i]));
    rows.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
    return { items: rows, nextCursor: null };
  }

  const where: Prisma.RecipeWhereInput = {
    ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
    ...(filters.tagSlug ? { tags: { some: { tag: { slug: filters.tagSlug, brandId } } } } : {}),
    ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
    ...(filters.maxTotalMinutes ? { totalMinutes: { lte: filters.maxTotalMinutes } } : {}),
    ...(filters.dietary ? { dietary: { has: filters.dietary } } : {}),
    ...scope(brandId), // ALWAYS LAST
  };

  const orderBy: Prisma.RecipeOrderByWithRelationInput =
    filters.sort === "quickest"
      ? { totalMinutes: "asc" }
      : filters.sort === "az"
        ? { title: "asc" }
        : { publishedAt: "desc" };

  const items = await db.recipe.findMany({
    where,
    select: CARD_SELECT,
    orderBy,
    take: take + 1,
    ...(filters.cursor ? { skip: 1, cursor: { id: filters.cursor } } : {}),
  });

  let nextCursor: string | null = null;
  if (items.length > take) {
    const next = items.pop();
    nextCursor = next!.id;
  }

  return { items, nextCursor };
}

export async function getFeaturedRecipes(brandId: string, take = 6): Promise<RecipeCardData[]> {
  return db.recipe.findMany({
    where: { featured: true, ...scope(brandId) },
    select: CARD_SELECT,
    orderBy: { publishedAt: "desc" },
    take,
  });
}

export async function getLatestRecipes(brandId: string, take = 8): Promise<RecipeCardData[]> {
  return db.recipe.findMany({
    where: scope(brandId),
    select: CARD_SELECT,
    orderBy: { publishedAt: "desc" },
    take,
  });
}

const DETAIL_SELECT = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  excerpt: true,
  description: true,
  heroImage: { select: { id: true, variants: true, blurDataUrl: true, dominantColor: true, alt: true, width: true, height: true } },
  category: { select: { slug: true, name: true } },
  prepMinutes: true,
  cookMinutes: true,
  restMinutes: true,
  totalMinutes: true,
  servings: true,
  yieldText: true,
  difficulty: true,
  cuisine: true,
  course: true,
  dietary: true,
  spiceLevel: true,
  equipment: true,
  nutrition: true,
  notes: true,
  tips: true,
  dishCode: true,
  author: true,
  approvedBy: true,
  effectiveDate: true,
  nextReviewDate: true,
  miseEnPlace: true,
  plating: true,
  holding: true,
  allergens: true,
  station: true,
  summary: true,
  sopVersion: true,
  qualityCheck: true,
  customFields: true,
  seoTitle: true,
  seoDescription: true,
  noindex: true,
  publishedAt: true,
  updatedAt: true,
  version: true,
  brand: { select: { slug: true, name: true } },
  ingredients: { orderBy: { position: "asc" as const } },
  steps: {
    orderBy: { position: "asc" as const },
    include: { image: { select: { id: true, variants: true, blurDataUrl: true, alt: true } } },
  },
  gallery: {
    orderBy: { position: "asc" as const },
    include: { media: { select: { id: true, variants: true, blurDataUrl: true, alt: true, width: true, height: true } } },
  },
  tags: { include: { tag: { select: { slug: true, name: true } } } },
} satisfies Prisma.RecipeSelect;

export type RecipeDetailData = Prisma.RecipeGetPayload<{ select: typeof DETAIL_SELECT }>;

export async function getRecipeBySlug(brandId: string, slug: string): Promise<RecipeDetailData | null> {
  return db.recipe.findFirst({
    where: { slug, ...scope(brandId) },
    select: DETAIL_SELECT,
  });
}

/** All PUBLISHED recipe slugs for a brand — for generateStaticParams. */
export async function getAllPublishedSlugs(brandId: string): Promise<string[]> {
  const rows = await db.recipe.findMany({
    where: scope(brandId),
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

/** Slug + updatedAt for every published, indexable recipe in a brand — for sitemap.xml. */
export async function getSitemapEntries(brandId: string): Promise<{ slug: string; updatedAt: Date }[]> {
  return db.recipe.findMany({
    where: { ...scope(brandId), noindex: false },
    select: { slug: true, updatedAt: true },
  });
}

export async function getRelatedRecipes(
  brandId: string,
  recipeId: string,
  categorySlug: string | null,
  take = 4,
): Promise<RecipeCardData[]> {
  return db.recipe.findMany({
    where: {
      id: { not: recipeId },
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...scope(brandId),
    },
    select: CARD_SELECT,
    orderBy: { publishedAt: "desc" },
    take,
  });
}

export async function suggestRecipeTitles(brandId: string, query: string, take = 8): Promise<{ slug: string; title: string }[]> {
  if (!query.trim()) return [];
  return db.recipe.findMany({
    where: {
      title: { contains: query, mode: "insensitive" },
      ...scope(brandId),
    },
    select: { slug: true, title: true },
    take,
  });
}
