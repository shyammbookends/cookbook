import { notFound } from "next/navigation";
import { getBrand } from "@/server/services/brand";
import { BrandForm } from "@/components/admin/BrandForm";

export const metadata = { title: "Edit Brand" };

export default async function EditBrandPage(props: PageProps<"/admin/brands/[id]">) {
  const { id } = await props.params;
  const brand = await getBrand(id).catch(() => null);
  if (!brand) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{brand.name}</h1>
      <BrandForm
        id={brand.id}
        initial={{
          slug: brand.slug, name: brand.name, number: brand.number, eyebrow: brand.eyebrow, tagline: brand.tagline,
          quote: brand.quote, description: brand.description, handle: brand.handle, followerLabel: brand.followerLabel,
          personality: brand.personality, moodFeel: brand.moodFeel, promise: brand.promise,
          voiceWords: brand.voiceWords, sampleLines: brand.sampleLines,
          status: brand.status, theme: brand.theme as never, seoTitle: brand.seoTitle, seoDescription: brand.seoDescription,
          sortOrder: brand.sortOrder,
        }}
      />
    </div>
  );
}
