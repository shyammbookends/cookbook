export interface MediaVariant {
  w: number;
  format: "avif" | "webp" | "original";
  key: string;
  bytes: number;
}

export interface MediaLike {
  id: string;
  variants: unknown; // JSON from Prisma — validated by `asVariants` below
  blurDataUrl?: string | null;
  dominantColor?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
}

export function asVariants(json: unknown): MediaVariant[] {
  if (!Array.isArray(json)) return [];
  return json.filter(
    (v): v is MediaVariant =>
      typeof v === "object" && v !== null && "w" in v && "format" in v && "key" in v,
  );
}

// NEXT_PUBLIC_* is required here (not STORAGE_PUBLIC_BASE alone) because this
// module is also imported by client components (e.g. RecipeImage) — only
// NEXT_PUBLIC_-prefixed vars are inlined into the client bundle. The two
// should be kept equal; see .env.example.
const STORAGE_PUBLIC_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "";

export function mediaUrl(key: string): string {
  if (/^https?:\/\//.test(key)) return key;
  return `${STORAGE_PUBLIC_BASE}/${key}`;
}

export function buildSrcSet(media: MediaLike, format: "avif" | "webp"): string {
  const variants = asVariants(media.variants).filter((v) => v.format === format);
  return variants.map((v) => `${mediaUrl(v.key)} ${v.w}w`).join(", ");
}

export function largestVariantUrl(media: MediaLike): string | null {
  const variants = asVariants(media.variants);
  const webp = variants.filter((v) => v.format === "webp").sort((a, b) => b.w - a.w)[0];
  return webp ? mediaUrl(webp.key) : null;
}
