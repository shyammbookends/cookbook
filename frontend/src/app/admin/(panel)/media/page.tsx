import { db } from "@/server/db";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { largestVariantUrl } from "@/lib/media";

export const metadata = { title: "Media" };

export default async function MediaPage() {
  const [media, brands] = await Promise.all([
    db.media.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.brand.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Media</h1>
      <MediaLibrary
        initialMedia={media.map((m) => ({
          id: m.id,
          url: largestVariantUrl({ id: m.id, variants: m.variants }),
          alt: m.alt,
          status: m.status,
          bytes: m.bytes,
          createdAt: m.createdAt.toISOString(),
        }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}
