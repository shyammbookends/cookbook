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
