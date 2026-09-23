"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/guard";
import { uploadImage } from "@/server/media/upload";
import { fetchImageFromUrl } from "@/server/media/fetchUrl";
import { db } from "@/server/db";
import { toSafeError } from "@/lib/errors";
import type { ActionResult } from "@/app/admin/actions/recipe";

function fail(err: unknown): ActionResult<never> {
  const safe = toSafeError(err);
  return { ok: false, error: safe.body.error.message, fieldErrors: safe.body.error.fieldErrors };
}

export async function uploadMediaAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin("EDITOR");
    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "No file provided." };

    const buffer = Buffer.from(await file.arrayBuffer());
    const brandId = (formData.get("brandId") as string) || null;
    const alt = (formData.get("alt") as string) || null;

    const media = await uploadImage({ buffer, originalName: file.name, brandId, alt, uploadedById: admin.id });
    revalidatePath("/admin/media");
    return { ok: true, data: { id: media.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function uploadMediaFromUrlAction(url: string, brandId?: string, alt?: string): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin("EDITOR");
    const buffer = await fetchImageFromUrl(url);
    const media = await uploadImage({
      buffer, originalName: url.split("/").pop() ?? "image", brandId: brandId ?? null, alt: alt ?? null, uploadedById: admin.id,
    });
    revalidatePath("/admin/media");
    return { ok: true, data: { id: media.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteMediaAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin("EDITOR");
    const inUse = await db.recipe.count({ where: { heroImageId: id } });
    const inGallery = await db.recipeMedia.count({ where: { mediaId: id } });
    if (inUse > 0 || inGallery > 0) {
      return { ok: false, error: `This image is used by ${inUse + inGallery} recipe(s). Remove it there first.` };
    }
    await db.media.update({ where: { id }, data: { deletedAt: new Date() } });
    revalidatePath("/admin/media");
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}
