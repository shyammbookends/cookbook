"use client";

import { useState } from "react";

interface RecipeData {
  title: string;
  description: string | null;
  summary: string | null;
  station: string | null;
  dishCode: string | null;
  versionLabel: string;
  author: string | null;
  approvedBy: string | null;
  effectiveDate: string | null;
  nextReviewDate: string | null;
  yieldText: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  totalMinutes: number | null;
  diet: string | null;
  miseEnPlace: string[];
  equipment: string[];
  qualityCheck: string[];
  plating: string | null;
  holding: string | null;
  allergens: string | null;
  heroImageUrl: string | null;
  ingredients: { name: string; quantity: number | null; unit: string | null }[];
  steps: string[];
}

function fmtDate(d: string | null): string {
  if (!d) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
  } catch {
    return "N/A";
  }
}

function buildRecipeHtml(r: RecipeData, brandName: string, idx: number): string {
  const docId = `${r.dishCode || "N/A"}-v${r.versionLabel}`;

  const ingredientRows = r.ingredients
    .map((i) => `<tr><td style="padding:4px 8px 4px 0;border-bottom:1px dotted #ccc">${i.name}</td><td style="padding:4px 0 4px 8px;border-bottom:1px dotted #ccc;text-align:right;white-space:nowrap">${i.quantity ?? ""} ${i.unit || ""}</td></tr>`)
    .join("");

  const stepRows = r.steps
    .map((s, i) => `<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px"><div style="width:24px;height:24px;border-radius:50%;background:#1F3D2D;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;font-weight:bold">${i + 1}</div><p style="margin:0;font-size:13px;line-height:1.6">${s}</p></div>`)
    .join("");

  const miseList = r.miseEnPlace.length > 0 ? r.miseEnPlace.map((m) => `<li>${m}</li>`).join("") : "<li>None</li>";
  const equipList = r.equipment.length > 0 ? r.equipment.map((e) => `<li>${e}</li>`).join("") : "<li>None</li>";
  const qcList = r.qualityCheck.length > 0
    ? r.qualityCheck.map((q) => `<li style="margin-bottom:4px">✓ ${q}</li>`).join("")
    : "";

  return `
    <div style="page-break-before:${idx > 0 ? "always" : "auto"};padding:40px;max-width:900px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2C3E35;background:#FAF8F5">
      <!-- Header -->
      <div style="border-bottom:3px solid #D4B572;padding-bottom:16px;margin-bottom:24px">
        <div style="font-size:11px;font-weight:bold;letter-spacing:3px;color:#D4B572;text-transform:uppercase">
          ${r.station ? `RECIPE | ${r.station}` : "RECIPE"}
        </div>
        <h1 style="margin:12px 0 0;font-size:32px;color:#1F3D2D;font-weight:700">${r.title}</h1>
        ${r.description ? `<p style="margin:8px 0 0;font-size:14px;color:#2C3E35cc;max-width:600px">${r.description}</p>` : ""}
      </div>

      <div style="display:flex;gap:40px">
        <!-- Left Column -->
        <div style="flex:1;min-width:260px">
          <!-- Meta -->
          <table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:20px">
            <tr><td style="padding:4px 0;border-bottom:1px solid #E6E1DA;font-weight:bold;width:110px">DISH CODE:</td><td style="padding:4px 0;border-bottom:1px solid #E6E1DA">${r.dishCode || "N/A"}</td></tr>
            <tr><td style="padding:4px 0;border-bottom:1px solid #E6E1DA;font-weight:bold">VERSION:</td><td style="padding:4px 0;border-bottom:1px solid #E6E1DA">v${r.versionLabel}</td></tr>
            <tr><td style="padding:4px 0;border-bottom:1px solid #E6E1DA;font-weight:bold">AUTHOR:</td><td style="padding:4px 0;border-bottom:1px solid #E6E1DA">${r.author || brandName}</td></tr>
            <tr><td style="padding:4px 0;border-bottom:1px solid #E6E1DA;font-weight:bold">APPROVED BY:</td><td style="padding:4px 0;border-bottom:1px solid #E6E1DA">${r.approvedBy || "N/A"}</td></tr>
            <tr><td style="padding:4px 0;border-bottom:1px solid #E6E1DA;font-weight:bold">EFFECTIVE:</td><td style="padding:4px 0;border-bottom:1px solid #E6E1DA">${fmtDate(r.effectiveDate)}</td></tr>
            <tr><td style="padding:4px 0;border-bottom:1px solid #D4B572;font-weight:bold">NEXT REVIEW:</td><td style="padding:4px 0;border-bottom:1px solid #D4B572">${fmtDate(r.nextReviewDate)}</td></tr>
          </table>

          <!-- Quick Info -->
          <div style="display:flex;justify-content:space-between;text-align:center;font-size:11px;font-weight:bold;border-bottom:1px solid #D4B572;padding-bottom:16px;margin-bottom:16px">
            <div><div style="color:#1F3D2D">YIELD</div><div style="font-weight:normal;margin-top:4px;font-size:12px">${r.yieldText || "N/A"}</div></div>
            <div><div style="color:#1F3D2D">PREP</div><div style="font-weight:normal;margin-top:4px;font-size:12px">${r.prepMinutes || 0} min</div></div>
            <div><div style="color:#1F3D2D">COOK</div><div style="font-weight:normal;margin-top:4px;font-size:12px">${r.cookMinutes || 0} min</div></div>
            <div><div style="color:#1F3D2D">TOTAL</div><div style="font-weight:normal;margin-top:4px;font-size:12px">~${r.totalMinutes || 0} min</div></div>
            <div><div style="color:#1F3D2D">DIET</div><div style="font-weight:normal;margin-top:4px;font-size:12px">${r.diet || "N/A"}</div></div>
          </div>

          <!-- Mise en Place -->
          <div style="margin-bottom:16px;border-bottom:1px solid #D4B572;padding-bottom:12px">
            <h3 style="font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">Mise En Place</h3>
            <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.8">${miseList}</ul>
          </div>

          <!-- Equipment -->
          <div style="margin-bottom:16px;border-bottom:1px solid #D4B572;padding-bottom:12px">
            <h3 style="font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">Equipment / Tools</h3>
            <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.8">${equipList}</ul>
          </div>

          <!-- Ingredients -->
          <div style="margin-bottom:16px">
            <h3 style="font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">Ingredients (NET)</h3>
            <table style="width:100%;font-size:13px;border-collapse:collapse">${ingredientRows}</table>
          </div>
        </div>

        <!-- Right Column -->
        <div style="flex:1.5">
          ${r.heroImageUrl ? `<div style="width:100%;aspect-ratio:4/3;border-radius:16px;overflow:hidden;margin-bottom:20px;box-shadow:0 4px 12px rgba(0,0,0,0.15)"><img src="${r.heroImageUrl}" alt="${r.title}" style="width:100%;height:100%;object-fit:cover;display:block" /></div>` : ""}
          ${r.summary ? `<p style="text-align:center;font-size:16px;font-style:italic;color:#1F3D2D;margin:0 0 20px">\u201C${r.summary}\u201D</p>` : ""}

          <!-- Green Box -->
          <div style="background:#1F3D2D;border-radius:16px;padding:24px;color:#fff;margin-bottom:24px">
            <div style="margin-bottom:16px">
              <h4 style="color:#D4B572;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">Plating & Service</h4>
              <p style="margin:0;font-size:13px;line-height:1.6">${r.plating || "N/A"}</p>
            </div>
            <div style="height:1px;background:#D4B572;opacity:0.3;margin:12px 0"></div>
            <div style="margin-bottom:16px">
              <h4 style="color:#D4B572;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">Holding & Shelf Life</h4>
              <p style="margin:0;font-size:13px;line-height:1.6">${r.holding || "N/A"}</p>
            </div>
            <div style="height:1px;background:#D4B572;opacity:0.3;margin:12px 0"></div>
            <div>
              <h4 style="color:#D4B572;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">Allergens</h4>
              <p style="margin:0;font-size:13px;line-height:1.6">${r.allergens || "N/A"}</p>
            </div>
          </div>

          <!-- Method -->
          <div style="margin-bottom:20px">
            <h3 style="font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid #D4B572;padding-bottom:8px;margin:0 0 16px">Method</h3>
            ${stepRows}
          </div>

          <!-- Quality Check -->
          ${qcList ? `
          <div>
            <h3 style="font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid #D4B572;padding-bottom:8px;margin:0 0 12px">Quality Check</h3>
            <ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:1.8">${qcList}</ul>
          </div>` : ""}
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top:24px;background:#1F3D2D;color:#fff;padding:12px 24px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:500">
        <div style="display:flex;align-items:center;gap:8px">
          <span>Document ID: ${docId}</span>
        </div>
        <div style="display:flex;gap:24px">
          <span>Effective: ${fmtDate(r.effectiveDate)}</span>
          <span>Next review: ${fmtDate(r.nextReviewDate)}</span>
        </div>
        <div style="color:#D4B572;font-weight:bold;font-size:12px;letter-spacing:1px">${brandName} Hospitality</div>
      </div>
    </div>
  `;
}

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

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/category-pdf?brand=${encodeURIComponent(brandSlug)}&category=${encodeURIComponent(categorySlug)}`);
      if (!res.ok) throw new Error("Failed to fetch recipes");
      const data = await res.json();

      if (!data.recipes || data.recipes.length === 0) {
        alert("No recipes found in this category.");
        return;
      }

      // Build a full HTML document with all recipes
      const recipesHtml = (data.recipes as RecipeData[])
        .map((r: RecipeData, i: number) => buildRecipeHtml(r, data.brandName, i))
        .join("");

      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.categoryName} - All Recipes - ${data.brandName}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #FAF8F5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div style="height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#1F3D2D 0%,#2a5a3d 100%);color:#fff;text-align:center;page-break-after:always">
    <div style="font-size:14px;letter-spacing:6px;color:#D4B572;font-weight:bold;text-transform:uppercase;margin-bottom:24px">${data.brandName} Hospitality</div>
    <h1 style="font-size:56px;font-weight:700;margin:0 0 16px;letter-spacing:2px">${data.categoryName}</h1>
    <div style="width:80px;height:3px;background:#D4B572;margin:16px auto"></div>
    <p style="font-size:18px;color:#ffffffcc;margin-top:16px">${data.recipes.length} Recipe${data.recipes.length > 1 ? "s" : ""}</p>
    <p style="font-size:12px;color:#ffffff88;margin-top:40px">Generated on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
  </div>

  <!-- Table of Contents -->
  <div style="page-break-after:always;padding:60px 40px;max-width:900px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
    <h2 style="font-size:11px;font-weight:bold;letter-spacing:3px;color:#D4B572;text-transform:uppercase;margin:0 0 8px">Table of Contents</h2>
    <h3 style="font-size:28px;color:#1F3D2D;font-weight:700;margin:0 0 32px">${data.categoryName} Recipes</h3>
    <div style="border-top:2px solid #D4B572">
      ${(data.recipes as RecipeData[]).map((r: RecipeData, i: number) => `
        <div style="display:flex;justify-content:space-between;align-items:baseline;padding:12px 0;border-bottom:1px solid #E6E1DA;font-size:14px">
          <span><strong style="color:#1F3D2D">${i + 1}.</strong> ${r.title}</span>
          <span style="color:#999;font-size:12px">${r.dishCode || ""} ${r.totalMinutes ? `• ~${r.totalMinutes} min` : ""}</span>
        </div>
      `).join("")}
    </div>
  </div>

  ${recipesHtml}
</body>
</html>`;

      // Open in a new window and trigger print (Save as PDF)
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow pop-ups to download the PDF.");
        return;
      }
      printWindow.document.write(fullHtml);
      printWindow.document.close();

      // Wait for content to render, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
      // Fallback for cases where onload doesn't fire
      setTimeout(() => {
        printWindow.print();
      }, 1500);
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
      className="inline-flex items-center gap-2 rounded-lg border border-brand-fg/20 bg-brand-card-bg/80 px-4 py-2.5 text-sm font-semibold uppercase tracking-widest text-brand-fg shadow-sm backdrop-blur transition-all hover:bg-brand-card-bg hover:shadow-md disabled:opacity-50 disabled:cursor-wait"
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
      {loading ? "Generating..." : "Download PDF"}
    </button>
  );
}
