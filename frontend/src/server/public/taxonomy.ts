import "server-only";
import { cache } from "react";
import { db } from "@/server/db";
import type { Category, Tag, Prisma } from "@/generated/prisma/client";

export type CategoryWithImage = Prisma.CategoryGetPayload<{
  include: { image: { select: { id: true, storageKey: true, sourceUrl: true, variants: true } } };
}>;

export async function getBrandCategories(brandId: string): Promise<CategoryWithImage[]> {
  return db.category.findMany({
    where: {
      brandId,
    },
    include: { image: { select: { id: true, storageKey: true, sourceUrl: true, variants: true } } },
    orderBy: { sortOrder: "asc" },
  });
}

/** Resolves by (brandId, slug) so /aiko/category/pizza never matches Capiche's category. */
// cache(): generateMetadata and the page both ask for the same category — one query per request.
export const getBrandCategoryBySlug = cache(async (brandId: string, slug: string): Promise<(Category & { image?: { id: string; storageKey: string; sourceUrl: string | null; variants: unknown } | null }) | null> => {
  return db.category.findFirst({
    where: { brandId, slug },
    include: { image: { select: { id: true, storageKey: true, sourceUrl: true, variants: true } } },
  });
});

export async function getBrandTags(brandId: string): Promise<Tag[]> {
  return db.tag.findMany({ where: { brandId }, orderBy: { name: "asc" } });
}
