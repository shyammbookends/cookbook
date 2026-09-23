import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveBrandBySlug } from "@/server/public/brands";
import { getBrandCategories } from "@/server/public/taxonomy";
import { listRecipes } from "@/server/public/recipes";
import { RecipeGrid } from "@/components/recipe/RecipeCard";
import { BrandThemeSchema } from "@/lib/schemas/theme";
import { Reveal } from "@/components/motion/Reveal";

export default async function BrandHomePage(props: PageProps<"/[brand]">) {
  const { brand: slug } = await props.params;
  const brand = await getActiveBrandBySlug(slug);
  if (!brand) notFound();

  const theme = BrandThemeSchema.parse(brand.theme);
  const [categories, { items: recipes }] = await Promise.all([
    getBrandCategories(brand.id),
    listRecipes(brand.id, { take: 12 }),
  ]);

  return (
    <>
      <section className="relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden py-12">
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
        {brand.tagline && (
          <Reveal>
            <p className="mt-4 text-xl md:text-2xl opacity-90 text-center font-medium px-4 max-w-2xl">
              {brand.tagline}
            </p>
          </Reveal>
        )}
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <Reveal>
            <h2 className="mb-4 text-2xl font-bold">Menu</h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {categories.map((c) => {
              const bgImage =
                c.image?.storageKey ||
                c.image?.sourceUrl ||
                (c.slug === "drinks"
                  ? "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80"
                  : c.slug === "desserts"
                  ? "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=800&q=80"
                  : "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80");
              return (
                <Link
                  key={c.id}
                  href={`/${brand.slug}/category/${c.slug}`}
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

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Reveal>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Recipes</h2>
            <Link
              href={`/${brand.slug}/recipes`}
              className="text-sm font-semibold text-brand-accent hover:underline"
            >
              View All Recipes →
            </Link>
          </div>
        </Reveal>
        <RecipeGrid brandSlug={brand.slug} recipes={recipes} />
      </section>
    </>
  );
}

