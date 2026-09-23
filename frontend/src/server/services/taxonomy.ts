import "server-only";
import { db } from "@/server/db";
import { revalidateTag } from "@/server/cache";
import { toSlug } from "@/lib/slug";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { z } from "zod";

const NameSlugSchema = z.object({
  brandId: z.string().cuid(),
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().max(80).optional(),
});

export const CategoryInputSchema = NameSlugSchema.extend({
  description: z.string().trim().max(500).optional().nullable(),
  imageId: z.string().cuid().optional().nullable(),
  sortOrder: z.number().int().default(0),
});
export type CategoryInput = z.infer<typeof CategoryInputSchema>;

export const TagInputSchema = NameSlugSchema;
export type TagInput = z.infer<typeof TagInputSchema>;

async function revalidateBrand(brandId: string) {
  const brand = await db.brand.findUnique({ where: { id: brandId }, select: { slug: true } });
  if (brand) revalidateTag(`brand:${brand.slug}`);
}

export async function listCategories(brandId?: string) {
  return db.category.findMany({ where: brandId ? { brandId } : undefined, orderBy: { sortOrder: "asc" }, include: { brand: true } });
}

export async function createCategory(input: CategoryInput) {
  const slug = toSlug(input.slug || input.name);
  const clash = await db.category.findUnique({ where: { brandId_slug: { brandId: input.brandId, slug } } });
  if (clash) throw new ValidationError("A category with that slug already exists for this brand.");
  const category = await db.category.create({ data: { ...input, slug } });
  await revalidateBrand(input.brandId);
  return category;
}

export async function updateCategory(id: string, input: CategoryInput) {
  const current = await db.category.findUnique({ where: { id } });
  if (!current) throw new NotFoundError("Category");
  const slug = toSlug(input.slug || input.name);
  if (slug !== current.slug || input.brandId !== current.brandId) {
    const clash = await db.category.findFirst({ where: { brandId: input.brandId, slug, id: { not: id } } });
    if (clash) throw new ConflictError("A category with that slug already exists for this brand.");
  }
  const updated = await db.category.update({ where: { id }, data: { ...input, slug } });
  await revalidateBrand(input.brandId);
  return updated;
}

export async function deleteCategory(id: string) {
  const category = await db.category.findUnique({ where: { id }, include: { _count: { select: { recipes: true } } } });
  if (!category) throw new NotFoundError("Category");
  if (category._count.recipes > 0) {
    throw new ValidationError(
      `This category has ${category._count.recipes} recipe(s). Move them to another category first.`,
    );
  }
  await db.category.delete({ where: { id } });
  await revalidateBrand(category.brandId);
}

export async function listTags(brandId?: string) {
  return db.tag.findMany({ where: brandId ? { brandId } : undefined, orderBy: { name: "asc" } });
}

export async function findOrCreateTagsByName(brandId: string, names: string[]) {
  const ids: string[] = [];
  for (const rawName of names) {
    const name = rawName.trim();
    if (!name) continue;
    const slug = toSlug(name);
    const tag = await db.tag.upsert({
      where: { brandId_slug: { brandId, slug } },
      create: { brandId, slug, name },
      update: {},
    });
    ids.push(tag.id);
  }
  return ids;
}

export async function createTag(input: TagInput) {
  const slug = toSlug(input.slug || input.name);
  const clash = await db.tag.findUnique({ where: { brandId_slug: { brandId: input.brandId, slug } } });
  if (clash) throw new ValidationError("A tag with that slug already exists for this brand.");
  return db.tag.create({ data: { ...input, slug } });
}

export async function deleteTag(id: string) {
  const tag = await db.tag.findUnique({ where: { id } });
  if (!tag) throw new NotFoundError("Tag");
  await db.tag.delete({ where: { id } }); // RecipeTag cascades
  await revalidateBrand(tag.brandId);
}
