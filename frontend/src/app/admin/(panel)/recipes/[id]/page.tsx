import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db";
import { RecipeForm } from "@/components/admin/RecipeForm";
import { RecipeActions } from "./RecipeActions";
import { largestVariantUrl } from "@/lib/media";

export const metadata = { title: "Edit Recipe" };

export default async function EditRecipePage(props: PageProps<"/admin/recipes/[id]">) {
  const { id } = await props.params;

  const [recipe, brands] = await Promise.all([
    db.recipe.findUnique({
      where: { id },
      include: {
        heroImage: true,
        ingredients: { orderBy: { position: "asc" } },
        steps: { orderBy: { position: "asc" } },
        tags: { include: { tag: true } },
        brand: true,
      },
    }),
    db.brand.findMany({
      orderBy: { sortOrder: "asc" },
      include: { categories: { orderBy: { sortOrder: "asc" } }, tags: { orderBy: { name: "asc" } } },
    }),
  ]);

  if (!recipe) notFound();

  const formBrands = brands.map((b) => ({
    id: b.id,
    name: b.name,
    categories: b.categories.map((c) => ({ id: c.id, name: c.name })),
    tags: b.tags.map((t) => ({ id: t.id, name: t.name })),
  }));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{recipe.title}</h1>
          <p className="text-sm text-white/50">
            {recipe.brand.name} · {recipe.status}
            {recipe.status === "PUBLISHED" && (
              <>
                {" · "}
                <Link href={`/${recipe.brand.slug}/recipes/${recipe.slug}`} className="underline" target="_blank">
                  View live ↗
                </Link>
              </>
            )}
          </p>
        </div>
        <RecipeActions id={recipe.id} status={recipe.status} brandId={recipe.brandId} brands={brands.map((b) => ({ id: b.id, name: b.name }))} />
      </div>

      <RecipeForm
        brands={formBrands}
        initial={{
          id: recipe.id,
          version: recipe.version,
          brandId: recipe.brandId,
          categoryId: recipe.categoryId,
          externalId: recipe.externalId,
          slug: recipe.slug,
          title: recipe.title,
          subtitle: recipe.subtitle,
          excerpt: recipe.excerpt,
          description: recipe.description,
          heroImageId: recipe.heroImageId,
          heroImagePreview: recipe.heroImage ? largestVariantUrl(recipe.heroImage) : null,
          prepMinutes: recipe.prepMinutes,
          cookMinutes: recipe.cookMinutes,
          restMinutes: recipe.restMinutes,
          totalMinutes: recipe.totalMinutes,
          servings: recipe.servings,
          yieldText: recipe.yieldText,
          difficulty: recipe.difficulty,
          cuisine: recipe.cuisine,
          course: recipe.course,
          dietary: recipe.dietary,
          spiceLevel: recipe.spiceLevel,
          equipment: recipe.equipment,
          nutrition: recipe.nutrition as never,
          notes: recipe.notes,
          tips: recipe.tips,
          dishCode: recipe.dishCode,
          author: recipe.author,
          approvedBy: recipe.approvedBy,
          effectiveDate: recipe.effectiveDate,
          nextReviewDate: recipe.nextReviewDate,
          miseEnPlace: recipe.miseEnPlace,
          plating: recipe.plating,
          holding: recipe.holding,
          allergens: recipe.allergens,
          customFields: recipe.customFields as never,
          tagIds: recipe.tags.map((t) => t.tagId),
          tagNamesInitial: recipe.tags.map((t) => t.tag.name),
          ingredients: recipe.ingredients.map((i) => ({
            position: i.position, groupLabel: i.groupLabel, quantity: i.quantity ? Number(i.quantity) : null,
            quantityMax: i.quantityMax ? Number(i.quantityMax) : null, unit: i.unit, name: i.name, note: i.note, raw: i.raw,
          })),
          steps: recipe.steps.map((s) => ({ phase: s.phase, position: s.position, title: s.title, body: s.body, imageId: s.imageId, timerMinutes: s.timerMinutes })),
          galleryMediaIds: [],
          status: recipe.status,
          publishAt: recipe.publishAt,
          featured: recipe.featured,
          seoTitle: recipe.seoTitle,
          seoDescription: recipe.seoDescription,
          noindex: recipe.noindex,
        }}
      />
    </div>
  );
}
