import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getActiveBrandBySlug } from "@/server/public/brands";
import { getRecipeBySlug, getRelatedRecipes } from "@/server/public/recipes";
import { RecipeImage } from "@/components/media/RecipeImage";
import { RecipeJsonLd, BreadcrumbJsonLd } from "@/components/seo/RecipeJsonLd";
import { PrintPdfButton } from "@/components/recipe/PrintPdfButton";

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

const ScaleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <path d="M12 3v18M12 3l-8 5v2a8 8 0 0 0 16 0V8l-8-5z" />
    <path d="M12 11h.01" />
  </svg>
);
const KnifeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <path d="M11.63 12.87L2 22.5" />
    <path d="M22.5 2L11.13 13.37A2.83 2.83 0 0 1 7.13 9.37L18.5 2h4v4z" />
  </svg>
);
const PotIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <path d="M5 8h14M3 8c0 5 3 11 9 11s9-6 9-11M8 3v3M16 3v3M12 2v4" />
  </svg>
);
const ClockIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
const LeafIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);
const BowlIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <path d="M2 12h20M4 12c0 4.4 3.6 8 8 8s8-3.6 8-8" />
    <path d="M12 6v2M8 5v3M16 5v3" />
  </svg>
);
const CoverIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <path d="M2 16h20M12 4a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8zM12 4V2" />
  </svg>
);
const WheatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <path d="M2 22l10-10M12 12c-2.76 0-5-2.24-5-5s2.24-5 5-5M12 12c0 2.76 2.24 5 5 5s5-2.24 5-5" />
    <path d="M7 7c2.76 0 5-2.24 5-5" />
    <path d="M17 17c0-2.76-2.24-5-5-5" />
  </svg>
);
const ClipboardIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-6 h-6"}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

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

  const formatDate = (d: Date | null | undefined) =>
    d ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(d) : 'N/A';

  const isVeg = recipe.dietary.includes("Vegetarian") || recipe.dietary.includes("Vegan");
  const dietLabel = isVeg ? "V" : "N/A";

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

        <div className="mx-auto max-w-[1000px] p-8 md:p-12 bg-[#FAF8F5] print:p-8 print:max-w-none print:flex-1 w-full">
          
          <div className="mb-8 print:hidden">
            <Link href={`/${brand.slug}`} className="inline-flex items-center text-sm font-medium text-[#1F3D2D]/60 hover:text-[#D4B572] transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to {brand.name}
            </Link>
          </div>

          {/* Header */}
          <div className="mb-6 print:mb-4 border-b-2 border-[#D4B572] pb-4 print:pb-2 flex justify-between items-end relative">
            <div>
              <div className="text-sm print:text-xs font-bold tracking-widest text-[#D4B572] uppercase">
                {recipe.category?.name || "RECIPE"} {recipe.tags.length > 0 && `| ${recipe.tags[0].tag.name}`}
              </div>
              <h1 className="mt-4 print:mt-1 text-5xl md:text-7xl print:text-5xl font-[family-name:var(--font-playfair)] text-[#1F3D2D]">
                {recipe.title}
              </h1>
            </div>
            <div className="print:hidden absolute right-0 bottom-4">
              <PrintPdfButton />
            </div>
          </div>
          
          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] print:grid-cols-[1fr_1.8fr] gap-12 print:gap-8">
            
            {/* Left Column */}
            <div className="flex flex-col gap-8 print:gap-5">
              
              {/* Meta Table */}
              <div className="text-[13px] print:text-[11px]">
              <div className="grid grid-cols-[120px_1fr] print:grid-cols-[100px_1fr] py-1.5 print:py-0.5 border-b border-[#E6E1DA]"><span className="font-bold">DISH CODE:</span> <span>{recipe.dishCode || "N/A"}</span></div>
              <div className="grid grid-cols-[120px_1fr] print:grid-cols-[100px_1fr] py-1.5 print:py-0.5 border-b border-[#E6E1DA]"><span className="font-bold">VERSION:</span> <span>v{recipe.version}.0</span></div>
              <div className="grid grid-cols-[120px_1fr] print:grid-cols-[100px_1fr] py-1.5 print:py-0.5 border-b border-[#E6E1DA]"><span className="font-bold">AUTHOR:</span> <span>{recipe.author || recipe.brand.name}</span></div>
              <div className="grid grid-cols-[120px_1fr] print:grid-cols-[100px_1fr] py-1.5 print:py-0.5 border-b border-[#E6E1DA]"><span className="font-bold">APPROVED BY:</span> <span>{recipe.approvedBy || "N/A"}</span></div>
              <div className="grid grid-cols-[120px_1fr] print:grid-cols-[100px_1fr] py-1.5 print:py-0.5 border-b border-[#E6E1DA]"><span className="font-bold">EFFECTIVE:</span> <span>{formatDate(recipe.effectiveDate)}</span></div>
              <div className="grid grid-cols-[120px_1fr] print:grid-cols-[100px_1fr] py-1.5 print:py-0.5 border-b border-[#D4B572]"><span className="font-bold">NEXT REVIEW:</span> <span>{formatDate(recipe.nextReviewDate)}</span></div>
            </div>
            
            {/* Icons Grid */}
            <div className="grid grid-cols-3 gap-y-8 print:gap-y-4 gap-x-2 text-center text-xs font-bold border-b border-[#D4B572] pb-8 print:pb-4 text-[#1F3D2D]">
              <div className="flex flex-col items-center gap-2 print:gap-1">
                <ScaleIcon className="w-8 h-8 print:w-6 print:h-6" />
                <span className="uppercase tracking-widest print:text-[10px]">YIELD</span>
                <span className="font-normal text-sm print:text-xs leading-tight text-gray-700 whitespace-pre-wrap">{recipe.yieldText?.replace(" ", "\n") || "N/A"}</span>
              </div>
              <div className="flex flex-col items-center gap-2 print:gap-1 border-l border-[#E6E1DA]">
                <KnifeIcon className="w-8 h-8 print:w-6 print:h-6" />
                <span className="uppercase tracking-widest print:text-[10px]">PREP</span>
                <span className="font-normal text-sm print:text-xs text-gray-700">{recipe.prepMinutes || 0} min</span>
              </div>
              <div className="flex flex-col items-center gap-2 print:gap-1 border-l border-[#E6E1DA]">
                <PotIcon className="w-8 h-8 print:w-6 print:h-6" />
                <span className="uppercase tracking-widest print:text-[10px]">DIET</span>
                <span className="font-normal text-sm print:text-xs text-gray-700">{dietLabel}</span>
              </div>
              <div className="flex flex-col items-center gap-2 print:gap-1">
                <ClockIcon className="w-8 h-8 print:w-6 print:h-6" />
                <span className="uppercase tracking-widest print:text-[10px]">COOK</span>
                <span className="font-normal text-sm print:text-xs text-gray-700">{recipe.cookMinutes || 0} min</span>
              </div>
              <div className="flex flex-col items-center gap-2 print:gap-1 border-l border-[#E6E1DA]">
                <ClockIcon className="w-8 h-8 print:w-6 print:h-6" />
                <span className="uppercase tracking-widest print:text-[10px]">TOTAL</span>
                <span className="font-normal text-sm print:text-xs text-gray-700">{recipe.totalMinutes || 0} min</span>
              </div>
              <div className="flex flex-col items-center gap-2 print:gap-1 border-l border-[#E6E1DA]">
                <LeafIcon className="w-8 h-8 print:w-6 print:h-6" />
                <span className="uppercase tracking-widest print:text-[10px]">DIET</span>
                <span className="font-normal text-sm print:text-xs text-gray-700">{dietLabel}</span>
              </div>
            </div>
            
            {/* Mise en Place */}
            <div className="border-b border-[#D4B572] pb-6 print:pb-3">
              <h3 className="font-bold uppercase tracking-widest mb-4 print:mb-2 print:text-[11px]">Mise En Place</h3>
              <ul className="list-disc pl-5 space-y-1.5 print:space-y-0.5 text-sm print:text-xs">
                {recipe.miseEnPlace && recipe.miseEnPlace.length > 0 
                  ? recipe.miseEnPlace.map((m, i) => <li key={i}>{m}</li>) 
                  : <li>None</li>}
              </ul>
            </div>
            
            {/* Equipment */}
            <div className="border-b border-[#D4B572] pb-6 print:pb-3">
              <h3 className="font-bold uppercase tracking-widest mb-4 print:mb-2 print:text-[11px]">Equipment / Tools</h3>
              <ul className="list-disc pl-5 space-y-1.5 print:space-y-0.5 text-sm print:text-xs">
                {recipe.equipment && recipe.equipment.length > 0 
                  ? recipe.equipment.map((e, i) => <li key={i}>{e}</li>) 
                  : <li>None</li>}
              </ul>
            </div>
            
            {/* Ingredients */}
            <div className="pb-6 print:pb-0">
              <h3 className="font-bold uppercase tracking-widest mb-4 print:mb-2 print:text-[11px]">Ingredients (NET)</h3>
              <div className="space-y-1.5 print:space-y-0.5 text-sm print:text-[11px] flex flex-col">
                {recipe.ingredients.map(ing => (
                  <div key={ing.id} className="flex justify-between w-full relative overflow-hidden">
                    <span className="bg-[#FAF8F5] pr-2 z-10">{ing.name}</span>
                    <div className="absolute inset-0 border-b-2 border-dotted border-[#C0C0C0] top-[60%] -z-0"></div>
                    <span className="bg-[#FAF8F5] pl-2 z-10 whitespace-nowrap">{ing.quantity ? Number(ing.quantity) : ''} {ing.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="flex flex-col gap-8 print:gap-4">
            <div className="w-full aspect-[4/3] rounded-2xl print:rounded-xl overflow-hidden relative shadow-md">
              <RecipeImage media={recipe.heroImage} alt={recipe.title} aspect="4 / 3" priority className="object-cover w-full h-full" />
            </div>
            
            {/* Green Box */}
            <div className="bg-[#1F3D2D] rounded-3xl print:rounded-xl p-8 print:p-5 text-white flex flex-col gap-8 print:gap-4 print:!bg-[#1F3D2D]">
              
              <div className="flex gap-5 print:gap-3">
                <BowlIcon className="text-[#D4B572] w-8 h-8 print:w-5 print:h-5 shrink-0 mt-1" />
                <div>
                  <h4 className="text-[#D4B572] font-bold tracking-widest uppercase mb-2 print:mb-1 print:text-[10px]">Plating & Portioning</h4>
                  <p className="text-sm print:text-xs whitespace-pre-wrap leading-relaxed">{recipe.plating || "N/A"}</p>
                </div>
              </div>
              
              <div className="w-full h-[2px] bg-[#D4B572] opacity-30"></div>
              
              <div className="flex gap-5 print:gap-3">
                <CoverIcon className="text-[#D4B572] w-8 h-8 print:w-5 print:h-5 shrink-0 mt-1" />
                <div>
                  <h4 className="text-[#D4B572] font-bold tracking-widest uppercase mb-2 print:mb-1 print:text-[10px]">Holding & Shelf Life</h4>
                  <p className="text-sm print:text-xs whitespace-pre-wrap leading-relaxed">{recipe.holding || "N/A"}</p>
                </div>
              </div>
              
              <div className="w-full h-[2px] bg-[#D4B572] opacity-30"></div>
              
              <div className="flex gap-5 print:gap-3">
                <WheatIcon className="text-[#D4B572] w-8 h-8 print:w-5 print:h-5 shrink-0 mt-1" />
                <div>
                  <h4 className="text-[#D4B572] font-bold tracking-widest uppercase mb-2 print:mb-1 print:text-[10px]">Allergens</h4>
                  <p className="text-sm print:text-xs whitespace-pre-wrap leading-relaxed">{recipe.allergens || "N/A"}</p>
                </div>
              </div>
              
            </div>
            
            {/* Method */}
            <div className="mt-4 print:mt-1">
              <h3 className="font-bold uppercase tracking-widest border-b border-[#D4B572] pb-3 print:pb-1 mb-6 print:mb-3 print:text-[11px]">Method</h3>
              <div className="space-y-6 print:space-y-3">
                {allSteps.map((step, idx) => (
                  <div key={step.id} className="flex gap-5 print:gap-3 items-start">
                    <div className="w-7 h-7 print:w-5 print:h-5 print:text-[10px] rounded-full bg-[#1F3D2D] text-white flex items-center justify-center shrink-0 text-sm font-bold mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-[15px] print:text-xs leading-relaxed pt-1 print:pt-0">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-16 print:mt-auto bg-[#1F3D2D] text-white py-4 print:py-2 px-8 print:px-5 rounded-lg flex flex-wrap justify-between items-center text-xs print:text-[10px] font-medium gap-4 print:gap-2 print:!bg-[#1F3D2D]">
          <div className="flex gap-2 items-center">
            <ClipboardIcon className="text-[#D4B572] w-5 h-5 print:w-4 print:h-4" />
            <span>Document ID: {recipe.dishCode || 'N/A'}-v{recipe.version}.0</span>
          </div>
          <div className="flex gap-8 print:gap-4">
            <span className="hidden sm:inline print:inline">Printed on: {formatDate(new Date())}</span>
            <span>Page 1 of 1</span>
          </div>
          <div className="text-[#D4B572] font-bold text-sm print:text-[11px] tracking-wide">{recipe.brand.name} Hospitality</div>
        </div>
        
      </div>
    </>
  );
}
