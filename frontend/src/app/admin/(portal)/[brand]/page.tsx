import { notFound } from "next/navigation";
import { getActiveBrandBySlug } from "@/server/public/brands";
import { BrandHomeView } from "@/components/views/BrandHomeView";

export default async function AdminBrandHomePage(props: PageProps<"/admin/[brand]">) {
  const { brand: slug } = await props.params;
  const brand = await getActiveBrandBySlug(slug);
  if (!brand) notFound();

  return <BrandHomeView brand={brand} base="/admin" />;
}
