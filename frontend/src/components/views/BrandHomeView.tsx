import Link from "next/link";
import type { Brand } from "@/generated/prisma/client";
import { getBrandCategories } from "@/server/public/taxonomy";
import { BrandThemeSchema } from "@/lib/schemas/theme";
import { Reveal } from "@/components/motion/Reveal";
import { BeshakLogo } from "@/components/brand/BeshakLogo";
import { GhasletLogo } from "@/components/brand/GhasletLogo";
import { getCategoryImageUrl } from "@/lib/media";
import { DownloadCookbookButton } from "@/components/recipe/DownloadCookbookButton";

/** Brand home (logo + menu categories), shared by the public portal and the admin portal (base "/admin"). */
export async function BrandHomeView({ brand, base = "" }: { brand: Brand; base?: string }) {
  const theme = BrandThemeSchema.parse(brand.theme);
  const categories = await getBrandCategories(brand.id);

  return (
    <>
      <section className="relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden py-12">
        <Reveal>
          {brand.slug === "beshak" ? (
            <div className="flex justify-center px-4 w-full">
              <BeshakLogo color="white" className="w-full max-w-[500px] sm:max-w-[700px] md:max-w-[850px] h-auto drop-shadow-xl" />
            </div>
          ) : brand.slug === "ghaslet" ? (
            <div className="flex justify-center px-4 w-full">
              <GhasletLogo className="w-full max-w-[280px] sm:max-w-[380px] md:max-w-[440px] h-auto drop-shadow-2xl" />
            </div>
          ) : brand.slug === "capiche" ? (
            <h1 className="flex justify-center px-4">
              {/* The Capiche wordmark, exactly as designed. */}
              <img src="/brands/capiche-logo.png" alt="Capiche" className="h-auto w-full max-w-[320px] sm:max-w-[560px] md:max-w-[680px]" />
            </h1>
          ) : (
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
                lineHeight: 1,
              }}
            >
              {brand.name}
            </h1>
          )}
        </Reveal>
        {brand.tagline && (
          <Reveal>
            <p className="mt-4 text-xl md:text-2xl opacity-90 text-center font-medium px-4 max-w-2xl">
              {brand.tagline}
            </p>
          </Reveal>
        )}
        <Reveal>
          <DownloadCookbookButton brandSlug={brand.slug} brandName={brand.name} />
        </Reveal>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <Reveal>
            <h2 className="mb-4 text-2xl font-bold">Menu</h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {categories.map((c) => {
              const bgImage = getCategoryImageUrl(c);
              return (
                <Link
                  key={c.id}
                  href={`${base}/${brand.slug}/category/${c.slug}`}
                  className="group relative flex h-32 md:h-40 lg:h-48 flex-col items-center justify-center overflow-hidden rounded-2xl bg-brand-card-bg shadow-lg shadow-black/10 transition-all hover:shadow-2xl"
                >
                  <img
                    src={bgImage}
                    alt={c.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 transition-colors duration-500 group-hover:bg-black/30" />
                  <h3 className="relative z-10 text-2xl font-bold text-white tracking-wide">{c.name}</h3>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

