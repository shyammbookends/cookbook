import "server-only";
import { db } from "@/server/db";
import { largestVariantUrl } from "@/lib/media";
import { CARD_SELECT } from "@/server/public/recipes";
import { sopTemplateOf } from "@/lib/sop/templates";
import type { FormBrand, RecipeFormInitial } from "@/components/admin/RecipeForm";

const PHASE_RANK = { PREP: 0, COOK: 1, FINISH: 2 } as const;

/** Every brand with its categories and tags, as the recipe editor's pickers need them. */
export async function loadFormBrands(): Promise<FormBrand[]> {
  const brands = await db.brand.findMany({
    orderBy: { sortOrder: "asc" },
    include: { categories: { orderBy: { sortOrder: "asc" } }, tags: { orderBy: { name: "asc" } } },
  });
  return brands.map((b) => ({
    id: b.id,
    name: b.name,
    template: sopTemplateOf(b.theme),
    categories: b.categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    tags: b.tags.map((t) => ({ id: t.id, name: t.name })),
  }));
}

/** A recipe (any status) shaped as the editor's initial values, or null if it doesn't exist. */
export async function loadRecipeForEdit(id: string) {
  const recipe = await db.recipe.findUnique({
    where: { id },
    include: {
      heroImage: true,
      ingredients: { orderBy: { position: "asc" } },
      steps: { orderBy: { position: "asc" } },
      tags: { include: { tag: true } },
      gallery: { orderBy: { position: "asc" }, select: { mediaId: true } },
      brand: true,
      category: { select: { slug: true, name: true } },
    },
  });
  if (!recipe) return null;

  const initial: RecipeFormInitial = {
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
    station: recipe.station,
    summary: recipe.summary,
    sopVersion: recipe.sopVersion,
    qualityCheck: recipe.qualityCheck,
    dishType: recipe.dishType,
    service: recipe.service,
    sopSections: recipe.sopSections,
    customFields: recipe.customFields as never,
    tagIds: recipe.tags.map((t) => t.tagId),
    ingredients: recipe.ingredients.map((i) => ({
      position: i.position, groupLabel: i.groupLabel, quantity: i.quantity ? Number(i.quantity) : null,
      quantityMax: i.quantityMax ? Number(i.quantityMax) : null, unit: i.unit, name: i.name, note: i.note, raw: i.raw,
    })),
    steps: [...recipe.steps].sort((a, b) => PHASE_RANK[a.phase] - PHASE_RANK[b.phase] || a.position - b.position).map((s) => ({ phase: s.phase, position: s.position, title: s.title, body: s.body, imageId: s.imageId, timerMinutes: s.timerMinutes })),
    galleryMediaIds: recipe.gallery.map((g) => g.mediaId),
    status: recipe.status,
    publishAt: recipe.publishAt,
    featured: recipe.featured,
    seoTitle: recipe.seoTitle,
    seoDescription: recipe.seoDescription,
    noindex: recipe.noindex,
  };

  return { recipe, initial };
}

/** A category's draft recipes as cards, for the portal's admin edit mode. */
export async function listCategoryDrafts(brandId: string, categoryId: string) {
  return db.recipe.findMany({
    where: { brandId, categoryId, status: "DRAFT", deletedAt: null },
    select: CARD_SELECT,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getImportJob(jobId: string) {
  return db.importJob.findUnique({ where: { id: jobId } });
}
