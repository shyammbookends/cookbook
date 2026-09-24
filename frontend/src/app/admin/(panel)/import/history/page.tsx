import { listImportJobs } from "@/server/import/service";
import { ImportHistoryExplorer } from "@/components/admin/ImportHistoryExplorer";

export const metadata = { title: "Import History" };

export default async function ImportHistoryPage() {
  const { jobs } = await listImportJobs();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Import history</h1>
      <ImportHistoryExplorer jobs={jobs} />
    </div>
  );
}
