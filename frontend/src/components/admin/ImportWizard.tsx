"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IMPORT_COLUMNS } from "@/server/import/columns";
import {
  updateMappingAction, runValidationAction, getImportRowsAction,
  confirmImportAction, rollbackImportAction,
} from "@/app/admin/actions/import";

interface ImportOptions { duplicatePolicy: "skip" | "update" | "copy"; createMissingCategories: boolean; publishMode: "draft" | "publish_valid" }
interface Issue { field: string; column: string; code: string; severity: "error" | "warning"; message: string; suggestion?: string }
interface Row { id: string; rowNumber: number; status: string; issues: Issue[]; normalized: Record<string, unknown> }

const STATUS_TABS = ["ALL", "VALID", "WARNING", "ERROR", "DUPLICATE"] as const;

export function ImportWizard({
  jobId, status, headers, totalRows, initialMapping, initialOptions, counts,
}: {
  jobId: string;
  status: string;
  headers: string[];
  totalRows: number;
  initialMapping: Record<number, string | null>;
  initialOptions: ImportOptions;
  counts: { valid: number; warning: number; error: number; duplicate: number; imported: number; skipped: number };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mapping, setMapping] = useState(initialMapping);
  const [options, setOptions] = useState<ImportOptions>(initialOptions);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>("ALL");
  const [rows, setRows] = useState<Row[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [confirmResult, setConfirmResult] = useState<{ imported: number; skipped: number; failed: number } | null>(null);

  const showMapping = status === "MAPPING";
  const showPreview = ["VALIDATING", "READY", "IMPORTING"].includes(status);
  const showDone = ["COMPLETED", "COMPLETED_WITH_ERRORS", "ROLLED_BACK"].includes(status);

  useEffect(() => {
    if (!showPreview && !showDone) return;
    // Standard client-side data fetch keyed on the active tab/job — there's
    // no server component here to load this from (it's a tabbed, on-demand
    // preview table), so an effect + setState is the right tool.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRowsLoading(true);
    getImportRowsAction(jobId, tab === "ALL" ? undefined : tab, 1)
      .then((r) => setRows(r.rows as unknown as Row[]))
      .finally(() => setRowsLoading(false));
  }, [jobId, tab, showPreview, showDone, status]);

  function runValidation() {
    setError(null);
    startTransition(async () => {
      const mapResult = await updateMappingAction(jobId, mapping);
      if (!mapResult.ok) { setError(mapResult.error); return; }
      const valResult = await runValidationAction(jobId, options);
      if (!valResult.ok) { setError(valResult.error); return; }
      router.refresh();
    });
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await confirmImportAction(jobId);
      if (!result.ok) { setError(result.error); return; }
      setConfirmResult(result.data);
      router.refresh();
    });
  }

  function rollback() {
    if (!window.confirm("This will trash every recipe this import created. Continue?")) return;
    startTransition(async () => {
      const result = await rollbackImportAction(jobId);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-700">{error}</p>}

      {showMapping && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 font-semibold">1. Map your columns</h2>
          <p className="mb-4 text-sm text-slate-500">{totalRows} rows detected. We pre-matched what we could — check the rest.</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {headers.map((h, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <span className="w-40 truncate text-slate-700" title={h}>{h || <em className="text-slate-400">(blank)</em>}</span>
                <span className="text-slate-400">→</span>
                <select
                  value={mapping[idx] ?? ""}
                  onChange={(e) => setMapping((m) => ({ ...m, [idx]: e.target.value || null }))}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 [&>option]:bg-slate-50 [&>option]:text-slate-900"
                >
                  <option value="">Don&apos;t import</option>
                  {IMPORT_COLUMNS.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}{c.required ? " *" : ""}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <h2 className="mb-1 mt-6 font-semibold">2. Import options</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Duplicate recipes</label>
              <select value={options.duplicatePolicy} onChange={(e) => setOptions((o) => ({ ...o, duplicatePolicy: e.target.value as ImportOptions["duplicatePolicy"] }))} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm [&>option]:bg-slate-50 [&>option]:text-slate-900">
                <option value="skip">Skip</option>
                <option value="update">Update existing (by external ID)</option>
                <option value="copy">Create as new copy</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Publish mode</label>
              <select value={options.publishMode} onChange={(e) => setOptions((o) => ({ ...o, publishMode: e.target.value as ImportOptions["publishMode"] }))} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm [&>option]:bg-slate-50 [&>option]:text-slate-900">
                <option value="draft">Import all as Draft</option>
                <option value="publish_valid">Publish valid rows with an image</option>
              </select>
            </div>
            <label className="mt-5 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={options.createMissingCategories} onChange={(e) => setOptions((o) => ({ ...o, createMissingCategories: e.target.checked }))} />
              Create missing categories
            </label>
          </div>

          <button disabled={pending} onClick={runValidation} className="mt-6 rounded-lg bg-[#C6E86B] px-5 py-2 text-sm font-semibold text-[#0A2399] disabled:opacity-60">
            {pending ? "Validating…" : "Validate & preview →"}
          </button>
        </section>
      )}

      {(showPreview || showDone) && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold">{showDone ? "Import summary" : "3. Preview"}</h2>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
            {[
              ["Total", totalRows], ["Valid", counts.valid], ["Warnings", counts.warning],
              ["Errors", counts.error], ["Duplicates", counts.duplicate],
              ...(showDone ? [["Imported", counts.imported], ["Skipped", counts.skipped]] : []),
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-lg bg-black/20 p-3 text-center">
                <p className="text-xl font-bold">{value}</p>
                <p className="text-[10px] uppercase text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          {confirmResult && (
            <p className="mb-4 rounded-lg bg-green-500/10 p-3 text-sm text-green-700">
              Imported {confirmResult.imported}, skipped {confirmResult.skipped}, failed {confirmResult.failed}.
            </p>
          )}

          <div className="mb-3 flex gap-2 text-xs">
            {STATUS_TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-full px-3 py-1 ${tab === t ? "bg-blue-600 text-white" : "bg-slate-100"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="max-h-96 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
                <tr><th className="p-2">Row</th><th className="p-2">Title</th><th className="p-2">Status</th><th className="p-2">Issues</th></tr>
              </thead>
              <tbody>
                {rowsLoading && <tr><td colSpan={4} className="p-4 text-center text-slate-400">Loading…</td></tr>}
                {!rowsLoading && rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="p-2">{r.rowNumber}</td>
                    <td className="p-2">{String(r.normalized?.title ?? "")}</td>
                    <td className="p-2">
                      <span className={
                        r.status === "ERROR" || r.status === "FAILED" ? "text-red-600" :
                        r.status === "WARNING" || r.status === "DUPLICATE" ? "text-amber-600" :
                        r.status === "IMPORTED" ? "text-green-600" : "text-slate-600"
                      }>{r.status}</span>
                    </td>
                    <td className="p-2">
                      {r.issues.map((i, idx) => (
                        <div key={idx} className={i.severity === "error" ? "text-red-700" : "text-amber-700"}>
                          <strong>{i.column}:</strong> {i.message} {i.suggestion && <em>{i.suggestion}</em>}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
                {!rowsLoading && rows.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-400">No rows in this filter.</td></tr>}
              </tbody>
            </table>
          </div>

          {showPreview && (
            <button
              disabled={pending || counts.valid + counts.warning + counts.duplicate === 0}
              onClick={handleConfirm}
              className="mt-4 rounded-lg bg-[#C6E86B] px-5 py-2 text-sm font-semibold text-[#0A2399] disabled:opacity-60"
            >
              {pending ? "Importing…" : `Confirm import (${counts.valid + counts.warning + counts.duplicate} recipes)`}
            </button>
          )}

          {showDone && status !== "ROLLED_BACK" && (
            <button disabled={pending} onClick={rollback} className="mt-4 rounded-lg bg-red-500/20 px-5 py-2 text-sm text-red-700 hover:bg-red-500/30">
              Undo this import
            </button>
          )}
        </section>
      )}
    </div>
  );
}
