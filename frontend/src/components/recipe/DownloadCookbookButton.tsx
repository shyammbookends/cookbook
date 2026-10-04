"use client";

import { useState } from "react";
import { buildRecipePrintDocument, downloadRecipePdf, pdfFileName } from "@/lib/recipe-print";
import type { CookbookCategory } from "@/lib/sop/cookbook";
import type { SopTemplateKey } from "@/lib/sop/templates";

/**
 * Brand home: downloads the brand's whole cookbook (cover, index, then every
 * category's recipes, one A4 page each) as one PDF. Data is fetched fresh on
 * every click, so added / removed recipes are reflected automatically.
 */
export function DownloadCookbookButton({ brandSlug, brandName }: { brandSlug: string; brandName: string }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  const handleDownload = async () => {
    setLoading(true);
    setProgress("");
    try {
      const res = await fetch(`/api/category-pdf?brand=${encodeURIComponent(brandSlug)}&cookbook=1`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch recipes");
      const data: { brandName: string; template: SopTemplateKey; categories: CookbookCategory[] } = await res.json();

      if (!data.categories?.length) {
        alert("No recipes found yet.");
        return;
      }

      await downloadRecipePdf(
        buildRecipePrintDocument({
          title: `${data.brandName} - Master Cookbook`,
          brandName: data.brandName,
          recipes: [],
          template: data.template,
          cookbook: { categories: data.categories },
        }),
        pdfFileName(data.brandName, "Master Cookbook"),
        (done, total) => setProgress(`${done}/${total}`),
      );
    } catch (err) {
      console.error("Cookbook PDF error:", err);
      alert("Failed to generate the cookbook PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      // Fixed light surface (not the brand theme) so it reads on every brand's background.
      className="mt-8 inline-flex items-center justify-center gap-2.5 rounded-full border border-white bg-white px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-slate-900 shadow-lg transition-all hover:bg-slate-100 hover:shadow-xl disabled:cursor-wait disabled:opacity-60 print:hidden"
      title={`Download the full ${brandName} cookbook as one PDF`}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )}
      {loading ? `Generating${progress ? ` ${progress}` : "…"}` : `Download Main Cookbook Of ${brandName}`}
    </button>
  );
}
