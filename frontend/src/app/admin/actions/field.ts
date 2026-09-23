"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/guard";
import { db } from "@/server/db";
import { toSafeError } from "@/lib/errors";
import type { ActionResult } from "@/app/admin/actions/recipe";

const FieldDefinitionInputSchema = z.object({
  key: z.string().trim().min(1).max(60).regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers and underscores only."),
  label: z.string().trim().min(1).max(80),
  type: z.enum(["TEXT", "LONGTEXT", "NUMBER", "BOOLEAN", "SELECT", "MULTISELECT", "URL", "DATE"]),
  required: z.boolean().default(false),
  brandId: z.string().cuid().optional().nullable(),
  showOnFrontend: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type FieldDefinitionInput = z.infer<typeof FieldDefinitionInputSchema>;

function fail(err: unknown): ActionResult<never> {
  const safe = toSafeError(err);
  return { ok: false, error: safe.body.error.message, fieldErrors: safe.body.error.fieldErrors };
}

export async function createFieldDefinitionAction(input: FieldDefinitionInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin("ADMIN");
    const data = FieldDefinitionInputSchema.parse(input);
    const field = await db.fieldDefinition.create({ data });
    revalidatePath("/admin/settings");
    return { ok: true, data: { id: field.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteFieldDefinitionAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin("ADMIN");
    await db.fieldDefinition.delete({ where: { id } });
    revalidatePath("/admin/settings");
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}
