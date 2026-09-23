import "server-only";
import { db } from "@/server/db";

export async function getDashboardStats() {
  const [total, published, drafts, brands, categories, recentRecipes, recentImports, needsImage, failedImports] =
    await Promise.all([
      db.recipe.count({ where: { deletedAt: null } }),
      db.recipe.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
      db.recipe.count({ where: { deletedAt: null, status: "DRAFT" } }),
      db.brand.findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { recipes: { where: { deletedAt: null } } } } },
      }),
      db.category.count(),
      db.recipe.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: { id: true, title: true, status: true, updatedAt: true, brand: { select: { slug: true, name: true } } },
      }),
      db.importJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { createdBy: { select: { name: true } } },
      }),
      db.recipe.count({ where: { deletedAt: null, heroImageId: null, status: { not: "ARCHIVED" } } }),
      db.importJob.count({ where: { status: { in: ["FAILED", "COMPLETED_WITH_ERRORS"] } } }),
    ]);

  return {
    total,
    published,
    drafts,
    scheduled: await db.recipe.count({ where: { deletedAt: null, publishAt: { gt: new Date() } } }),
    categories,
    brands: brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug, count: b._count.recipes })),
    recentRecipes,
    recentImports,
    needsImage,
    failedImports,
  };
}
