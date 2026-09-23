import "server-only";
import { db } from "@/server/db";
import { uniqueSlug } from "@/lib/slug";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { RecipeInput, publishChecklist } from "@/lib/schemas/recipe";
import { Prisma } from "@/generated/prisma/client";
import type { Admin } from "@/generated/prisma/client";
import { revalidateTag } from "@/server/cache";

function computeTotalMinutes(input: Pick<RecipeInput, "prepMinutes" | "cookMinutes" | "restMinutes" | "totalMinutes">) {
  if (input.totalMinutes != null) return input.totalMinutes;
  const sum = (input.prepMinutes ?? 0) + (input.cookMinutes ?? 0) + (input.restMinutes ?? 0);
  return sum > 0 ? sum : null;
}

function ingredientText(ingredients: RecipeInput["ingredients"]): string {
  return ingredients.map((i) => [i.name, i.note].filter(Boolean).join(" ")).join(" ");
}

async function assertBrandCategoryAndTagsMatch(brandId: string, categoryId?: string | null, tagIds: string[] = []) {
  if (categoryId) {
    const cat = await db.category.findUnique({ where: { id: categoryId } });
    if (!cat || cat.brandId !== brandId) {
      throw new ValidationError("That category doesn't belong to the selected brand.", {
        categoryId: ["Category does not belong to this brand."],
      });
    }
  }
  if (tagIds.length) {
    const tags = await db.tag.findMany({ where: { id: { in: tagIds } } });
    const bad = tags.filter((t) => t.brandId !== brandId);
    if (bad.length || tags.length !== tagIds.length) {
      throw new ValidationError("One or more tags don't belong to the selected brand.", {
        tagIds: ["Tags must belong to the same brand as the recipe."],
      });
    }
  }
}

async function revalidateBrand(brandId: string) {
  const brand = await db.brand.findUnique({ where: { id: brandId }, select: { slug: true } });
  if (brand) revalidateTag(`brand:${brand.slug}`);
  revalidateTag("brands");
}

export async function createRecipe(input: RecipeInput, actor: Admin) {
  await assertBrandCategoryAndTagsMatch(input.brandId, input.categoryId, input.tagIds);

  const slug = await uniqueSlug(input.slug || input.title, async (candidate) => {
    const existing = await db.recipe.findFirst({
      where: { brandId: input.brandId, slug: candidate, deletedAt: null },
    });
    return !!existing;
  });

  if (input.status === "PUBLISHED") {
    const { ok, missing } = publishChecklist({ ...input, heroImageId: input.heroImageId });
    if (!ok) {
      throw new ValidationError(`Can't publish yet — missing: ${missing.join(", ")}.`, {
        status: [`Missing: ${missing.join(", ")}`],
      });
    }
  }

  const recipe = await db.recipe.create({
    data: {
      brandId: input.brandId,
      categoryId: input.categoryId ?? null,
      externalId: input.externalId ?? null,
      slug,
      title: input.title,
      subtitle: input.subtitle ?? null,
      excerpt: input.excerpt ?? null,
      description: input.description ?? null,
      heroImageId: input.heroImageId ?? null,
      prepMinutes: input.prepMinutes ?? null,
      cookMinutes: input.cookMinutes ?? null,
      restMinutes: input.restMinutes ?? null,
      totalMinutes: computeTotalMinutes(input),
      servings: input.servings ?? null,
      yieldText: input.yieldText ?? null,
      difficulty: input.difficulty ?? null,
      cuisine: input.cuisine ?? null,
      course: input.course ?? null,
      dietary: input.dietary,
      spiceLevel: input.spiceLevel ?? null,
      equipment: input.equipment,
      nutrition: input.nutrition ?? Prisma.JsonNull,
      notes: input.notes ?? null,
      tips: input.tips ?? null,
      dishCode: input.dishCode ?? null,
      author: input.author ?? null,
      approvedBy: input.approvedBy ?? null,
      effectiveDate: input.effectiveDate ?? null,
      nextReviewDate: input.nextReviewDate ?? null,
      miseEnPlace: input.miseEnPlace,
      plating: input.plating ?? null,
      holding: input.holding ?? null,
      allergens: input.allergens ?? null,
      customFields: input.customFields as Prisma.InputJsonValue,
      ingredientText: ingredientText(input.ingredients),
      status: input.status,
      publishAt: input.publishAt ?? null,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      featured: input.featured,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      noindex: input.noindex,
      createdById: actor.id,
      updatedById: actor.id,
      ingredients: { create: input.ingredients },
      steps: { create: input.steps },
      tags: { create: input.tagIds.map((tagId) => ({ tagId })) },
      gallery: { create: input.galleryMediaIds.map((mediaId, position) => ({ mediaId, position })) },
    },
    include: { ingredients: true, steps: true },
  });

  await revalidateBrand(input.brandId);
  return recipe;
}

