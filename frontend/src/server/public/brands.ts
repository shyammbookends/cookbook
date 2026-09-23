import "server-only";
import { db } from "@/server/db";
import { unstable_cache } from "next/cache";
import type { Brand } from "@/generated/prisma/client";

/**
 * Public brand reads. Every function here filters status: 'ACTIVE' — a
 * hidden brand simply doesn't exist to the public site or its API.
 */

export const getActiveBrands = unstable_cache(
  async (): Promise<Brand[]> => {
    return db.brand.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
    });
  },
  ["public-brands-active"],
  { tags: ["brands"], revalidate: 3600 },
);

export async function getActiveBrandBySlug(slug: string): Promise<Brand | null> {
  return unstable_cache(
    async () => db.brand.findFirst({ where: { slug, status: "ACTIVE" } }),
    [`public-brand-${slug}`],
    { tags: ["brands", `brand:${slug}`], revalidate: 3600 },
  )();
}

/**
 * The Bookends Hospitality "brand" row is the homepage's own content
 * (editable in admin like any other brand), not one of the four public
 * brand sites — it's fetched regardless of status, and separately from
 * `getActiveBrands`, which only lists brands that get their own /[brand] site.
 */
export async function getPortalBrand(): Promise<Brand | null> {
  return unstable_cache(
    async () => db.brand.findFirst({ where: { slug: "bookends" } }),
    ["public-portal-brand"],
    { tags: ["brands", "brand:bookends"], revalidate: 3600 },
  )();
}
