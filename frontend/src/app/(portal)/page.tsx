import Link from "next/link";
import type { Metadata } from "next";
import { getActiveBrands, getPortalBrand } from "@/server/public/brands";
import { getLatestRecipes } from "@/server/public/recipes";
import { BrandThemeSchema, themeToCssVars } from "@/lib/schemas/theme";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { BookshelfScene } from "@/components/three/BookshelfScene";
import { Reveal } from "@/components/motion/Reveal";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { BrandVoice } from "@/components/recipe/BrandVoice";
import { SecretAdminButton } from "@/components/portal/SecretAdminButton";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortalBrand();
  return {
    title: portal?.seoTitle || "Bookends Hospitality",
    description: portal?.seoDescription || portal?.tagline || undefined,
  };
}

export default async function HomePage() {
  const [portal, brands] = await Promise.all([getPortalBrand(), getActiveBrands()]);
  const theme = portal ? BrandThemeSchema.parse(portal.theme) : null;
  const cssVars = theme ? themeToCssVars(theme) : {};

  const latestByBrand = await Promise.all(
    brands.map(async (b) => ({ brand: b, recipes: await getLatestRecipes(b.id, 2) })),
  );

  return (
    <div data-brand={portal?.slug} style={cssVars as React.CSSProperties} className="min-h-screen bg-brand-bg text-brand-fg transition-colors duration-1000 overflow-x-hidden">
      <SecretAdminButton />
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: `radial-gradient(circle at 50% 15%, var(--brand-accent-soft), transparent 60%)` }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 sm:py-32">
          <Reveal>
            <p className="eyebrow text-brand-accent">{portal?.eyebrow || "Bookends Hospitality"}</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-6 text-6xl font-bold leading-[0.9] tracking-tight sm:text-7xl md:text-8xl">
              BOOK<span className="text-brand-accent">ENDS</span>
            </h1>
          </Reveal>
          {portal?.quote && (
            <Reveal delay={0.16}>
              <p className="quote-serif mx-auto mt-8 max-w-2xl text-lg text-brand-fg/85 sm:text-xl">{portal.quote}</p>
            </Reveal>
          )}
          {portal?.tagline && (
            <Reveal delay={0.24}>
              <p className="eyebrow mt-6 text-brand-fg/60">&ldquo;{portal.tagline}&rdquo;</p>
            </Reveal>
          )}
        </div>

      </section>

      <BrandVoice
        personality={portal?.personality}
        moodFeel={portal?.moodFeel}
        promise={portal?.promise}
        voiceWords={portal?.voiceWords}
        sampleLines={portal?.sampleLines}
      />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <h2 className="mb-10 text-center text-3xl font-bold">Four houses, one kitchen</h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {brands.map((brand, i) => {
            const brandTheme = BrandThemeSchema.parse(brand.theme);
            return (
              <Reveal key={brand.id} delay={i * 0.06} className="h-full">
                <Link
                  href={`/${brand.slug}`}
                  className="group relative flex flex-col h-full overflow-hidden rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-1"
                  style={themeToCssVars(brandTheme) as React.CSSProperties}
                >
                  <div className="relative p-6 sm:p-8 flex flex-col flex-1" style={{ background: "var(--brand-bg)", color: "var(--brand-fg)", borderRadius: "1.5rem" }}>
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                      <span className="eyebrow" style={{ color: "var(--brand-accent)" }}>
                        BRAND {String(brand.number).padStart(2, "0")} {brand.eyebrow ? `/ ${brand.eyebrow}` : ""}
                      </span>
                      {(brand.handle || brand.followerLabel) && (
                        <span className="eyebrow text-right opacity-70">
                          {brand.handle} {brand.followerLabel ? `· ${brand.followerLabel}` : ""}
                        </span>
                      )}
                    </div>
                    <span
                      aria-hidden
                      className="mt-4 block text-5xl font-bold opacity-30 sm:text-7xl"
                      style={{ color: "var(--brand-numeral)" }}
                    >
                      {String(brand.number).padStart(2, "0")}
                    </span>
                    <h3 className="mt-2 text-3xl font-bold sm:text-4xl">{brand.name}</h3>
                    {brand.quote && <p className="quote-serif mt-4 text-sm opacity-85">{brand.quote}</p>}
                    {brand.voiceWords.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {brand.voiceWords.slice(0, 5).map((w) => (
                          <span
                            key={w}
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-80"
                            style={{ border: "1px solid var(--brand-accent)" }}
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    )}
                    {brand.tagline && <p className="eyebrow mt-4 opacity-60">{brand.tagline}</p>}
                    <span className="mt-auto pt-6 inline-block text-sm font-semibold opacity-0 transition-opacity group-hover:opacity-100">
                      Enter {brand.name} →
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>



      <footer className="border-t border-white/10 py-10 text-center text-sm text-brand-fg/50">
        © {new Date().getFullYear()} Bookends Hospitality
      </footer>
    </div>
  );
}
