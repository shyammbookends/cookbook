"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/guard";
import { RecipeInputSchema, type RecipeInput } from "@/lib/schemas/recipe";
import * as recipeService from "@/server/services/recipe";
import { findOrCreateTagsByName } from "@/server/services/taxonomy";
import { toSafeError } from "@/lib/errors";

/** The form submits human-typed tag names; this resolves/creates them and fills tagIds. */
async function withResolvedTags(input: RecipeInput & { tagNames?: string[] }): Promise<RecipeInput> {
  if (!input.tagNames?.length) return input;
  const tagIds = await findOrCreateTagsByName(input.brandId, input.tagNames);
  return { ...input, tagIds: [...new Set([...(input.tagIds ?? []), ...tagIds])] };
}

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function fail(err: unknown): ActionResult<never> {
  const safe = toSafeError(err);
  return { ok: false, error: safe.body.error.message, fieldErrors: safe.body.error.fieldErrors };
}

export async function createRecipeAction(input: RecipeInput & { tagNames?: string[] }): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin("EDITOR");
    const resolved = await withResolvedTags(input);
    const parsed = RecipeInputSchema.parse(resolved);
    const recipe = await recipeService.createRecipe(parsed, admin);
    revalidatePath("/admin/recipes");
    revalidatePath("/", "layout");
    return { ok: true, data: { id: recipe.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function updateRecipeAction(
  id: string,
  input: RecipeInput & { tagNames?: string[] },
  expectedVersion?: number,
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin("EDITOR");
    const resolved = await withResolvedTags(input);
    const parsed = RecipeInputSchema.parse(resolved);
    const recipe = await recipeService.updateRecipe(id, parsed, admin, { expectedVersion });
    revalidatePath("/admin/recipes");
    revalidatePath(`/admin/recipes/${id}`);
    revalidatePath("/", "layout");
    return { ok: true, data: { id: recipe.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function setRecipeStatusAction(id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED"): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("EDITOR");
    await recipeService.setRecipeStatus(id, status, admin);
    revalidatePath("/admin/recipes");
    revalidatePath("/", "layout");
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}

export async function duplicateRecipeAction(id: string, targetBrandId?: string): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin("EDITOR");
    const copy = await recipeService.duplicateRecipe(id, admin, targetBrandId);
    revalidatePath("/admin/recipes");
    revalidatePath("/", "layout");
    return { ok: true, data: { id: copy.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function trashRecipeAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("EDITOR");
    await recipeService.trashRecipe(id, admin);
    revalidatePath("/admin/recipes");
    revalidatePath("/", "layout");
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}

export async function bulkTrashRecipesAction(ids: string[]): Promise<ActionResult<{ count: number }>> {
  try {
    const admin = await requireAdmin("EDITOR");
    const result = await recipeService.trashRecipes(ids, admin);
    revalidatePath("/admin/recipes");
    revalidatePath("/", "layout");
    return { ok: true, data: { count: result.count } };
  } catch (err) {
    return fail(err);
  }
}


export async function restoreRecipeAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin("EDITOR");
    await recipeService.restoreRecipe(id, admin);
    revalidatePath("/admin/recipes");
    revalidatePath("/", "layout");
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}
