"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFieldDefinitionAction, deleteFieldDefinitionAction } from "@/app/admin/actions/field";

interface Field { id: string; key: string; label: string; type: string; brandId: string | null; required: boolean }

export function CustomFieldsManager({ fields, brands }: { fields: Field[]; brands: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState("TEXT");
  const [brandId, setBrandId] = useState("");
  const [required, setRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function add() {
    setError(null);
    startTransition(async () => {
      const result = await createFieldDefinitionAction({
        key: key.trim(), label: label.trim(), type: type as never, brandId: brandId || null, required, showOnFrontend: true, sortOrder: fields.length,
      });
      if (!result.ok) setError(result.error);
      else { setKey(""); setLabel(""); router.refresh(); }
    });
  }

  function remove(id: string) {
    if (!confirm("Remove this field? Existing recipe data for it is kept but hidden.")) return;
    startTransition(async () => {
      const result = await deleteFieldDefinitionAction(id);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  const inputCls = "rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none text-slate-900";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
      <ul className="mb-6 space-y-2 text-sm">
        {fields.map((f) => (
          <li key={f.id} className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 shadow-sm">
            <span className="text-slate-700">
              <code className="text-slate-500 bg-slate-200/50 px-1.5 py-0.5 rounded font-mono text-xs">custom:{f.key}</code> — <span className="font-medium">{f.label}</span> <span className="text-slate-400">({f.type})</span>{f.required ? <span className="text-red-500 font-bold"> *</span> : ""}
              <span className="text-slate-400 font-medium">{f.brandId ? ` · ${brands.find((b) => b.id === f.brandId)?.name ?? ""}` : " · all brands"}</span>
            </span>
            <button disabled={pending} onClick={() => remove(f.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors">✕</button>
          </li>
        ))}
        {fields.length === 0 && <li className="text-slate-500 text-center py-6 bg-slate-50 rounded-lg border border-slate-100 border-dashed">No custom fields yet.</li>}
      </ul>

      {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 shadow-sm">{error}</p>}
      <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div><label className="mb-1.5 block text-xs font-medium text-slate-600">Key</label><input value={key} onChange={(e) => setKey(e.target.value)} placeholder="wine_pairing" className={inputCls} /></div>
        <div><label className="mb-1.5 block text-xs font-medium text-slate-600">Label</label><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Wine pairing" className={inputCls} /></div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            {["TEXT", "LONGTEXT", "NUMBER", "BOOLEAN", "SELECT", "MULTISELECT", "URL", "DATE"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Brand</label>
          <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={inputCls}>
            <option value="">All brands</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 pb-2"><input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /> Required</label>
        <button disabled={pending || !key || !label} onClick={add} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 ml-auto">Add field</button>
      </div>
    </div>
  );
}
