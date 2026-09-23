import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { ImportWizard } from "@/components/admin/ImportWizard";

export const metadata = { title: "Import" };

interface JobOptionsBlob {
  sheet: { headers: string[]; rows: unknown[] };
  mapping: Record<number, string | null>;
  importOptions: { duplicatePolicy: "skip" | "update" | "copy"; createMissingCategories: boolean; publishMode: "draft" | "publish_valid" };
}

export default async function ImportJobPage(props: PageProps<"/admin/import/[jobId]">) {
  const { jobId } = await props.params;
  const job = await db.importJob.findUnique({ where: { id: jobId } });
  if (!job) notFound();

  const blob = job.options as unknown as JobOptionsBlob;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Import: {job.originalName}</h1>
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
  );
}
