import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActiveBrandBySlug } from "@/server/public/brands";
import { BrandShell } from "@/components/views/BrandShell";

export async function generateMetadata(props: PageProps<"/[brand]">): Promise<Metadata> {
  const { brand: slug } = await props.params;
  const brand = await getActiveBrandBySlug(slug);
  if (!brand) return {};
  const title = brand.seoTitle || brand.name;
  const description = brand.seoDescription || brand.tagline || brand.description || undefined;
  return {
    title: { default: title, template: `%s | ${brand.name}` },
    description,
    openGraph: { title, description, siteName: brand.name },
  };
}

export default async function BrandLayout(props: LayoutProps<"/[brand]">) {
  const { brand: slug } = await props.params;
  const brand = await getActiveBrandBySlug(slug);
  if (!brand) notFound();

  return <BrandShell brand={brand}>{props.children}</BrandShell>;
}
