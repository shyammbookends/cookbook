"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadMediaAction, uploadMediaFromUrlAction, deleteMediaAction } from "@/app/admin/actions/media";

interface MediaItem { id: string; url: string | null; alt: string | null; status: string; bytes: number; createdAt: string }

export function MediaLibrary({ initialMedia, brands }: { initialMedia: MediaItem[]; brands: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [brandId, setBrandId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    startTransition(async () => {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("file", file);
        if (brandId) fd.set("brandId", brandId);
        const result = await uploadMediaAction(fd);
        if (!result.ok) setError(result.error);
      }
      router.refresh();
    });
  }

  function handleUrlImport() {
    if (!url.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await uploadMediaFromUrlAction(url.trim(), brandId || undefined);
      if (!result.ok) setError(result.error);
      else { setUrl(""); router.refresh(); }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this image?")) return;
    startTransition(async () => {
      const result = await deleteMediaAction(id);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  const filteredMedia = initialMedia.filter((m) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const altMatch = m.alt ? m.alt.toLowerCase().includes(q) : false;
      const urlMatch = m.url ? m.url.toLowerCase().includes(q) : false;
      if (!altMatch && !urlMatch) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
        <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none">
          <option value="">Library filter: any brand</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media by alt or filename…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-3 pr-8 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="relative">
          <input type="file" accept="image/*" multiple disabled={pending} onChange={(e) => handleUpload(e.target.files)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors" />
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://image-url.jpg" className="w-64 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none" />
          <button disabled={pending} onClick={handleUrlImport} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50">Import URL</button>
        </div>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 shadow-sm">{error}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {filteredMedia.map((m) => (
          <div key={m.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
            {m.url ? (
              <img src={m.url} alt={m.alt ?? ""} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-xs text-slate-400 font-medium">{m.status}</div>
            )}
            <button
              onClick={() => handleDelete(m.id)}
              className="absolute right-2 top-2 rounded-full bg-white/90 shadow-md backdrop-blur-sm px-2 py-1 text-xs text-slate-700 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {filteredMedia.length === 0 && <p className="text-slate-400 text-center py-10 border border-slate-200 border-dashed rounded-2xl bg-white shadow-sm">No media found.</p>}
    </div>
  );
}
