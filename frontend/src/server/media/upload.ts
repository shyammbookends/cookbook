// import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/server/db";
import { getStorage } from "@/server/media/storage";
import { detectAndValidateImage, processImage } from "@/server/media/pipeline";
import { UploadError } from "@/server/media/errors";
import { Prisma } from "@/generated/prisma/client";
import type { Media } from "@/generated/prisma/client";

/** Display-only name: no path parts, control chars or odd characters; the file is never written under this name. */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/[^\p{L}\p{N}._ -]/gu, "_").replace(/^\.+/, "").slice(0, 120);
  return clean || "image";
}

export async function uploadImage(opts: {
  buffer: Buffer;
  originalName: string;
  alt?: string | null;
  brandId?: string | null;
  uploadedById?: string | null;
}): Promise<Media> {
  const { mime } = await detectAndValidateImage(opts.buffer).catch((e) => {
    throw new UploadError(e instanceof Error ? e.message : "Invalid image.");
  });

  const sha256Peek = createHash("sha256").update(opts.buffer).digest("hex");
  const existing = await db.media.findFirst({ where: { sha256: sha256Peek, status: "READY", deletedAt: null } });
  if (existing) return existing;

  const draft = await db.media.create({
    data: {
      kind: "IMAGE",
      storageKey: "",
      originalName: sanitizeFilename(opts.originalName),
      mime,
      bytes: opts.buffer.byteLength,
      sha256: sha256Peek,
      alt: opts.alt ?? null,
      brandId: opts.brandId ?? null,
      uploadedById: opts.uploadedById ?? null,
      status: "PROCESSING",
    },
  });

  try {
    const processed = await processImage(opts.buffer, draft.id);
    const storage = getStorage();
    for (const file of processed.files) {
      await storage.put(file.key, file.data, file.contentType);
    }

    return await db.media.update({
      where: { id: draft.id },
      data: {
        storageKey: `media/${draft.id}`,
        width: processed.width,
        height: processed.height,
        variants: processed.variants as unknown as Prisma.InputJsonValue,
        blurDataUrl: processed.blurDataUrl,
        dominantColor: processed.dominantColor,
        status: "READY",
      },
    });
  } catch (err) {
    await db.media.update({
      where: { id: draft.id },
      data: { status: "FAILED", failureReason: err instanceof Error ? err.message : "Processing failed." },
    });
    throw new UploadError(err instanceof Error ? err.message : "Image processing failed.");
  }
}
