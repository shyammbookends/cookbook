"use client";

import { useState } from "react";
import { buildRecipePrintDocument, openPrintWindow, printInWindow, type PrintRecipe } from "@/lib/recipe-print";
import type { SopTemplateKey } from "@/lib/sop/templates";

/** Prints the recipe as the same single-page A4 SOP card used by the category download. */
export function PrintPdfButton({ brandSlug, recipeSlug }: { brandSlug: string; recipeSlug: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    const printWindow = openPrintWindow();
    if (!printWindow) {
      window.print();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/category-pdf?brand=${encodeURIComponent(brandSlug)}&recipe=${encodeURIComponent(recipeSlug)}`);
      if (!res.ok) throw new Error("Failed to fetch recipe");
      const data: { brandName: string; template: SopTemplateKey; recipes: PrintRecipe[] } = await res.json();
      const recipe = data.recipes[0];
      if (!recipe) throw new Error("Recipe not found");
      printInWindow(
        printWindow,
        buildRecipePrintDocument({ title: `${recipe.title} - ${data.brandName}`, brandName: data.brandName, recipes: [recipe], template: data.template }),
      );
    } catch (err) {
      console.error("PDF download error:", err);
      printWindow.close();
      window.print();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center justify-center rounded border border-black/20 bg-white/50 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-black transition-colors hover:bg-black/5 disabled:opacity-50 disabled:cursor-wait"
    >
      {loading ? "Preparing…" : "Download PDF"}
    </button>
  );
}
