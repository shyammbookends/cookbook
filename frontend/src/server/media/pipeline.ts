import "server-only";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";

export const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"]);
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const VARIANT_WIDTHS = [320, 640, 960, 1280, 1920];
const VARIANT_FORMATS = ["avif", "webp"] as const;

export interface ImageVariant {
  w: number;
  format: "avif" | "webp" | "original";
  key: string;
  bytes: number;
}

export interface ProcessedImage {
  width: number;
  height: number;
  sha256: string;
  blurDataUrl: string;
  dominantColor: string;
  variants: ImageVariant[];
  files: { key: string; data: Buffer; contentType: string }[];
}

/**
 * Verifies the file's REAL type from its magic bytes (never trust the
 * filename or the declared Content-Type), rejecting anything outside the
 * allow-list before it ever reaches sharp.
 */
export async function detectAndValidateImage(buffer: Buffer): Promise<{ mime: string; ext: string }> {
  if (buffer.byteLength === 0) {
    throw new Error("Empty file.");
  }
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error(`File is too large (max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB).`);
  }
  const type = await fileTypeFromBuffer(buffer);
  if (!type || !ALLOWED_IMAGE_MIME.has(type.mime)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WebP or AVIF.");
  }
  return { mime: type.mime, ext: type.ext };
}

/**
 * sharp strips EXIF/GPS metadata by default (it's only kept if you call
 * `.withMetadata()`, which we deliberately never do), auto-orients from the
 * EXIF rotation flag, then re-encodes into responsive AVIF/WebP variants.
 */
export async function processImage(buffer: Buffer, idPrefix: string): Promise<ProcessedImage> {
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const base = sharp(buffer, { failOn: "truncated" }).rotate();
  const meta = await base.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) throw new Error("Could not read image dimensions.");

  const files: ProcessedImage["files"] = [];
  const variants: ImageVariant[] = [];

  const widths = VARIANT_WIDTHS.filter((w) => w <= width);
  if (widths.length === 0 || widths[widths.length - 1] !== width) {
    widths.push(width <= VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1] ? width : VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1]);
  }

  for (const w of widths) {
    for (const format of VARIANT_FORMATS) {
      const pipeline = sharp(buffer).rotate().resize({ width: w, withoutEnlargement: true });
      const data = format === "avif" ? await pipeline.avif({ quality: 55 }).toBuffer() : await pipeline.webp({ quality: 72 }).toBuffer();
      const key = `media/${idPrefix}/${w}.${format}`;
      files.push({ key, data, contentType: `image/${format}` });
      variants.push({ w, format, key, bytes: data.byteLength });
    }
  }

  // Tiny blur placeholder, inlined as a data URL (no extra network round trip).
  const tiny = await sharp(buffer).rotate().resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
  const blurDataUrl = `data:image/webp;base64,${tiny.toString("base64")}`;

  const { dominant } = await sharp(buffer).stats();
  const dominantColor = `rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`;

  return { width, height, sha256, blurDataUrl, dominantColor, variants, files };
}
