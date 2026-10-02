import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/app/admin/actions/auth";
import { getImportJob } from "@/server/services/recipe-form";
import { ImportWizard } from "@/components/admin/ImportWizard";

export const metadata: Metadata = { title: "Import Excel" };

interface JobOptionsBlob {
  sheet: { headers: string[]; rows: unknown[] };
  mapping: Record<number, string | null>;
  importOptions: { duplicatePolicy: "skip" | "update" | "copy"; createMissingCategories: boolean; publishMode: "draft" | "publish_valid" };
}

export default async function AdminImportJobPage(props: PageProps<"/admin/[brand]/manage/import/[jobId]">) {
  const { brand: brandSlug, jobId } = await props.params;
  await requireAdminOrRedirect(`/admin/${brandSlug}/manage/import/${jobId}`);

  const job = await getImportJob(jobId);
  if (!job) notFound();
  const blob = job.options as unknown as JobOptionsBlob;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Link href={`/admin/${brandSlug}`} className="inline-flex items-center text-sm font-medium text-brand-fg/60 transition-colors hover:text-brand-accent">
        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to recipes
      </Link>
      <h1 className="mb-5 mt-3 text-3xl font-extrabold tracking-tight text-brand-fg">Import: {job.originalName}</h1>
      <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-sm">
        <ImportWizard
          jobId={job.id}
          status={job.status}
          headers={blob.sheet.headers}
          totalRows={job.totalRows}
          initialMapping={blob.mapping}
          initialOptions={blob.importOptions}
          counts={{ valid: job.validRows, warning: job.warningRows, error: job.errorRows, duplicate: job.duplicateRows, imported: job.importedRows, skipped: job.skippedRows }}
        />
      </div>
    </div>
  );
}
