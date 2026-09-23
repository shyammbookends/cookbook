import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/server/db";
import { getStorage } from "@/server/media/storage";
import { validateImportFile, parseWorkbook, rowToRecord, type ParsedSheet } from "@/server/import/parse";
import { autoDetectMapping } from "@/server/import/columns";
import { normalizeRow, type NormalizedRow } from "@/server/import/normalize";
import { validateRowAgainstDb, DEFAULT_IMPORT_OPTIONS, type ImportOptions } from "@/server/import/validate";
import { findOrCreateTagsByName } from "@/server/services/taxonomy";
import { toSlug, uniqueSlug } from "@/lib/slug";
import { fetchImageFromUrl } from "@/server/media/fetchUrl";
import { uploadImage } from "@/server/media/upload";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { revalidateTag } from "@/server/cache";
import { Prisma } from "@/generated/prisma/client";
import type { Admin } from "@/generated/prisma/client";

interface JobOptionsBlob {
  sheet: ParsedSheet;
  mapping: Record<number, string | null>;
  importOptions: ImportOptions;
}

export async function startImportJob(buffer: Buffer, originalName: string, admin: Admin) {
  await validateImportFile(buffer, originalName);

  const fileHash = createHash("sha256").update(buffer).digest("hex");
  const duplicateOfJob = await db.importJob.findFirst({ where: { fileHash }, orderBy: { createdAt: "desc" } });

  const sheet = parseWorkbook(buffer);
  const mapping = autoDetectMapping(sheet.headers);

  const storage = getStorage();
  const fileKey = `imports/${admin.id}-${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  await storage.put(fileKey, buffer, "application/octet-stream");

  const optionsBlob: JobOptionsBlob = { sheet, mapping, importOptions: DEFAULT_IMPORT_OPTIONS };

  const job = await db.importJob.create({
    data: {
      fileKey,
      originalName,
      fileHash,
      status: "MAPPING",
      mapping,
      options: optionsBlob as unknown as Prisma.InputJsonValue,
      totalRows: sheet.rows.length,
      createdById: admin.id,
    },
  });

  return { job, duplicateOfJobId: duplicateOfJob?.id ?? null };
}

export async function getImportJob(id: string) {
  const job = await db.importJob.findUnique({ where: { id }, include: { createdBy: { select: { name: true } } } });
  if (!job) throw new NotFoundError("Import job");
  return job;
}

export async function updateMapping(jobId: string, mapping: Record<number, string | null>) {
  const job = await getImportJob(jobId);
  const blob = job.options as unknown as JobOptionsBlob;
  const updatedBlob: JobOptionsBlob = { ...blob, mapping };
  await db.importJob.update({ where: { id: jobId }, data: { mapping, options: updatedBlob as unknown as Prisma.InputJsonValue } });
}

/**
 * Runs normalize + DB validation over every row and persists ImportRow
 * records. Safe to re-run (e.g. after the mapping changes) — it replaces
 * any previously generated rows for this job.
 */
export async function runValidation(jobId: string, importOptions?: Partial<ImportOptions>) {
  const job = await getImportJob(jobId);
  const blob = job.options as unknown as JobOptionsBlob;
  const mergedOptions: ImportOptions = { ...blob.importOptions, ...importOptions };

  await db.importJob.update({
    where: { id: jobId },
    data: { status: "VALIDATING", options: { ...blob, importOptions: mergedOptions } as unknown as Prisma.InputJsonValue },
  });

  await db.importRow.deleteMany({ where: { jobId } });

  const seenInFile = new Map<string, number>();
  let valid = 0, warning = 0, error = 0, duplicate = 0;

  const rowsData: Prisma.ImportRowCreateManyInput[] = [];

  for (const row of blob.sheet.rows) {
    const record = rowToRecord(blob.sheet.headers, row.cells, blob.mapping);
    const { normalized, issues: formatIssues } = normalizeRow(record);
    const { issues, status, matchedRecipeId } = await validateRowAgainstDb(
      normalized, formatIssues, mergedOptions, seenInFile, row.rowNumber,
    );

    if (status === "ERROR") error++;
    else if (status === "DUPLICATE") duplicate++;
    else if (status === "WARNING") warning++;
    else valid++;

    rowsData.push({
      jobId,
      rowNumber: row.rowNumber,
      raw: record as Prisma.InputJsonValue,
      normalized: { ...normalized, matchedRecipeId } as unknown as Prisma.InputJsonValue,
      status,
      issues: issues as unknown as Prisma.InputJsonValue,
    });
  }

  await db.importRow.createMany({ data: rowsData });
  await db.importJob.update({
    where: { id: jobId },
    data: {
      status: "READY",
      validRows: valid,
      warningRows: warning,
      errorRows: error,
      duplicateRows: duplicate,
    },
  });

  return { valid, warning, error, duplicate, total: rowsData.length };
}

export async function listImportRows(jobId: string, opts: { status?: string; page?: number; pageSize?: number } = {}) {
  const page = opts.page ?? 1;
  const pageSize = Math.min(opts.pageSize ?? 50, 200);
  const where: Prisma.ImportRowWhereInput = { jobId, ...(opts.status ? { status: opts.status as never } : {}) };
  const [rows, total] = await Promise.all([
    db.importRow.findMany({ where, orderBy: { rowNumber: "asc" }, skip: (page - 1) * pageSize, take: pageSize }),
    db.importRow.count({ where }),
  ]);
  return { rows, total, page, pageSize };
}

/** Inline fix from the preview screen: patch the normalized data and re-validate just this row. */
export async function patchImportRow(jobId: string, rowId: string, patch: Partial<NormalizedRow>, opts: ImportOptions) {
  const row = await db.importRow.findUnique({ where: { id: rowId } });
  if (!row || row.jobId !== jobId) throw new NotFoundError("Import row");

  const current = row.normalized as unknown as NormalizedRow;
  const merged: NormalizedRow = { ...current, ...patch };

  const seenInFile = new Map<string, number>(); // single-row re-check; file-level dup check is best-effort here
  const { issues, status } = await validateRowAgainstDb(merged, [], opts, seenInFile, row.rowNumber);

  const updated = await db.importRow.update({
    where: { id: rowId },
    data: { normalized: merged as unknown as Prisma.InputJsonValue, status, issues: issues as unknown as Prisma.InputJsonValue },
  });

  await recomputeJobCounts(jobId);
  return updated;
}

async function recomputeJobCounts(jobId: string) {
  const [valid, warning, error, duplicate] = await Promise.all([
    db.importRow.count({ where: { jobId, status: "VALID" } }),
    db.importRow.count({ where: { jobId, status: "WARNING" } }),
    db.importRow.count({ where: { jobId, status: "ERROR" } }),
    db.importRow.count({ where: { jobId, status: "DUPLICATE" } }),
  ]);
  await db.importJob.update({ where: { id: jobId }, data: { validRows: valid, warningRows: warning, errorRows: error, duplicateRows: duplicate } });
}

/**
 * Executes the import: every non-ERROR, non-skipped row is created as a
 * recipe, one at a time so a single bad row can never stop the batch. Image
 * fetch failures downgrade a row to "imported with placeholder", never fail it.
 */
export async function confirmImport(jobId: string, admin: Admin) {
  const job = await getImportJob(jobId);
  if (job.status !== "READY") throw new ValidationError("This import isn't ready to confirm.");
  const blob = job.options as unknown as JobOptionsBlob;

  await db.importJob.update({ where: { id: jobId }, data: { status: "IMPORTING", startedAt: new Date() } });

  const rows = await db.importRow.findMany({ where: { jobId, status: { in: ["VALID", "WARNING", "DUPLICATE"] } }, orderBy: { rowNumber: "asc" } });

  let imported = 0, skipped = 0, failed = 0;
  const touchedBrandIds = new Set<string>();

  for (const row of rows) {
    try {
      const normalized = row.normalized as unknown as NormalizedRow & { matchedRecipeId: string | null };

      if (normalized.matchedRecipeId && blob.importOptions.duplicatePolicy === "skip") {
        await db.importRow.update({ where: { id: row.id }, data: { status: "SKIPPED" } });
        skipped++;
        continue;
      }

      const brand = await db.brand.findFirst({
        where: { OR: [{ slug: toSlug(normalized.brandRaw) }, { name: { equals: normalized.brandRaw, mode: "insensitive" } }] },
      });
      if (!brand) throw new Error(`Brand "${normalized.brandRaw}" not found.`);
      touchedBrandIds.add(brand.id);

      let categoryId: string | null = null;
      if (normalized.categoryRaw) {
        const slug = toSlug(normalized.categoryRaw);
        const category = await db.category.upsert({
          where: { brandId_slug: { brandId: brand.id, slug } },
          create: { brandId: brand.id, slug, name: normalized.categoryRaw },
          update: {},
        });
        categoryId = category.id;
      }

      const tagIds = normalized.tags.length ? await findOrCreateTagsByName(brand.id, normalized.tags) : [];

      let heroImageId: string | null = null;
      if (normalized.heroImageRef) {
        if (/^https?:\/\//i.test(normalized.heroImageRef)) {
          try {
            const imgBuffer = await fetchImageFromUrl(normalized.heroImageRef);
            const media = await uploadImage({
              buffer: imgBuffer,
              originalName: normalized.heroImageRef.split("/").pop() ?? "image",
              brandId: brand.id,
              uploadedById: admin.id,
              alt: normalized.title,
            });
            heroImageId = media.id;
          } catch {
            // Image fetch failure never fails the row — imported with a placeholder instead.
          }
        }
        // ZIP-file image references are a future enhancement (see plan §13); left without an image for now.
      }

      const ingredients = normalized.ingredientGroups.flatMap((group, gi) =>
        group.lines.map((line, li) => ({
          position: gi * 1000 + li,
          groupLabel: group.groupLabel,
          quantity: line.quantity,
          quantityMax: line.quantityMax,
          unit: line.unit,
          name: line.name,
          note: line.note,
          raw: line.raw,
        })),
      );
      const steps = [
        ...normalized.prepSteps.map((body, i) => ({ phase: "PREP" as const, position: i, body })),
        ...normalized.cookSteps.map((body, i) => ({ phase: "COOK" as const, position: i, body })),
      ];

      const status = blob.importOptions.publishMode === "publish_valid" && row.status === "VALID" && heroImageId
        ? "PUBLISHED" as const
        : "DRAFT" as const;

      const slug = await uniqueSlug(normalized.slug || normalized.title, async (candidate) => {
        const existing = await db.recipe.findFirst({ where: { brandId: brand.id, slug: candidate, deletedAt: null } });
        return !!existing;
      });

      const recipe = normalized.matchedRecipeId && blob.importOptions.duplicatePolicy === "update"
        ? await db.recipe.update({
            where: { id: normalized.matchedRecipeId },
            data: {
              title: normalized.title, categoryId, excerpt: normalized.excerpt, description: normalized.description,
              heroImageId: heroImageId ?? undefined, prepMinutes: normalized.prepMinutes, cookMinutes: normalized.cookMinutes,
              restMinutes: normalized.restMinutes, totalMinutes: normalized.totalMinutes, servings: normalized.servings,
              yieldText: normalized.yieldText, difficulty: normalized.difficulty, cuisine: normalized.cuisine,
              course: normalized.course, dietary: normalized.dietary, spiceLevel: normalized.spiceLevel,
              equipment: normalized.equipment, notes: normalized.notes, tips: normalized.tips,
              nutrition: normalized.nutrition as unknown as Prisma.InputJsonValue,
              seoTitle: normalized.seoTitle, seoDescription: normalized.seoDescription, featured: normalized.featured,
              dishCode: normalized.dishCode, version: { increment: 1 }, author: normalized.author,
              approvedBy: normalized.approvedBy, effectiveDate: normalized.effectiveDate, nextReviewDate: normalized.nextReviewDate,
              miseEnPlace: normalized.miseEnPlace, plating: normalized.plating, holding: normalized.holding, allergens: normalized.allergens,
              updatedById: admin.id, importJobId: jobId,
              ingredients: { deleteMany: {}, create: ingredients },
              steps: { deleteMany: {}, create: steps },
              tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) },
            },
          })
        : await db.recipe.create({
            data: {
              brandId: brand.id, categoryId, externalId: normalized.externalId, slug, title: normalized.title,
              excerpt: normalized.excerpt, description: normalized.description, heroImageId,
              prepMinutes: normalized.prepMinutes, cookMinutes: normalized.cookMinutes, restMinutes: normalized.restMinutes,
              totalMinutes: normalized.totalMinutes, servings: normalized.servings, yieldText: normalized.yieldText,
              difficulty: normalized.difficulty, cuisine: normalized.cuisine, course: normalized.course,
              dietary: normalized.dietary, spiceLevel: normalized.spiceLevel, equipment: normalized.equipment,
              nutrition: normalized.nutrition as unknown as Prisma.InputJsonValue, notes: normalized.notes, tips: normalized.tips,
              ingredientText: ingredients.map((i) => i.name).join(" "),
              dishCode: normalized.dishCode, version: normalized.version || 1, author: normalized.author,
              approvedBy: normalized.approvedBy, effectiveDate: normalized.effectiveDate, nextReviewDate: normalized.nextReviewDate,
              miseEnPlace: normalized.miseEnPlace, plating: normalized.plating, holding: normalized.holding, allergens: normalized.allergens,
              status, publishedAt: status === "PUBLISHED" ? new Date() : null, featured: normalized.featured,
              seoTitle: normalized.seoTitle, seoDescription: normalized.seoDescription,
              createdById: admin.id, updatedById: admin.id, importJobId: jobId,
              ingredients: { create: ingredients },
              steps: { create: steps },
              tags: { create: tagIds.map((tagId) => ({ tagId })) },
            },
          });

      await db.importRow.update({ where: { id: row.id }, data: { status: "IMPORTED", recipeId: recipe.id } });
      imported++;
    } catch (err) {
      failed++;
      const existingIssues = (row.issues as unknown as { field: string; column: string; code: string; severity: string; message: string }[]) ?? [];
      await db.importRow.update({
        where: { id: row.id },
        data: {
          status: "FAILED",
          issues: [
            ...existingIssues,
            { field: "_row", column: "Row", code: "IMPORT_FAILED", severity: "error", message: err instanceof Error ? err.message : "Import failed." },
          ] as unknown as Prisma.InputJsonValue,
        },
      });
    }
  }

  const finalStatus = failed > 0 ? "COMPLETED_WITH_ERRORS" : "COMPLETED";
  await db.importJob.update({
    where: { id: jobId },
    data: { status: finalStatus, importedRows: imported, skippedRows: skipped, finishedAt: new Date() },
  });

  for (const brandId of touchedBrandIds) {
    const brand = await db.brand.findUnique({ where: { id: brandId }, select: { slug: true } });
    if (brand) revalidateTag(`brand:${brand.slug}`);
  }

  return { imported, skipped, failed };
}

export async function cancelImportJob(jobId: string) {
  await db.importJob.update({ where: { id: jobId }, data: { status: "CANCELLED" } });
}

/** Undo: soft-deletes every recipe this job created (recipes it only updated are left as-is). */
export async function rollbackImportJob(jobId: string) {
  const result = await db.recipe.updateMany({
    where: { importJobId: jobId, deletedAt: null },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  });
  await db.importJob.update({ where: { id: jobId }, data: { status: "ROLLED_BACK" } });
  revalidateTag("brands");
  return result.count;
}

export async function listImportJobs(page = 1, pageSize = 20) {
  const [jobs, total] = await Promise.all([
    db.importJob.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { createdBy: { select: { name: true } } },
    }),
    db.importJob.count(),
  ]);
  return { jobs, total, page, pageSize };
}
