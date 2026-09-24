"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startImportAction } from "@/app/admin/actions/import";

export function ImportUploadForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("file", file);
      const result = await startImportAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.data.duplicateOfJobId) {
        const proceed = confirm("This file looks like one you already imported. Continue anyway?");
        if (!proceed) return;
      }
      router.push(`/admin/import/${result.data.jobId}`);
    });
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
      <p className="mb-3 text-slate-700">Drop your .xlsx/.xls/.csv file here, or</p>
      <label className="inline-block cursor-pointer rounded-lg bg-[#C6E86B] px-5 py-2 text-sm font-semibold text-[#0A2399]">
        Choose file
        <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </label>
      {fileName && <p className="mt-3 text-sm text-slate-600">{pending ? "Uploading…" : fileName}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
