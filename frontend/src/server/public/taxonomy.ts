import "server-only";
import { db } from "@/server/db";
import type { Category, Tag } from "@/generated/prisma/client";

export async function getBrandCategories(brandId: string): Promise<Category[]> {
  return db.category.findMany({ where: { brandId }, orderBy: { sortOrder: "asc" } });
}

/** Resolves by (brandId, slug) so /aiko/category/pizza never matches Capiche's category. */
export async function getBrandCategoryBySlug(brandId: string, slug: string): Promise<Category | null> {
  return db.category.findFirst({ where: { brandId, slug } });
}

export async function getBrandTags(brandId: string): Promise<Tag[]> {
  return db.tag.findMany({ where: { brandId }, orderBy: { name: "asc" } });
}
