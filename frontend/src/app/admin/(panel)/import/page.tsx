import Link from "next/link";
import { ImportUploadForm } from "@/components/admin/ImportUploadForm";
import { IMPORT_COLUMNS } from "@/server/import/columns";

export const metadata = { title: "Import Excel" };

export default function ImportPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Import Excel</h1>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- this is a file download from a route handler, not a page to client-navigate to */}
        <a href="/api/admin/import/template" className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
          ↓ Download template
        </a>
      </div>

      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="mb-3 font-semibold">How it works</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-white/70">
          <li>Download the template (it always reflects your current brands and categories).</li>
          <li>Fill in your recipes — one row per recipe. Columns marked * are required.</li>
          <li>Upload the file below. We&apos;ll auto-map your columns and show you a preview before anything is saved.</li>
          <li>Fix any errors directly in the preview, choose how to handle duplicates, then confirm.</li>
        </ol>
      </div>

      <ImportUploadForm />

      <details className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
        <summary className="cursor-pointer font-semibold">Column reference</summary>
        <div className="mt-4 overflow-x-auto"><table className="w-full text-xs">
          <thead className="text-left text-white/50"><tr><th className="pb-2">Column</th><th className="pb-2">Required</th><th className="pb-2">Notes</th></tr></thead>
          <tbody>
            {IMPORT_COLUMNS.map((c) => (
              <tr key={c.key} className="border-t border-white/10">
                <td className="py-1.5 font-mono">{c.key}</td>
                <td className="py-1.5">{c.required ? "Yes" : ""}</td>
                <td className="py-1.5 text-white/60">{c.help}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </details>

      <p className="mt-6 text-sm text-white/50">
        <Link href="/admin/import/history" className="underline">View import history →</Link>
      </p>
    </div>
  );
}
