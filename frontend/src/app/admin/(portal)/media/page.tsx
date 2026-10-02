import { db } from "@/server/db";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { largestVariantUrl } from "@/lib/media";

export const metadata = { title: "Media Library" };

export default async function MediaPage() {
  const [media, brands] = await Promise.all([
    db.media.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 500 }),
    db.brand.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  // Which recipe(s) each image belongs to (hero photo or gallery), so the library can label every image.
  const ids = media.map((m) => m.id);
  const live = { deletedAt: null } as const;
  const [heroes, gallery] = await Promise.all([
    db.recipe.findMany({ where: { heroImageId: { in: ids }, ...live }, select: { title: true, heroImageId: true, brand: { select: { name: true } } } }),
    db.recipeMedia.findMany({ where: { mediaId: { in: ids }, recipe: live }, select: { mediaId: true, recipe: { select: { title: true, brand: { select: { name: true } } } } } }),
  ]);
  const recipesByMedia = new Map<string, { title: string; brand: string }[]>();
  const link = (mediaId: string | null, title: string, brand: string) => {
    if (!mediaId) return;
    const list = recipesByMedia.get(mediaId) ?? [];
    if (!list.some((r) => r.title === title && r.brand === brand)) list.push({ title, brand });
    recipesByMedia.set(mediaId, list);
  };
  heroes.forEach((r) => link(r.heroImageId, r.title, r.brand.name));
  gallery.forEach((g) => link(g.mediaId, g.recipe.title, g.recipe.brand.name));

  return (
    <AdminPortalShell title="Media Library" back={{ href: "/admin", label: "Back to Admin Portal" }}>
      <MediaLibrary
        initialMedia={media.map((m) => ({
          id: m.id,
          url: largestVariantUrl({ id: m.id, variants: m.variants }),
          alt: m.alt,
          status: m.status,
          bytes: m.bytes,
          createdAt: m.createdAt.toISOString(),
          recipes: recipesByMedia.get(m.id) ?? [],
        }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      />
    </AdminPortalShell>
  );
}
