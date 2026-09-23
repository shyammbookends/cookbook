"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/guard";
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
