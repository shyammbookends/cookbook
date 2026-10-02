import Link from "next/link";
import type { RecipeCardData } from "@/server/public/recipes";
import { CategoryRecipeBrowser } from "@/components/recipe/CategoryRecipeBrowser";
import { DownloadCategoryPdfButton } from "@/components/recipe/DownloadCategoryPdfButton";
import { getCategoryImageUrl } from "@/lib/media";

const addBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold uppercase tracking-widest shadow-sm backdrop-blur transition-all hover:shadow-md";

/**
 * A brand category page. The public portal renders it plain; the admin portal
 * (base "/admin", `admin` set) adds Add Recipe under the PDF button and an Edit
 * button on every recipe card.
 */
export function CategoryView({
  brand,
  category,
  recipes,
  base = "",
  admin,
}: {
  brand: { slug: string };
  category: Parameters<typeof getCategoryImageUrl>[0] & { slug: string; name: string; description: string | null };
  recipes: RecipeCardData[];
  base?: string;
  admin?: { draftIds: Set<string> };
}) {
  const categoryImage = getCategoryImageUrl(category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-brand-card-bg shadow-md">
        <div className="absolute inset-0 z-0">
          <img
            src={categoryImage}
            alt={category.name}
            className="h-full w-full object-cover brightness-[0.35]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
        <div className="relative z-10 flex min-h-[160px] sm:min-h-[220px] flex-col justify-between p-6 sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-brand-accent tracking-widest uppercase text-xs font-bold">Category</p>
              <h1 className="mt-1 text-3xl font-extrabold text-white tracking-tight sm:text-5xl">{category.name}</h1>
            </div>
            <div className="flex flex-col items-stretch gap-2">
              <DownloadCategoryPdfButton
                brandSlug={brand.slug}
                categorySlug={category.slug}
                categoryName={category.name}
              />
              {admin && (
                <>
                  <Link
                    href={`${base}/${brand.slug}/manage/new?category=${encodeURIComponent(category.slug)}`}
                    className={`${addBtn} border-white bg-white text-slate-900 hover:bg-slate-100`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    Add Recipe
                  </Link>
                </>
              )}
            </div>
          </div>
          {category.description && (
            <p className="quote-serif mt-4 max-w-2xl text-white/80">{category.description}</p>
          )}
        </div>
      </div>
      <CategoryRecipeBrowser
        brandSlug={brand.slug}
        recipes={recipes}
        base={base}
        editable={!!admin}
        draftIds={admin ? [...admin.draftIds] : undefined}
      />
    </div>
  );
}