export async function updateRecipe(
  id: string,
  input: RecipeInput,
  actor: Admin,
  opts: { expectedVersion?: number } = {},
) {
  const current = await db.recipe.findUnique({ where: { id } });
  if (!current || current.deletedAt) throw new NotFoundError("Recipe");

  if (opts.expectedVersion != null && opts.expectedVersion !== current.version) {
    throw new ConflictError("This recipe was changed by someone else. Reload to see the latest version.");
  }

  await assertBrandCategoryAndTagsMatch(input.brandId, input.categoryId, input.tagIds);

  let slug = current.slug;
  const wasPublished = current.status === "PUBLISHED";
  const brandChanged = current.brandId !== input.brandId;
  const titleChanged = current.title !== input.title;

  if (brandChanged || (input.slug && input.slug !== current.slug) || (titleChanged && !input.slug)) {
    slug = await uniqueSlug(input.slug || input.title, async (candidate) => {
      if (candidate === current.slug && !brandChanged) return false;
      const existing = await db.recipe.findFirst({
        where: { brandId: input.brandId, slug: candidate, deletedAt: null, id: { not: id } },
      });
      return !!existing;
    });
  }

  if (input.status === "PUBLISHED") {
    const { ok, missing } = publishChecklist({ ...input, heroImageId: input.heroImageId });
    if (!ok) {
      throw new ValidationError(`Can't publish yet — missing: ${missing.join(", ")}.`, {
        status: [`Missing: ${missing.join(", ")}`],
      });
    }
  }

  const recipe = await db.$transaction(async (tx) => {
    if (wasPublished && slug !== current.slug) {
      await tx.slugRedirect.upsert({
        where: { brandId_fromSlug: { brandId: current.brandId, fromSlug: current.slug } },
        create: { brandId: current.brandId, fromSlug: current.slug, recipeId: id },
        update: { recipeId: id },
      });
    }

    if (brandChanged) {
      await tx.recipeTag.deleteMany({ where: { recipeId: id } });
    }

    await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
    await tx.recipeStep.deleteMany({ where: { recipeId: id } });
    await tx.recipeMedia.deleteMany({ where: { recipeId: id } });

    return tx.recipe.update({
      where: { id },
      data: {
        brandId: input.brandId,
        categoryId: brandChanged ? null : (input.categoryId ?? null),
        externalId: input.externalId ?? null,
        slug,
        title: input.title,
        subtitle: input.subtitle ?? null,
        excerpt: input.excerpt ?? null,
        description: input.description ?? null,
        heroImageId: input.heroImageId ?? null,
        prepMinutes: input.prepMinutes ?? null,
        cookMinutes: input.cookMinutes ?? null,
        restMinutes: input.restMinutes ?? null,
        totalMinutes: computeTotalMinutes(input),
        servings: input.servings ?? null,
        yieldText: input.yieldText ?? null,
        difficulty: input.difficulty ?? null,
        cuisine: input.cuisine ?? null,
        course: input.course ?? null,
        dietary: input.dietary,
        spiceLevel: input.spiceLevel ?? null,
        equipment: input.equipment,
        nutrition: input.nutrition ?? Prisma.JsonNull,
        notes: input.notes ?? null,
        tips: input.tips ?? null,
        dishCode: input.dishCode ?? null,
        author: input.author ?? null,
        approvedBy: input.approvedBy ?? null,
        effectiveDate: input.effectiveDate ?? null,
        nextReviewDate: input.nextReviewDate ?? null,
        miseEnPlace: input.miseEnPlace,
        plating: input.plating ?? null,
        holding: input.holding ?? null,
        allergens: input.allergens ?? null,
        customFields: input.customFields as Prisma.InputJsonValue,
        ingredientText: ingredientText(input.ingredients),
        status: input.status,
        publishAt: input.publishAt ?? null,
        publishedAt: input.status === "PUBLISHED" ? (current.publishedAt ?? new Date()) : current.publishedAt,
        featured: input.featured,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        noindex: input.noindex,
        updatedById: actor.id,
        version: { increment: 1 },
        ingredients: { create: input.ingredients },
        steps: { create: input.steps },
        tags: brandChanged
          ? { create: input.tagIds.map((tagId) => ({ tagId })) }
          : {
              deleteMany: {},
              create: input.tagIds.map((tagId) => ({ tagId })),
            },
        gallery: { create: input.galleryMediaIds.map((mediaId, position) => ({ mediaId, position })) },
      },
      include: { ingredients: true, steps: true },
    });
  });

  await revalidateBrand(current.brandId);
  if (brandChanged) await revalidateBrand(input.brandId);
  revalidateTag(`recipe:${id}`);
  return recipe;
}

