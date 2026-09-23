import "server-only";
import { db } from "@/server/db";
import { toSlug } from "@/lib/slug";
import type { NormalizedRow, ImportIssue } from "@/server/import/normalize";
import type { ImportRowStatus } from "@/generated/prisma/client";

export interface ImportOptions {
  duplicatePolicy: "skip" | "update" | "copy";
  createMissingCategories: boolean;
  publishMode: "draft" | "publish_valid";
}

export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  duplicatePolicy: "skip",
  createMissingCategories: true,
  publishMode: "draft",
};

/**
 * Resolves brand/category names against the database and flags duplicates
 * (within this file, and against already-published recipes). Called after
 * normalize.ts's pure type-coercion pass.
 */
export async function validateRowAgainstDb(
  normalized: NormalizedRow,
  formatIssues: ImportIssue[],
  opts: ImportOptions,
  seenInFile: Map<string, number>, // key -> first row index seen
  rowIndex: number,
): Promise<{ issues: ImportIssue[]; status: ImportRowStatus; brandId: string | null; categoryId: string | null; matchedRecipeId: string | null }> {
  const issues = [...formatIssues];
  let brandId: string | null = null;
  let categoryId: string | null = null;
  let matchedRecipeId: string | null = null;

  if (normalized.brandRaw) {
    const brand = await db.brand.findFirst({
      where: {
        OR: [
          { slug: toSlug(normalized.brandRaw) },
          { name: { equals: normalized.brandRaw, mode: "insensitive" } },
        ],
      },
    });
    if (brand) {
      brandId = brand.id;
    } else {
      const all = await db.brand.findMany({ select: { name: true } });
      const suggestion = closestMatch(normalized.brandRaw, all.map((b) => b.name));
      issues.push({
        field: "brand", column: "Brand", code: "INVALID_BRAND", severity: "error",
        message: `"${normalized.brandRaw}" is not a valid brand.`,
        suggestion: suggestion ? `Did you mean ${suggestion}?` : undefined,
      });
    }
  }

  if (brandId && normalized.categoryRaw) {
    const slug = toSlug(normalized.categoryRaw);
    const category = await db.category.findFirst({ where: { brandId, slug } });
    if (category) {
      categoryId = category.id;
    } else if (opts.createMissingCategories) {
      issues.push({
        field: "category", column: "Category", code: "CATEGORY_WILL_BE_CREATED", severity: "warning",
        message: `Category "${normalized.categoryRaw}" doesn't exist yet and will be created.`,
      });
    } else {
      issues.push({
        field: "category", column: "Category", code: "INVALID_CATEGORY", severity: "warning",
        message: `Category "${normalized.categoryRaw}" doesn't exist. Recipe will be imported without a category.`,
      });
    }
  }

  // Dedupe: within this file (by brand+externalId, or brand+slug/title)
  const dedupeKey = `${normalized.brandRaw.toLowerCase()}::${(normalized.externalId || normalized.slug || toSlug(normalized.title)).toLowerCase()}`;
  const firstSeenAt = seenInFile.get(dedupeKey);
  if (firstSeenAt !== undefined && firstSeenAt !== rowIndex) {
    issues.push({
      field: "title", column: "Title", code: "DUPLICATE_IN_FILE", severity: "warning",
      message: `Same recipe already appears earlier in this file (row ${firstSeenAt}).`,
    });
  } else {
    seenInFile.set(dedupeKey, rowIndex);
  }

  // Dedupe: against the database
  if (brandId) {
    const existing = await db.recipe.findFirst({
      where: {
        brandId,
        deletedAt: null,
        OR: [
          normalized.externalId ? { externalId: normalized.externalId } : undefined,
          normalized.slug ? { slug: normalized.slug } : { slug: toSlug(normalized.title) },
        ].filter(Boolean) as object[],
      },
    });
    if (existing) {
      matchedRecipeId = existing.id;
      issues.push({
        field: "title", column: "Title", code: "DUPLICATE_IN_DB", severity: "warning",
        message: `A recipe with this ${normalized.externalId ? "external ID" : "slug"} already exists (policy: ${opts.duplicatePolicy}).`,
      });
    }
  }

  const hasError = issues.some((i) => i.severity === "error");
  const isDuplicate = matchedRecipeId !== null;

  let status: ImportRowStatus;
  if (hasError) status = "ERROR";
  else if (isDuplicate) status = "DUPLICATE";
  else if (issues.length > 0) status = "WARNING";
  else status = "VALID";

  return { issues, status, brandId, categoryId, matchedRecipeId };
}

function closestMatch(input: string, candidates: string[]): string | null {
  const a = input.toLowerCase();
  let best: { name: string; score: number } | null = null;
  for (const c of candidates) {
    const score = levenshtein(a, c.toLowerCase());
    if (!best || score < best.score) best = { name: c, score };
  }
  return best && best.score <= 3 ? best.name : null;
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}
