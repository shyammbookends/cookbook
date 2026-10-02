import { notFound } from "next/navigation";
import { getActiveBrandBySlug } from "@/server/public/brands";
import { BrandShell } from "@/components/views/BrandShell";

export default async function AdminBrandLayout(props: LayoutProps<"/admin/[brand]">) {
  const { brand: slug } = await props.params;
  const brand = await getActiveBrandBySlug(slug);
  if (!brand) notFound();

  return <BrandShell brand={brand} base="/admin">{props.children}</BrandShell>;
}
