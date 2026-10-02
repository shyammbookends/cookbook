"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/guard";
import { db } from "@/server/db";
import * as taxonomyService from "@/server/services/taxonomy";
import type { CategoryInput, TagInput } from "@/server/services/taxonomy";
import { toSafeError } from "@/lib/errors";
import type { ActionResult } from "@/app/admin/actions/recipe";

function fail(err: unknown): ActionResult<never> {
  const safe = toSafeError(err);
  return { ok: false, error: safe.body.error.message, fieldErrors: safe.body.error.fieldErrors };
}

export async function createCategoryAction(input: CategoryInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin("EDITOR");
    const cat = await taxonomyService.createCategory(taxonomyService.CategoryInputSchema.parse(input));
    revalidatePath("/admin/categories");
    revalidatePath("/", "layout");
    return { ok: true, data: { id: cat.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function updateCategoryAction(id: string, input: CategoryInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin("EDITOR");
    const cat = await taxonomyService.updateCategory(id, taxonomyService.CategoryInputSchema.parse(input));
    revalidatePath("/admin/categories");
    revalidatePath("/", "layout");
    return { ok: true, data: { id: cat.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin("EDITOR");
    await taxonomyService.deleteCategory(id);
    revalidatePath("/admin/categories");
    revalidatePath("/", "layout");
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}

export async function createTagAction(input: TagInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin("EDITOR");
    const tag = await taxonomyService.createTag(taxonomyService.TagInputSchema.parse(input));
    revalidatePath("/admin/categories");
    return { ok: true, data: { id: tag.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteTagAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin("EDITOR");
    await taxonomyService.deleteTag(id);
    revalidatePath("/admin/categories");
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}

export async function uploadCategoryImageAction(categoryId: string, formData: FormData): Promise<ActionResult<{ id: string; mediaId: string }>> {
  try {
    const admin = await requireAdmin("EDITOR");
    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "No image file provided." };

    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: { brand: { select: { slug: true } } },
    });
    if (!category) return { ok: false, error: "Category not found." };

    const buffer = Buffer.from(await file.arrayBuffer());
    const { uploadImage } = await import("@/server/media/upload");
    const media = await uploadImage({
      buffer,
      originalName: file.name,
      brandId: category.brandId,
      alt: `${category.name} Category`,
      uploadedById: admin.id,
    });

    await db.category.update({
      where: { id: categoryId },
      data: { imageId: media.id },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/", "layout");
    return { ok: true, data: { id: categoryId, mediaId: media.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function setCategoryImageUrlAction(categoryId: string, url: string): Promise<ActionResult<{ id: string; mediaId: string }>> {
  try {
    const admin = await requireAdmin("EDITOR");
    if (!url || !url.trim()) return { ok: false, error: "No URL provided." };

    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: { brand: { select: { slug: true } } },
    });
    if (!category) return { ok: false, error: "Category not found." };

    const { fetchImageFromUrl } = await import("@/server/media/fetchUrl");
    const { uploadImage } = await import("@/server/media/upload");
    const buffer = await fetchImageFromUrl(url.trim());
    const media = await uploadImage({
      buffer,
      originalName: url.split("/").pop()?.split("?")[0] || "category-image",
      brandId: category.brandId,
      alt: `${category.name} Category`,
      uploadedById: admin.id,
    });

    await db.category.update({
      where: { id: categoryId },
      data: { imageId: media.id },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/", "layout");
    return { ok: true, data: { id: categoryId, mediaId: media.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function removeCategoryImageAction(categoryId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin("EDITOR");
    await db.category.update({
      where: { id: categoryId },
      data: { imageId: null },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/", "layout");
    return { ok: true, data: { id: categoryId } };
  } catch (err) {
    return fail(err);
  }
}

