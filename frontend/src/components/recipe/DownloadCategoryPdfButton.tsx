"use client";

import { useState } from "react";
import { buildRecipePrintDocument, downloadRecipePdf, pdfFileName, type PrintRecipe } from "@/lib/recipe-print";
import type { SopTemplateKey } from "@/lib/sop/templates";

export function DownloadCategoryPdfButton({
  brandSlug,
  categorySlug,
  categoryName,
}: {
  brandSlug: string;
  categorySlug: string;
  categoryName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  const handleDownload = async () => {
    setLoading(true);
    setProgress("");
    try {
      const res = await fetch(`/api/category-pdf?brand=${encodeURIComponent(brandSlug)}&category=${encodeURIComponent(categorySlug)}`);
      if (!res.ok) throw new Error("Failed to fetch recipes");
      const data: {
        brandName: string;
        template: SopTemplateKey;
        categoryName: string;
        categoryNumber: number;
        categoryDescription: string | null;
        recipes: PrintRecipe[];
      } = await res.json();

      if (!data.recipes || data.recipes.length === 0) {
        alert("No recipes found in this category.");
        return;
      }

      await downloadRecipePdf(
        buildRecipePrintDocument({
          title: `${data.categoryName} - All Recipes - ${data.brandName}`,
          brandName: data.brandName,
          recipes: data.recipes,
          template: data.template,
          collection: { categoryName: data.categoryName, number: data.categoryNumber, description: data.categoryDescription },
        }),
        pdfFileName(data.brandName, data.categoryName),
        (done, total) => setProgress(`${done}/${total}`),
      );
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      // Fixed light surface (not the brand theme) so it reads over the dark category photo on every brand.
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-white bg-white px-4 py-2.5 text-sm font-semibold uppercase tracking-widest text-slate-900 shadow-sm transition-all hover:bg-slate-100 hover:shadow-md disabled:opacity-60 disabled:cursor-wait"
      title={`Download all ${categoryName} recipes as PDF`}
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
      {loading ? `Generating${progress ? ` ${progress}` : "..."}` : "Download PDF"}
    </button>
  );
}
