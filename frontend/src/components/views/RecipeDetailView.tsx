import Link from "next/link";
import type { Brand } from "@/generated/prisma/client";
import type { getRecipeBySlug } from "@/server/public/recipes";
import { RecipeImage } from "@/components/media/RecipeImage";
import { RecipeJsonLd, BreadcrumbJsonLd } from "@/components/seo/RecipeJsonLd";
import { PrintPdfButton } from "@/components/recipe/PrintPdfButton";
import { sopVersionLabel } from "@/components/recipe/RecipeSopView";
import { dessertExtrasOf } from "@/lib/sop/dessert";
import { dimsumExtrasOf } from "@/lib/sop/aiko-dimsum";
import { drinkExtrasOf } from "@/lib/sop/aiko-drinks";
import { aikoOptsOf } from "@/lib/sop/aiko";
import { garnishOf } from "@/lib/sop/garnish";
import { timeTextOf } from "@/lib/sop/timeText";
import { SopCard } from "@/components/recipe/SopCard";
import { sopTemplateOf } from "@/lib/sop/templates";
import { largestVariantUrl } from "@/lib/media";

type Recipe = NonNullable<Awaited<ReturnType<typeof getRecipeBySlug>>>;

/** The recipe page body, shared by the public portal (base "") and the admin portal (base "/admin"). */
export function RecipeDetailView({ brand, recipe, base = "" }: { brand: Brand; recipe: Recipe; base?: string }) {
  const site = process.env.AUTH_URL ?? "http://localhost:3000";
  const url = `${site}/${brand.slug}/recipes/${recipe.slug}`;

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
      <div id="recipe-print-container" className="min-h-screen bg-[#E9E6E1] text-[#2C3E35] font-sans pb-10 print:bg-[#FAF8F5] print:pb-0 print:min-h-[297mm] print:w-full mx-auto box-border print:flex print:flex-col">
        <RecipeJsonLd recipe={recipe} brand={brand} url={url} />
        <BreadcrumbJsonLd
          items={[
            { name: brand.name, url: `${site}/${brand.slug}` },
            { name: "Recipes", url: `${site}/${brand.slug}/recipes` },
            { name: recipe.title, url },
          ]}
        />

        <SopCard
          template={sopTemplateOf(brand.theme)}
          heroUrl={recipe.heroImage ? largestVariantUrl(recipe.heroImage) : null}
          data={{
            title: recipe.title,
            subtitle: recipe.subtitle,
            dishType: recipe.dishType,
            service: recipe.service,
            sopSections: recipe.sopSections,
            description: recipe.description,
            summary: recipe.summary,
            categoryName: recipe.category?.name ?? null,
            categorySlug: recipe.category?.slug ?? null,
            dessert: dessertExtrasOf(recipe.customFields),
            dimsum: dimsumExtrasOf(recipe.customFields),
            drink: drinkExtrasOf(recipe.customFields),
            aiko: aikoOptsOf(recipe.customFields),
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
            timeText: timeTextOf(recipe.customFields),
            diet: recipe.dietary.join(", ") || null,
            miseEnPlace: recipe.miseEnPlace,
            equipment: recipe.equipment,
            qualityCheck: recipe.qualityCheck,
            garnish: garnishOf(recipe.customFields),
            ingredients: recipe.ingredients.map((i) => ({ name: i.name, quantity: i.quantity ? Number(i.quantity) : null, unit: i.unit, groupLabel: i.groupLabel })),
            steps: allSteps.map((s) => ({ title: s.title, body: s.body })),
            plating: recipe.plating,
            holding: recipe.holding,
            allergens: recipe.allergens,
            notes: recipe.notes,
          }}
          hero={<RecipeImage media={recipe.heroImage} alt={recipe.title} aspect="4 / 3" priority className="object-cover w-full h-full" />}
          headerAction={<PrintPdfButton brandSlug={brand.slug} recipeSlug={recipe.slug} />}
          topSlot={
            <div className="print:hidden">
              <Link href={recipe.category ? `${base}/${brand.slug}/category/${recipe.category.slug}` : `${base}/${brand.slug}`} className="inline-flex items-center text-sm font-medium text-[#1F3D2D]/60 hover:text-[#D4B572] transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to {recipe.category?.name ?? brand.name}
              </Link>
            </div>
          }
        />
      </div>
    </>
  );
}
