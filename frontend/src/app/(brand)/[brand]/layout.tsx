import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActiveBrandBySlug } from "@/server/public/brands";
import { BrandThemeSchema, themeToCssVars } from "@/lib/schemas/theme";
import { BrandHeader } from "@/components/recipe/BrandHeader";
import { BrandFooter } from "@/components/recipe/BrandFooter";

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

  const theme = BrandThemeSchema.parse(brand.theme);
  const cssVars = themeToCssVars(theme);

  return (
    <div data-brand={brand.slug} style={cssVars as React.CSSProperties} className="flex min-h-screen flex-col print:!bg-[#FAF8F5]">
      <BrandHeader brand={brand} />
      <main className="flex-1">{props.children}</main>
      <BrandFooter brand={brand} />
    </div>
  );
}
