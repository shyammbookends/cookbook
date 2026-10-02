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

export function getCategoryImageUrl(category?: {
  slug?: string | null;
  name?: string | null;
  image?: {
    id?: string | null;
    storageKey?: string | null;
    sourceUrl?: string | null;
    variants?: unknown;
  } | null;
} | null): string {
  if (category?.image) {
    if (category.image.sourceUrl && /^https?:\/\//.test(category.image.sourceUrl)) {
      return category.image.sourceUrl;
    }
    if (category.image.variants) {
      const largest = largestVariantUrl(category.image as MediaLike);
      if (largest) return largest;
    }
    if (category.image.storageKey) {
      const key = category.image.storageKey;
      if (/^https?:\/\//.test(key)) return key;
      if (key.startsWith("/")) return key;
      return `/media/${key.replace(/^media\//, "")}`;
    }
    if (category.image.id) {
      return `/media/${category.image.id}`;
    }
  }

  const s = ((category?.slug || "") + " " + (category?.name || "")).toLowerCase();
  if (s.includes("pizza") || s.includes("pie")) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80";
  }
  if (s.includes("pasta") || s.includes("noodle") || s.includes("spaghetti")) {
    return "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80";
  }
  if (s.includes("drink") || s.includes("beverage") || s.includes("bar") || s.includes("cocktail") || s.includes("wine") || s.includes("beer")) {
    return "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80";
  }
  if (s.includes("dessert") || s.includes("sweet") || s.includes("cake") || s.includes("ice-cream") || s.includes("tiramisu")) {
    return "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=800&q=80";
  }
  if (s.includes("salad") || s.includes("healthy") || s.includes("green") || s.includes("caprese")) {
    return "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80";
  }
  if (s.includes("appetiser") || s.includes("appetizer") || s.includes("starter") || s.includes("side") || s.includes("snack") || s.includes("knot")) {
    return "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80";
  }
  if (s.includes("burger") || s.includes("sandwich")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80";
  }
  return "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80";
}
