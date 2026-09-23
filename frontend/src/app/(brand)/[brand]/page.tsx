import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveBrandBySlug } from "@/server/public/brands";
import { getBrandVisuals } from "@/brands/registry";
import { BrandThemeSchema } from "@/lib/schemas/theme";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { BrandVoice } from "@/components/recipe/BrandVoice";
import { Reveal } from "@/components/motion/Reveal";

export default async function BrandHomePage(props: PageProps<"/[brand]">) {
  const { brand: slug } = await props.params;
  const brand = await getActiveBrandBySlug(slug);
  if (!brand) notFound();

  const theme = BrandThemeSchema.parse(brand.theme);
  const [{ Scene3D }] = await Promise.all([
    getBrandVisuals(brand.slug),
  ]);

  return (
    <>
      <section className="relative flex min-h-[65vh] flex-col items-center justify-center overflow-hidden">
        <Reveal>
          <h1 
            className="text-7xl font-bold tracking-tight sm:text-[10rem] md:text-[12rem] text-center" 
            style={{ 
              fontFamily: {
                script: 'var(--font-script)',
                marker: 'var(--font-marker)',
                'flared-serif': 'var(--font-flared)',
                grotesk: 'var(--font-display)',
                heavy: 'var(--font-display)',
              }[theme.fontDisplay] || 'var(--font-display)',
              lineHeight: 1
            }}
          >
            {brand.name}
          </h1>
        </Reveal>
      </section>

      <BrandVoice
        personality={brand.personality}
        moodFeel={brand.moodFeel}
        promise={brand.promise}
        voiceWords={brand.voiceWords}
        sampleLines={brand.sampleLines}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Reveal>
          <h2 className="mb-4 text-2xl font-bold">Menu</h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { title: "Main Menu", slug: "main-menu", image: "/images/category_main_menu.jpg" },
            { title: "Drinks", slug: "drinks", image: "/images/category_drinks.jpg" },
            { title: "Desserts", slug: "desserts", image: "/images/category_desserts.jpg" },
          ].map((c) => (
            <Link
              key={c.slug}
              href={`/${brand.slug}/category/${c.slug}`}
              className="group relative flex h-32 md:h-40 lg:h-48 flex-col items-center justify-center overflow-hidden rounded-2xl bg-brand-card-bg shadow-lg shadow-black/10 transition-all hover:shadow-2xl"
            >
              <img 
                src={c.image} 
                alt={c.title} 
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-black/40 transition-colors duration-500 group-hover:bg-black/30" />
              <h3 className="relative z-10 text-2xl font-bold text-white tracking-wide">{c.title}</h3>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
