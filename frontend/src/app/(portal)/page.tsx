import type { Metadata } from "next";
import { getPortalBrand } from "@/server/public/brands";
import { PortalHomeView } from "@/components/views/PortalHomeView";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortalBrand();
  return {
    title: portal?.seoTitle || "Bookends Hospitality",
    description: portal?.seoDescription || portal?.tagline || undefined,
  };
}

export default function HomePage() {
  return <PortalHomeView />;
}