export async function setRecipeStatus(id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED", actor: Admin) {
  const recipe = await db.recipe.findUnique({ where: { id } });
  if (!recipe || recipe.deletedAt) throw new NotFoundError("Recipe");

  if (status === "PUBLISHED") {
    const checklistInput = {
      title: recipe.title,
      heroImageId: recipe.heroImageId,
      brandId: recipe.brandId,
      ingredients: await db.recipeIngredient.findMany({ where: { recipeId: id }, take: 1 }),
      steps: await db.recipeStep.findMany({ where: { recipeId: id }, take: 1 }),
    };
    const { ok, missing } = publishChecklist(checklistInput);
    if (!ok) throw new ValidationError(`Can't publish yet — missing: ${missing.join(", ")}.`);
  }

  const updated = await db.recipe.update({
    where: { id },
    data: {
      status,
      publishedAt: status === "PUBLISHED" ? (recipe.publishedAt ?? new Date()) : recipe.publishedAt,
      updatedById: actor.id,
      version: { increment: 1 },
    },
  });
  await revalidateBrand(recipe.brandId);
  revalidateTag(`recipe:${id}`);
  return updated;
}

export async function duplicateRecipe(id: string, actor: Admin, targetBrandId?: string) {
  const source = await db.recipe.findUnique({
    where: { id },
    include: { ingredients: true, steps: true, tags: true, gallery: true },
  });
  if (!source || source.deletedAt) throw new NotFoundError("Recipe");

  const brandId = targetBrandId ?? source.brandId;
  const brandChanged = brandId !== source.brandId;

  let categoryId: string | null = source.categoryId;
  let tagIds: string[] = source.tags.map((t) => t.tagId);
  if (brandChanged) {
    categoryId = null;
    if (source.categoryId) {
      const sourceCategory = await db.category.findUnique({ where: { id: source.categoryId } });
      if (sourceCategory) {
        const match = await db.category.findFirst({ where: { brandId, slug: sourceCategory.slug } });
        categoryId = match?.id ?? null;
      }
    }
    const sourceTags = await db.tag.findMany({ where: { id: { in: tagIds } } });
    const matched = await db.tag.findMany({ where: { brandId, slug: { in: sourceTags.map((t) => t.slug) } } });
    tagIds = matched.map((t) => t.id);
  }

  const slug = await uniqueSlug(`${source.title} copy`, async (candidate) => {
    const existing = await db.recipe.findFirst({ where: { brandId, slug: candidate, deletedAt: null } });
    return !!existing;
  });

  const copy = await db.recipe.create({
    data: {
      brandId,
      categoryId,
      slug,
      title: `${source.title} (Copy)`,
      subtitle: source.subtitle,
      excerpt: source.excerpt,
      description: source.description,
      heroImageId: source.heroImageId,
      prepMinutes: source.prepMinutes,
      cookMinutes: source.cookMinutes,
      restMinutes: source.restMinutes,
      totalMinutes: source.totalMinutes,
      servings: source.servings,
      yieldText: source.yieldText,
      difficulty: source.difficulty,
      cuisine: source.cuisine,
      course: source.course,
      dietary: source.dietary,
      spiceLevel: source.spiceLevel,
      equipment: source.equipment,
      nutrition: source.nutrition ?? Prisma.JsonNull,
      notes: source.notes,
      tips: source.tips,
      customFields: source.customFields as Prisma.InputJsonValue,
      ingredientText: source.ingredientText,
      status: "DRAFT",
      featured: false,
      createdById: actor.id,
      updatedById: actor.id,
      ingredients: {
        create: source.ingredients.map(({ id: _id, recipeId: _r, ...rest }) => rest),
      },
      steps: {
        create: source.steps.map(({ id: _id, recipeId: _r, ...rest }) => rest),
      },
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
      gallery: { create: source.gallery.map(({ mediaId, position, caption }) => ({ mediaId, position, caption })) },
    },
  });

  await revalidateBrand(brandId);
  return copy;
}

export async function trashRecipe(id: string, actor: Admin) {
  const recipe = await db.recipe.findUnique({ where: { id } });
  if (!recipe || recipe.deletedAt) throw new NotFoundError("Recipe");
  const updated = await db.recipe.update({
    where: { id },
    data: { deletedAt: new Date(), status: "ARCHIVED", updatedById: actor.id },
  });
  await revalidateBrand(recipe.brandId);
  return updated;
}

export async function trashRecipes(ids: string[], actor: Admin) {
  const recipes = await db.recipe.findMany({ where: { id: { in: ids }, deletedAt: null } });
  if (!recipes.length) return { count: 0 };
  const updated = await db.recipe.updateMany({
    where: { id: { in: recipes.map((r) => r.id) } },
    data: { deletedAt: new Date(), status: "ARCHIVED", updatedById: actor.id },
  });
  const brandIds = [...new Set(recipes.map((r) => r.brandId))];
  await Promise.all(brandIds.map((bId) => revalidateBrand(bId)));
  return updated;
}

export async function restoreRecipe(id: string, actor: Admin) {
  const recipe = await db.recipe.findUnique({ where: { id } });
  if (!recipe || !recipe.deletedAt) throw new NotFoundError("Recipe");
  const updated = await db.recipe.update({
    where: { id },
    data: { deletedAt: null, status: "DRAFT", updatedById: actor.id },
  });
  await revalidateBrand(recipe.brandId);
  return updated;
}

export async function purgeTrashedOlderThan(days: number): Promise<number> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await db.recipe.deleteMany({ where: { deletedAt: { not: null, lte: cutoff } } });
  return result.count;
}
