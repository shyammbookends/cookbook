import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { asVariants, mediaUrl } from "@/lib/media";

/**
 * GET /api/category-pdf?brand=<slug>&category=<slug>
 *
 * Returns all published recipes for a brand+category so the client can
 * build a composite printable document and invoke window.print() / Save-as-PDF.
 */

function scope(brandId: string): Prisma.RecipeWhereInput {
  return {
    brandId,
    status: "PUBLISHED",
    deletedAt: null,
    OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
  };
}

export async function GET(req: NextRequest) {
  const brandSlug = req.nextUrl.searchParams.get("brand");
  const categorySlug = req.nextUrl.searchParams.get("category");

  if (!brandSlug || !categorySlug) {
    return NextResponse.json({ error: "brand and category params required" }, { status: 400 });
  }

  const brand = await db.brand.findFirst({ where: { slug: brandSlug, status: "ACTIVE" } });
  if (!brand) return NextResponse.json({ error: "brand not found" }, { status: 404 });

  const category = await db.category.findFirst({ where: { brandId: brand.id, slug: categorySlug } });
  if (!category) return NextResponse.json({ error: "category not found" }, { status: 404 });

  const recipes = await db.recipe.findMany({
    where: {
      category: { slug: categorySlug },
      ...scope(brand.id),
    },
    select: {
      title: true,
      description: true,
      summary: true,
      station: true,
      dishCode: true,
      sopVersion: true,
      version: true,
      author: true,
      approvedBy: true,
      effectiveDate: true,
      nextReviewDate: true,
      yieldText: true,
      prepMinutes: true,
      cookMinutes: true,
      totalMinutes: true,
      dietary: true,
      miseEnPlace: true,
      equipment: true,
      qualityCheck: true,
      plating: true,
      holding: true,
      allergens: true,
      heroImage: { select: { id: true, variants: true } },
      ingredients: { orderBy: { position: "asc" as const } },
      steps: { orderBy: { position: "asc" as const } },
    },
    orderBy: { title: "asc" },
  });

  return NextResponse.json({
    brandName: brand.name,
    categoryName: category.name,
    recipes: recipes.map((r) => ({
      title: r.title,
      description: r.description,
      summary: r.summary,
      station: r.station,
      dishCode: r.dishCode,
      heroImageUrl: (() => {
        if (!r.heroImage) return null;
        const variants = asVariants(r.heroImage.variants);
        const webp = variants.filter((v) => v.format === "webp").sort((a, b) => b.w - a.w)[0];
        return webp ? mediaUrl(webp.key) : null;
      })(),
      versionLabel: r.sopVersion?.trim().replace(/^v/i, "") || `${r.version ?? 1}.0`,
      author: r.author,
      approvedBy: r.approvedBy,
      effectiveDate: r.effectiveDate,
      nextReviewDate: r.nextReviewDate,
      yieldText: r.yieldText,
      prepMinutes: r.prepMinutes,
      cookMinutes: r.cookMinutes,
      totalMinutes: r.totalMinutes,
      diet: r.dietary.join(", ") || null,
      miseEnPlace: r.miseEnPlace,
      equipment: r.equipment,
      qualityCheck: r.qualityCheck,
      plating: r.plating,
      holding: r.holding,
      allergens: r.allergens,
      ingredients: r.ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity ? Number(i.quantity) : null,
        unit: i.unit,
      })),
      steps: r.steps
        .filter((s) => s.phase === "PREP" || s.phase === "COOK" || s.phase === "FINISH")
        .map((s) => s.body),
    })),
  });
}
