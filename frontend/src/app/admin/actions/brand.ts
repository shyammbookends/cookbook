"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/guard";
import * as brandService from "@/server/services/brand";
import type { BrandInput } from "@/server/services/brand";
import { toSafeError } from "@/lib/errors";
import type { ActionResult } from "@/app/admin/actions/recipe";

function fail(err: unknown): ActionResult<never> {
  const safe = toSafeError(err);
  return { ok: false, error: safe.body.error.message, fieldErrors: safe.body.error.fieldErrors };
}

export async function createBrandAction(input: BrandInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin("ADMIN");
    const brand = await brandService.createBrand(brandService.BrandInputSchema.parse(input));
    revalidatePath("/admin/brands");
    return { ok: true, data: { id: brand.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function updateBrandAction(id: string, input: BrandInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin("ADMIN");
    const brand = await brandService.updateBrand(id, brandService.BrandInputSchema.parse(input));
    revalidatePath("/admin/brands");
    revalidatePath(`/admin/brands/${id}`);
    return { ok: true, data: { id: brand.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function setBrandStatusAction(id: string, status: "ACTIVE" | "HIDDEN"): Promise<ActionResult> {
  try {
    await requireAdmin("ADMIN");
    await brandService.setBrandStatus(id, status);
    revalidatePath("/admin/brands");
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteBrandAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin("ADMIN");
    await brandService.deleteBrand(id);
    revalidatePath("/admin/brands");
    revalidatePath("/", "layout");
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteBrandsAction(ids: string[]): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAdmin("ADMIN");
    for (const id of ids) await brandService.deleteBrand(id);
    revalidatePath("/admin/brands");
    revalidatePath("/", "layout");
    return { ok: true, data: { count: ids.length } };
  } catch (err) {
    return fail(err);
  }
}
