import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { AdminPortalShell } from "@/components/admin/AdminPortalShell";
import { SimpleBrandForm } from "@/components/admin/SimpleBrandForm";
import { DeleteBrandButton } from "@/components/admin/DeleteBrandButton";

export const metadata = { title: "Edit Brand" };

export default async function AdminEditBrandPage(props: PageProps<"/admin/brands-categories/[id]">) {
  const { id } = await props.params;
  const brand = await db.brand.findUnique({ where: { id }, include: { _count: { select: { recipes: true, categories: true } } } });
  if (!brand) notFound();

  return (
    <AdminPortalShell
      title={`Edit: ${brand.name}`}
      back={{ href: "/admin/brands-categories", label: "Back to Brands & Categories" }}
      actions={
        brand.slug !== "bookends" && (
          <DeleteBrandButton
            id={brand.id}
            name={brand.name}
            recipeCount={brand._count.recipes}
            categoryCount={brand._count.categories}
            redirectTo="/admin/brands-categories"
          />
        )
      }
    >
      <SimpleBrandForm
        id={brand.id}
        savedHrefBase="/admin/brands-categories"
        initial={{
          slug: brand.slug, name: brand.name, number: brand.number, eyebrow: brand.eyebrow, tagline: brand.tagline,
          quote: brand.quote, description: brand.description, handle: brand.handle, followerLabel: brand.followerLabel,
          personality: brand.personality, moodFeel: brand.moodFeel, promise: brand.promise,
          voiceWords: brand.voiceWords, sampleLines: brand.sampleLines,
          status: brand.status, theme: brand.theme as never, seoTitle: brand.seoTitle, seoDescription: brand.seoDescription,
          sortOrder: brand.sortOrder,
        }}
      />
    </AdminPortalShell>
  );
}
