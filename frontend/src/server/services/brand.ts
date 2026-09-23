import "server-only";
import { db } from "@/server/db";
import { revalidateTag } from "@/server/cache";
import { toSlug } from "@/lib/slug";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { BrandInputSchema, type BrandInput } from "@/lib/schemas/brand";

export { BrandInputSchema };
export type { BrandInput };

export async function listBrands() {
  return db.brand.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getBrand(id: string) {
  const brand = await db.brand.findUnique({ where: { id } });
  if (!brand) throw new NotFoundError("Brand");
  return brand;
}

export async function createBrand(input: BrandInput) {
  const slug = toSlug(input.slug);
  const clash = await db.brand.findUnique({ where: { slug } });
  if (clash) throw new ValidationError("That slug is already used by another brand.", { slug: ["Slug already in use."] });

  return db.brand.create({ data: { ...input, slug } });
}

export async function updateBrand(id: string, input: BrandInput) {
  const current = await db.brand.findUnique({ where: { id } });
  if (!current) throw new NotFoundError("Brand");

  const slug = toSlug(input.slug);
  if (slug !== current.slug) {
    const clash = await db.brand.findFirst({ where: { slug, id: { not: id } } });
    if (clash) throw new ConflictError("That slug is already used by another brand.");
  }

  const updated = await db.brand.update({ where: { id }, data: { ...input, slug } });
  revalidateTag("brands");
  revalidateTag(`brand:${current.slug}`);
  revalidateTag(`brand:${slug}`);
  return updated;
}

export async function setBrandStatus(id: string, status: "ACTIVE" | "HIDDEN") {
  const brand = await db.brand.update({ where: { id }, data: { status } });
  revalidateTag("brands");
  revalidateTag(`brand:${brand.slug}`);
  return brand;
}
