import { getActiveBrands, getPortalBrand } from "@/server/public/brands";
import { BrandThemeSchema, themeToCssVars } from "@/lib/schemas/theme";
import { Reveal } from "@/components/motion/Reveal";
import { SecretAdminButton } from "@/components/portal/SecretAdminButton";
import { BrandCardLink, PortalPageFade } from "@/components/portal/BrandCardLink";
import { BeshakLogo } from "@/components/brand/BeshakLogo";
import { GhasletLogo } from "@/components/brand/GhasletLogo";

/**
 * The portal home (brand picker), shared by the public portal and the admin portal (base "/admin").
 * `top` renders above the hero, inside the themed background (the admin toolbar).
 */
export async function PortalHomeView({ base = "", top }: { base?: string; top?: React.ReactNode }) {
  const [portal, brands] = await Promise.all([getPortalBrand(), getActiveBrands()]);
  const theme = portal ? BrandThemeSchema.parse(portal.theme) : null;
  const cssVars = theme ? themeToCssVars(theme) : {};

  return (
    <div data-brand={portal?.slug} style={cssVars as React.CSSProperties} className="min-h-screen bg-brand-bg text-brand-fg transition-colors duration-1000 overflow-x-hidden">
      <PortalPageFade>
      {!base && <SecretAdminButton />}
      {top}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: `radial-gradient(circle at 50% 15%, var(--brand-accent-soft), transparent 60%)` }}
        />
        <div className="relative mx-auto max-w-5xl px-4 pt-10 pb-8 text-center sm:px-6 sm:pt-14 sm:pb-10">
          <Reveal>
            <p className="eyebrow text-brand-accent">{portal?.eyebrow || "Bookends Hospitality"}</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-4 text-6xl font-bold leading-[0.9] tracking-tight sm:text-7xl md:text-8xl">
              BOOK<span className="text-brand-accent">ENDS</span>
            </h1>
          </Reveal>
          {portal?.quote && (
            <Reveal delay={0.16}>
              <p className="quote-serif mx-auto mt-4 max-w-2xl text-lg text-brand-fg/85 sm:text-xl">{portal.quote}</p>
            </Reveal>
          )}
          {portal?.tagline && (
            <Reveal delay={0.24}>
              <p className="eyebrow mt-3 text-brand-fg/60">&ldquo;{portal.tagline}&rdquo;</p>
            </Reveal>
          )}
        </div>

      </section>

      <section className="mx-auto max-w-7xl px-4 pt-4 pb-16 sm:px-6">
        <Reveal>
          <h2 className="mb-6 sm:mb-8 text-center text-2xl sm:text-3xl font-bold">Four houses, one kitchen</h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {brands.map((brand, i) => {
            const brandTheme = BrandThemeSchema.parse(brand.theme);
            return (
              <Reveal key={brand.id} delay={i * 0.06} className="h-full">
                <BrandCardLink
                  href={`${base}/${brand.slug}`}
                  className="group relative block overflow-hidden rounded-2xl sm:rounded-3xl transition-transform duration-300 hover:-translate-y-1 shadow-md hover:shadow-xl"
                  style={themeToCssVars(brandTheme) as React.CSSProperties}
                >
                  <div
                    className="relative isolate overflow-hidden p-5 sm:p-6 flex flex-col justify-between rounded-2xl sm:rounded-3xl h-36.25 sm:h-38.75"
                    style={{ background: "var(--brand-bg)", color: "var(--brand-fg)" }}
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -z-10 origin-bottom scale-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform group-hover:scale-y-100 group-focus-visible:scale-y-100 motion-reduce:scale-y-100 motion-reduce:opacity-0 motion-reduce:transition-opacity motion-reduce:group-hover:opacity-100"
                      style={{ background: "color-mix(in srgb, var(--brand-accent) 12%, transparent)" }}
                    />
                    
                    {/* Top Row: Brand Eyebrow + Handle (Followers removed) */}
                    <div className="relative z-10 flex items-center justify-between gap-x-3">
                      <span className="eyebrow truncate min-w-0" style={{ color: "var(--brand-accent)" }}>
                        BRAND {String(brand.number).padStart(2, "0")} {brand.eyebrow ? `/ ${brand.eyebrow}` : ""}
                      </span>
                      {brand.handle && (
                        <span className="eyebrow shrink-0 text-right opacity-70">
                          {brand.handle}
                        </span>
                      )}
                    </div>

                    {/* Bottom Area: Background Numeral Layer + Foreground Brand Name Layer */}
                    <div className="relative z-10 mt-auto flex items-end justify-between">
                      {/* Layer 1 (Background): Giant 01 numeral behind the text */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -bottom-3 -left-1 select-none text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter leading-none opacity-30 z-0 transition-all duration-300 group-hover:opacity-45 group-hover:scale-105"
                        style={{ color: "var(--brand-numeral)" }}
                      >
                        {String(brand.number).padStart(2, "0")}
                      </span>

                      {/* Layer 2 (Foreground): Crisp Brand Name or Exact Logo */}
                      {brand.slug === "beshak" ? (
                        <div className="relative z-10 pl-1 py-1">
                          <BeshakLogo color="white" className="h-6 sm:h-7 w-auto max-w-50 sm:max-w-60 drop-shadow-sm" />
                        </div>
                      ) : brand.slug === "ghaslet" ? (
                        <div className="relative z-10 pl-1">
                          <GhasletLogo className="w-28 sm:w-32 h-auto max-h-12 drop-shadow-md" />
                        </div>
                      ) : (
                        <h3 className="relative z-10 text-3xl font-bold sm:text-4xl tracking-tight pl-1 drop-shadow-sm">
                          {brand.name}
                        </h3>
                      )}

                      {/* Layer 2 (Foreground): Enter button */}
                      <span className="relative z-10 inline-flex items-center gap-1 text-xs sm:text-sm font-semibold opacity-0 transition-all duration-300 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0">
                        Enter {brand.name} →
                      </span>
                    </div>
                  </div>
                </BrandCardLink>
              </Reveal>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-white/10 py-10 text-center text-sm text-brand-fg/50">
        © {new Date().getFullYear()} Bookends Hospitality
      </footer>
      </PortalPageFade>
    </div>
  );
}
