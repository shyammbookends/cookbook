"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/guard";
import * as importService from "@/server/import/service";
import type { ImportOptions } from "@/server/import/validate";
import type { NormalizedRow } from "@/server/import/normalize";
import { toSafeError } from "@/lib/errors";
import type { ActionResult } from "@/app/admin/actions/recipe";

function fail(err: unknown): ActionResult<never> {
  const safe = toSafeError(err);
  return { ok: false, error: safe.body.error.message, fieldErrors: safe.body.error.fieldErrors };
}

export async function startImportAction(formData: FormData): Promise<ActionResult<{ jobId: string; duplicateOfJobId: string | null }>> {
  try {
    const admin = await requireAdmin("EDITOR");
    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "No file provided." };
    const buffer = Buffer.from(await file.arrayBuffer());
    const { job, duplicateOfJobId } = await importService.startImportJob(buffer, file.name, admin);
    return { ok: true, data: { jobId: job.id, duplicateOfJobId } };
  } catch (err) {
    return fail(err);
  }
}

export async function updateMappingAction(jobId: string, mapping: Record<number, string | null>): Promise<ActionResult> {
  try {
    await requireAdmin("EDITOR");
    await importService.updateMapping(jobId, mapping);
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}

export async function runValidationAction(
  jobId: string,
  options?: Partial<ImportOptions>,
): Promise<ActionResult<{ valid: number; warning: number; error: number; duplicate: number; total: number }>> {
  try {
    await requireAdmin("EDITOR");
    const result = await importService.runValidation(jobId, options);
    return { ok: true, data: result };
  } catch (err) {
    return fail(err);
  }
}

export async function patchImportRowAction(
  jobId: string,
  rowId: string,
  patch: Partial<NormalizedRow>,
  options: ImportOptions,
): Promise<ActionResult> {
  try {
    await requireAdmin("EDITOR");
    await importService.patchImportRow(jobId, rowId, patch, options);
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}

export async function getImportRowsAction(jobId: string, status?: string, page = 1) {
  await requireAdmin("EDITOR");
  return importService.listImportRows(jobId, { status, page });
}

export async function getImportJobAction(jobId: string) {
  await requireAdmin("EDITOR");
  return importService.getImportJob(jobId);
}

export async function confirmImportAction(jobId: string): Promise<ActionResult<{ imported: number; skipped: number; failed: number }>> {
  try {
    const admin = await requireAdmin("EDITOR");
    const result = await importService.confirmImport(jobId, admin);
    revalidatePath("/admin/recipes");
    revalidatePath("/admin/import/history");
    revalidatePath("/", "layout");
    return { ok: true, data: result };
  } catch (err) {
    return fail(err);
  }
}

export async function rollbackImportAction(jobId: string): Promise<ActionResult<{ trashed: number }>> {
  try {
    await requireAdmin("ADMIN");
    const count = await importService.rollbackImportJob(jobId);
    revalidatePath("/admin/recipes");
    revalidatePath("/admin/import/history");
    return { ok: true, data: { trashed: count } };
  } catch (err) {
    return fail(err);
  }
}

export async function cancelImportAction(jobId: string): Promise<ActionResult> {
  try {
    await requireAdmin("EDITOR");
    await importService.cancelImportJob(jobId);
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}
