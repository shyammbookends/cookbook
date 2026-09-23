import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getActiveBrandBySlug } from "@/server/public/brands";
import { getRecipeBySlug, getRelatedRecipes } from "@/server/public/recipes";
import { RecipeImage } from "@/components/media/RecipeImage";
import { RecipeJsonLd, BreadcrumbJsonLd } from "@/components/seo/RecipeJsonLd";
import { PrintPdfButton } from "@/components/recipe/PrintPdfButton";
import { RecipeSopView, sopVersionLabel } from "@/components/recipe/RecipeSopView";

export async function generateMetadata(props: PageProps<"/[brand]/recipes/[slug]">): Promise<Metadata> {
  const { brand: brandSlug, slug } = await props.params;
  const brand = await getActiveBrandBySlug(brandSlug);
  if (!brand) return {};
  const recipe = await getRecipeBySlug(brand.id, slug);
  if (!recipe) return {};

  const title = recipe.seoTitle || recipe.title;
  const description = recipe.seoDescription || recipe.excerpt || undefined;
  const image = recipe.heroImage ? { url: `/media/${recipe.heroImage.id}` } : undefined;

  return {
    title,
    description,
    robots: recipe.noindex ? { index: false, follow: false } : undefined,
    alternates: { canonical: `/${brand.slug}/recipes/${recipe.slug}` },
    openGraph: { title, description, images: image ? [image] : undefined, type: "article" },
  };
}

export default async function RecipeDetailPage(props: PageProps<"/[brand]/recipes/[slug]">) {
  const { brand: brandSlug, slug } = await props.params;
  const brand = await getActiveBrandBySlug(brandSlug);
  if (!brand) notFound();

  const recipe = await getRecipeBySlug(brand.id, slug);
  if (!recipe) notFound();

  const base = process.env.AUTH_URL ?? "http://localhost:3000";
  const url = `${base}/${brand.slug}/recipes/${recipe.slug}`;

  // Combine prep/cook/finish into a single directions list for this layout
  const allSteps = [
    ...recipe.steps.filter((s) => s.phase === "PREP"),
    ...recipe.steps.filter((s) => s.phase === "COOK"),
    ...recipe.steps.filter((s) => s.phase === "FINISH"),
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0; size: A4 portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #FAF8F5 !important; }
        }
      `}} />
      <div id="recipe-print-container" className="min-h-screen bg-[#FAF8F5] text-[#2C3E35] font-sans pb-10 print:bg-[#FAF8F5] print:pb-0 print:min-h-[297mm] print:w-full mx-auto box-border print:flex print:flex-col">
        <RecipeJsonLd recipe={recipe} brand={brand} url={url} />
        <BreadcrumbJsonLd
          items={[
            { name: brand.name, url: `${base}/${brand.slug}` },
            { name: "Recipes", url: `${base}/${brand.slug}/recipes` },
            { name: recipe.title, url },
          ]}
        />

        <RecipeSopView
          data={{
            title: recipe.title,
            description: recipe.description,
            summary: recipe.summary,
            categoryName: recipe.category?.name ?? null,
            station: recipe.station,
            brandName: recipe.brand.name,
            dishCode: recipe.dishCode,
            versionLabel: sopVersionLabel(recipe.sopVersion, recipe.version),
            author: recipe.author,
            approvedBy: recipe.approvedBy,
            effectiveDate: recipe.effectiveDate,
            nextReviewDate: recipe.nextReviewDate,
            yieldText: recipe.yieldText,
            prepMinutes: recipe.prepMinutes,
            cookMinutes: recipe.cookMinutes,
            totalMinutes: recipe.totalMinutes,
            diet: recipe.dietary.join(", ") || null,
            miseEnPlace: recipe.miseEnPlace,
            equipment: recipe.equipment,
            qualityCheck: recipe.qualityCheck,
            ingredients: recipe.ingredients.map((i) => ({ name: i.name, quantity: i.quantity ? Number(i.quantity) : null, unit: i.unit })),
            steps: allSteps.map((s) => s.body),
            plating: recipe.plating,
            holding: recipe.holding,
            allergens: recipe.allergens,
          }}
          hero={<RecipeImage media={recipe.heroImage} alt={recipe.title} aspect="4 / 3" priority className="object-cover w-full h-full" />}
          headerAction={<PrintPdfButton />}
          topSlot={
            <div className="mb-8 print:hidden">
              <Link href={`/${brand.slug}`} className="inline-flex items-center text-sm font-medium text-[#1F3D2D]/60 hover:text-[#D4B572] transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to {brand.name}
              </Link>
            </div>
          }
        />
      </div>
    </>
  );
}
