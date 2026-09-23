import Link from "next/link";
import { listImportJobs } from "@/server/import/service";

export const metadata = { title: "Import History" };

export default async function ImportHistoryPage() {
  const { jobs } = await listImportJobs();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Import history</h1>
      <div className="overflow-hidden rounded-2xl border border-white/10"><div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase text-white/50">
            <tr><th className="p-3">File</th><th className="p-3">Status</th><th className="p-3">Rows</th><th className="p-3">By</th><th className="p-3">Date</th></tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-3"><Link href={`/admin/import/${job.id}`} className="hover:underline">{job.originalName}</Link></td>
                <td className="p-3">{job.status}</td>
                <td className="p-3 text-white/60">{job.importedRows}/{job.totalRows} imported</td>
                <td className="p-3 text-white/60">{job.createdBy.name}</td>
                <td className="p-3 text-white/60">{job.createdAt.toLocaleString()}</td>
              </tr>
            ))}
            {jobs.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-white/40">No imports yet.</td></tr>}
          </tbody>
        </table>
      </div></div>
    </div>
  );
}
