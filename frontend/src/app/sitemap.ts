import type { MetadataRoute } from "next";
import { getActiveBrands } from "@/server/public/brands";
import { getSitemapEntries } from "@/server/public/recipes";

// Data comes from PostgreSQL at request time; the build must not need a database connection.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.AUTH_URL ?? "http://localhost:3000";
  const brands = await getActiveBrands();

  const entries: MetadataRoute.Sitemap = [{ url: base, changeFrequency: "weekly", priority: 1 }];

  for (const brand of brands) {
    entries.push({ url: `${base}/${brand.slug}`, changeFrequency: "weekly", priority: 0.9 });
    entries.push({ url: `${base}/${brand.slug}/recipes`, changeFrequency: "daily", priority: 0.8 });

    const recipes = await getSitemapEntries(brand.id);
    for (const r of recipes) {
      entries.push({ url: `${base}/${brand.slug}/recipes/${r.slug}`, lastModified: r.updatedAt, changeFrequency: "monthly", priority: 0.7 });
    }
  }

  return entries;
}
