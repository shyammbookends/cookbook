import { largestVariantUrl } from "@/lib/media";
import type { RecipeDetailData } from "@/server/public/recipes";
import type { Brand } from "@/generated/prisma/client";

function toIso8601Duration(minutes: number | null): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h > 0 ? `${h}H` : ""}${m > 0 ? `${m}M` : ""}`;
}

export function RecipeJsonLd({ recipe, brand, url }: { recipe: RecipeDetailData; brand: Brand; url: string }) {
  const image = recipe.heroImage ? largestVariantUrl(recipe.heroImage) : null;

  const json = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.excerpt || recipe.description || undefined,
    image: image ? [image] : undefined,
    author: { "@type": "Organization", name: brand.name },
    datePublished: recipe.publishedAt?.toISOString(),
    prepTime: toIso8601Duration(recipe.prepMinutes),
    cookTime: toIso8601Duration(recipe.cookMinutes),
    totalTime: toIso8601Duration(recipe.totalMinutes),
    recipeYield: recipe.yieldText || (recipe.servings ? `${recipe.servings} servings` : undefined),
    recipeCategory: recipe.category?.name,
    recipeCuisine: recipe.cuisine || undefined,
    keywords: recipe.tags.map((t) => t.tag.name).join(", ") || undefined,
    recipeIngredient: recipe.ingredients.map((i) => i.raw),
    recipeInstructions: [
      ...groupSteps("Prep", recipe.steps.filter((s) => s.phase === "PREP")),
      ...groupSteps("Cook", recipe.steps.filter((s) => s.phase === "COOK")),
      ...groupSteps("Finish", recipe.steps.filter((s) => s.phase === "FINISH")),
    ],
    nutrition: recipe.nutrition
      ? {
          "@type": "NutritionInformation",
          ...(recipe.nutrition as Record<string, unknown>),
        }
      : undefined,
    url,
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json).replace(/</g, "\\u003c") }} />;
}

function groupSteps(name: string, steps: RecipeDetailData["steps"]) {
  if (steps.length === 0) return [];
  return [
    {
      "@type": "HowToSection",
      name,
      itemListElement: steps.map((s) => ({ "@type": "HowToStep", text: s.body, name: s.title || undefined })),
    },
  ];
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const json = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json).replace(/</g, "\\u003c") }} />;
}
