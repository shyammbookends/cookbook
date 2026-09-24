"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface ImportJobItem {
  id: string;
  originalName: string;
  status: string;
  importedRows: number;
  totalRows: number;
  createdBy: { name: string };
  createdAt: string | Date;
}

export function ImportHistoryExplorer({ jobs }: { jobs: ImportJobItem[] }) {
  const [query, setQuery] = useState("");

  const filteredJobs = useMemo(() => {
    if (!query.trim()) return jobs;
    const q = query.toLowerCase().trim();
    return jobs.filter((j) =>
      j.originalName.toLowerCase().includes(q) ||
      j.status.toLowerCase().includes(q) ||
      j.createdBy.name.toLowerCase().includes(q)
    );
  }, [jobs, query]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search import history (auto-detects)…"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
        {query && (
          <span className="text-xs text-slate-500">
            Found {filteredJobs.length} of {jobs.length} jobs
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3 font-semibold">File</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Rows</th>
                <th className="p-3 font-semibold">By</th>
                <th className="p-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <Link href={`/admin/import/${job.id}`} className="hover:underline font-medium text-slate-800 hover:text-blue-600">
                      {job.originalName}
                    </Link>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        job.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : job.status === "FAILED"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 font-medium">
                    {job.importedRows}/{job.totalRows} imported
                  </td>
                  <td className="p-3 text-slate-600">{job.createdBy.name}</td>
                  <td className="p-3 text-slate-500">{new Date(job.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    {query ? `No import jobs matching "${query}".` : "No imports yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
