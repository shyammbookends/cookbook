import "server-only";
import { db } from "@/server/db";
import { getCurrentAdmin } from "@/server/auth/session";
import { localRead } from "@/server/media/localfs";
import { readStoredFile } from "@/server/media/storage";
import { asVariants } from "@/lib/media";

const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const EXT_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

const PUBLISHED = { status: "PUBLISHED", deletedAt: null } as const;

/**
 * An image is public ONLY while it is part of published content (a published recipe's
 * hero/gallery/step photo, a brand's logo/mark/social image, a category cover).
 * Everything else — drafts, trashed recipes, the unattached admin library — needs an
 * admin session. Unknown/guessed ids get the same 404 as forbidden ones.
 */
async function isPublicMedia(mediaId: string): Promise<boolean> {
  const hit = await db.media.findFirst({
    where: {
      id: mediaId,
      status: "READY",
      deletedAt: null,
      OR: [
        { recipeHeroFor: { some: PUBLISHED } },
        { recipeGalleryOf: { some: { recipe: PUBLISHED } } },
        { recipeStepOf: { some: { recipe: PUBLISHED } } },
        { brandsAsLogo: { some: {} } },
        { brandsAsMark: { some: {} } },
        { brandsAsOgImage: { some: {} } },
        { categoryOf: { some: {} } },
      ],
    },
    select: { id: true },
  });
  return !!hit;
}

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

export async function serveMedia(segments: string[]): Promise<Response> {
  if (segments.length < 1 || segments.length > 2 || !segments.every((s) => SAFE_SEGMENT.test(s) && !s.includes(".."))) {
    return notFound();
  }
  const mediaId = segments[0];

  // The file is fetched from storage WHILE the access check runs (they are
  // independent round trips), but it is only returned once the check passes.
  const filePromise = (async () => {
    if (segments.length === 2) return readStoredFile(`media/${segments.join("/")}`);
    // Bare "/media/<id>" → the largest WebP variant.
    const media = await db.media.findFirst({ where: { id: mediaId, deletedAt: null }, select: { variants: true } });
    const best = asVariants(media?.variants).filter((v) => v.format === "webp").sort((a, b) => b.w - a.w)[0];
    return best ? readStoredFile(best.key) : null;
  })();
  filePromise.catch(() => {}); // handled below; avoids an unhandled rejection when access is denied

  const isPublic = await isPublicMedia(mediaId);
  if (!isPublic) {
    // Not part of published content: only a signed-in admin may see it (drafts, library previews).
    const admin = await getCurrentAdmin().catch(() => null);
    if (!admin) return notFound();
  }

  const key = `media/${segments.join("/")}`;
  let file: { data: Buffer; contentType: string } | null = null;
  try {
    file = await filePromise;
  } catch (err) {
    console.error("media decrypt/read failed", err instanceof Error ? err.message : err);
    return new Response("Media unavailable", { status: 500, headers: { "Cache-Control": "no-store" } });
  }

  // Dev only: files written by the `local` driver before the DB store existed.
  if (!file && process.env.STORAGE_DRIVER === "local") {
    const data = await localRead(key);
    if (data) file = { data, contentType: EXT_TYPES[key.slice(key.lastIndexOf(".")).toLowerCase()] ?? "application/octet-stream" };
  }
  if (!file) return notFound();

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.data.byteLength),
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
      // Public images may be CDN-cached; draft/library images are private and never cached.
      // A key never changes content (new uploads get a new media id), so public copies
      // can stay cached for long: 7 days in the browser, 30 days on Vercel's CDN.
      "Cache-Control": isPublic ? "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400" : "private, no-store",
    },
  });
}
