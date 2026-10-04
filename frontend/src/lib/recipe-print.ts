/**
 * Printable single-page (A4) recipe SOP cards, shared by the category
 * "Download PDF" and the per-recipe "Download PDF" buttons.
 *
 * Layout mirrors the kitchen SOP sheets: intro + photo/green box on top,
 * then Mise en place & equipment | Ingredients | Method & quality check.
 * Every recipe is one fixed A4 sheet; an inline script measures each sheet
 * and scales its content (CSS transform) just enough to never spill onto a
 * second page (and enlarges short ones slightly to fill it).
 */

import type { SopTemplateKey } from "@/lib/sop/templates";
import { isDessertStyle, type DessertExtras } from "@/lib/sop/dessert";
import { DIMSUM_CSS, dimsumCardHtml, isDimsumStyle, type DimsumExtras } from "@/lib/sop/aiko-dimsum";
import { DRINK_CSS, drinkCardHtml, isDrinksStyle, type DrinkExtras } from "@/lib/sop/aiko-drinks";
import { buildDessertSheet, DESSERT_CSS } from "@/lib/sop/dessert-print";
import { AIKO_COOKBOOK_CSS, buildAikoCookbookFront, sortAikoRecipes } from "@/lib/sop/cookbook-aiko";
import { buildCookbookFront, COOKBOOK_CSS, orderCookbookCategories, type CookbookCategory } from "@/lib/sop/cookbook";
import { AIKO_CSS, AIKO_FONTS_HREF, aikoCardHtml, aikoCoverHtml, type AikoOpts } from "@/lib/sop/aiko";

export interface PrintRecipe {
  title: string;
  subtitle: string | null;
  description: string | null;
  dishType: string | null;
  service: string | null;
  sopSections: string | null;
  summary: string | null;
  categoryName: string | null;
  categorySlug?: string | null;
  dessert?: DessertExtras | null;
  dimsum?: DimsumExtras | null;
  drink?: DrinkExtras | null;
  aiko?: AikoOpts | null;
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
  timeText?: { prep?: string; cook?: string; total?: string } | null;
  diet: string | null;
  miseEnPlace: string[];
  equipment: string[];
  qualityCheck: string[];
  garnish?: string[];
  plating: string | null;
  holding: string | null;
  allergens: string | null;
  notes: string | null;
  heroImageUrl: string | null;
  ingredients: { name: string; quantity: number | null; unit: string | null; groupLabel: string | null }[];
  /** A step with a title starts a new method section. */
  steps: { title: string | null; body: string }[];
}

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function fmtDate(d: string | null): string {
  if (!d) return "N/A";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

const svg = (paths: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

const ICONS = {
  scale: svg('<path d="M12 3v18M12 3l-8 5v2a8 8 0 0 0 16 0V8l-8-5z"/><path d="M12 11h.01"/>'),
  knife: svg('<path d="M11.63 12.87L2 22.5"/><path d="M22.5 2L11.13 13.37A2.83 2.83 0 0 1 7.13 9.37L18.5 2h4v4z"/>'),
  pot: svg('<path d="M5 8h14M3 8c0 5 3 11 9 11s9-6 9-11M8 3v3M16 3v3M12 2v4"/>'),
  clock: svg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
  leaf: svg('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'),
  bowl: svg('<path d="M2 12h20M4 12c0 4.4 3.6 8 8 8s8-3.6 8-8"/><path d="M12 6v2M8 5v3M16 5v3"/>'),
  cover: svg('<path d="M2 16h20M12 4a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8zM12 4V2"/>'),
  wheat: svg('<path d="M2 22l10-10M12 12c-2.76 0-5-2.24-5-5s2.24-5 5-5M12 12c0 2.76 2.24 5 5 5s5-2.24 5-5"/><path d="M7 7c2.76 0 5-2.24 5-5"/><path d="M17 17c0-2.76-2.24-5-5-5"/>'),
  clipboard: svg('<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>'),
};

const list = (items: string[]) =>
  items.length
    ? `<ul class="bullets">${items.map((i) => (i.startsWith("# ") ? `<li class="lh">${esc(i.slice(2))}</li>` : `<li>${esc(i)}</li>`)).join("")}</ul>`
    : `<ul class="bullets"><li>None</li></ul>`;

function stat(icon: string, label: string, value: string) {
  return `<div class="stat">${icon}<b>${label}</b><span>${esc(value)}</span></div>`;
}

function buildRecipeSheet(r: PrintRecipe, brandName: string): string {
  // Mise en place / equipment are skipped only when the SOP has neither (the column then holds the notes).
  const hasPrep = r.miseEnPlace.length > 0 || r.equipment.length > 0 || !r.notes;
  const eyebrow = [r.categoryName || "Recipe", r.station].filter(Boolean).map(esc).join(" &nbsp;|&nbsp; ");
  const yieldText = r.yieldText ? (r.yieldText.includes("\n") ? r.yieldText : r.yieldText.replace(" ", "\n")) : "N/A";

  const meta = [
    ["Dish code", r.dishCode || "N/A"],
    ["Version", `v${r.versionLabel}`],
    ["Author", r.author || brandName],
    ["Approved by", r.approvedBy || "N/A"],
    ["Effective", fmtDate(r.effectiveDate)],
    ["Next review", fmtDate(r.nextReviewDate)],
  ]
    .map(([k, v]) => `<tr><th>${k}:</th><td>${esc(v)}</td></tr>`)
    .join("");

  const ingredients = r.ingredients
    .map((ing, i) => {
      const group =
        ing.groupLabel && ing.groupLabel !== r.ingredients[i - 1]?.groupLabel
          ? `<div class="group">${esc(ing.groupLabel)}</div>`
          : "";
      const qty = [ing.quantity ?? "", ing.unit ?? ""].join(" ").trim();
      return `${group}<div class="ing"><span>${esc(ing.name)}</span><i></i><span class="qty">${esc(qty)}</span></div>`;
    })
    .join("");

  let stepNo = 0;
  const steps = r.steps
    .map((s) => {
      // A step with a title starts a new method section; numbering restarts.
      if (s.title) stepNo = 0;
      stepNo += 1;
      return `${s.title ? `<li class="sh">${esc(s.title)}</li>` : ""}<li><span class="num">${stepNo}</span><p>${esc(s.body)}</p></li>`;
    })
    .join("");

  const garnish = r.garnish?.length
    ? `<h3>Garnish</h3><ul class="bullets">${r.garnish.map((g) => `<li>${esc(g)}</li>`).join("")}</ul>`
    : "";

  const quality = r.qualityCheck.length
    ? `<h3>Quality Check</h3><ul class="checks">${r.qualityCheck.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>`
    : "";

  const greenRow = (icon: string, title: string, body: string | null) =>
    `<div class="gb-row">${icon}<div><h4>${title}</h4><p>${esc(body || "N/A")}</p></div></div>`;

  return `
<section class="sheet recipe">
  <div class="inner">
    <div class="top">
      <div class="intro">
        <div class="eyebrow">${eyebrow}</div>
        <h1>${esc(r.title)}</h1>
        ${r.description ? `<p class="desc">${esc(r.description)}</p>` : ""}
        <table class="meta">${meta}</table>
        <div class="stats">
          ${
            r.dessert?.stats
              ? r.dessert.stats
                  .map((s, i, all) => {
                    const icon = { tag: ICONS.knife, pot: ICONS.pot, user: ICONS.scale, leaf: ICONS.leaf, snow: ICONS.clock, clock: ICONS.clock, cup: ICONS.scale, ice: ICONS.scale }[s.icon];
                    const rem = all.length % 3;
                    const cs = rem && i === all.length - rem ? (rem === 1 ? ' style="grid-column-start:3"' : ' style="grid-column-start:2"') : "";
                    return stat(icon, esc(s.label), s.value).replace('<div class="stat">', `<div class="stat"${cs}>`);
                  })
                  .join("")
              : `${stat(ICONS.scale, "Yield", yieldText)}
          ${stat(ICONS.knife, "Prep", r.timeText?.prep ?? `${r.prepMinutes || 0} min`)}
          ${stat(ICONS.pot, "Cook", r.timeText?.cook ?? `${r.cookMinutes || 0} min`)}
          ${stat(ICONS.clock, "Total", r.timeText?.total ?? `~${r.totalMinutes || 0} min`)}
          ${stat(ICONS.leaf, "Diet", r.diet || "N/A")}`
          }
        </div>
        ${r.summary ? `<p class="summary">&ldquo;${esc(r.summary)}&rdquo;</p>` : ""}
      </div>
      <div class="visual">
        ${r.heroImageUrl ? `<div class="photo"><img src="${esc(r.heroImageUrl)}" alt="${esc(r.title)}"></div>` : ""}
        <div class="greenbox">
          ${greenRow(ICONS.bowl, "Plating &amp; Service", r.plating)}
          ${greenRow(ICONS.cover, "Holding &amp; Shelf Life", r.holding)}
          ${greenRow(ICONS.wheat, "Allergens", r.allergens)}
        </div>
      </div>
    </div>

    <div class="body">
      <div class="col">
        ${hasPrep ? `<h3>Mise En Place</h3>${list(r.miseEnPlace)}<h3>Equipment / Tools</h3>${list(r.equipment)}` : ""}
        ${r.notes ? `<h3>Notes</h3><p class="notes">${esc(r.notes)}</p>` : ""}
      </div>
      <div class="col">
        <h3>Ingredients (NET)</h3>
        <div class="ings">${ingredients}</div>
      </div>
      <div class="col">
        <h3>Method</h3>
        <ol class="steps">${steps}</ol>
        ${garnish}${quality}
      </div>
    </div>

    <footer>
      <span class="doc">${ICONS.clipboard}Document ID: ${esc(`${r.dishCode || "N/A"}-v${r.versionLabel}`)}</span>
      <span>Effective: ${fmtDate(r.effectiveDate)}</span>
      <span>Next review: ${fmtDate(r.nextReviewDate)}</span>
      <span>Page 1 of 1</span>
      <span class="brand">${esc(brandName)} Hospitality</span>
    </footer>
  </div>
</section>`;
}

// Phones lay the preview out at A4 width and zoom it to fit the screen, so every
// device shows (and prints) the exact same one-recipe-per-page card design
// instead of a reflowed single-column version.
const PRINT_VIEWPORT = "width=860";

const STYLES = `
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: #E9E6E1; color: #2C3E35;
  font-family: "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.sheet {
  width: 210mm; height: 297mm; margin: 24px auto; padding: 9mm 10mm 8mm;
  background: #FAF8F5; box-shadow: 0 6px 24px rgba(0,0,0,.12);
  overflow: hidden; page-break-after: always; break-after: page;
}
.sheet:last-child { page-break-after: auto; break-after: auto; }
.inner { display: flex; flex-direction: column; gap: 4.5mm; min-height: 100%; }
.sheet.recipe { position: relative; }
.recipe .inner {
  width: calc(100% / var(--fit, 1)); min-height: calc(100% / var(--fit, 1));
  transform: scale(var(--fit, 1)); transform-origin: 0 0;
}

h1, h3, h4, p { margin: 0; }
h3 {
  font-size: 10.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #1F3D2D;
  border-bottom: 1px solid #D4B572; padding-bottom: 4px; margin: 0 0 7px;
}
.col h3:not(:first-child) { margin-top: 12px; }

.top { display: grid; grid-template-columns: 40% 1fr; gap: 6mm; }
.eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: #C9A45C; padding-bottom: 6px; border-bottom: 1px solid #D4B572; }
h1 { font-family: "Playfair Display", Georgia, serif; font-weight: 700; font-size: 34px; line-height: 1.05; color: #1F3D2D; margin: 10px 0 8px; }
.desc { font-size: 12px; line-height: 1.5; color: rgba(44,62,53,.85); }
.meta { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; border-top: 1px solid #D4B572; }
.meta th { text-align: left; font-weight: 700; text-transform: uppercase; width: 42%; padding: 3.5px 0; color: #1F3D2D; }
.meta td { padding: 3.5px 0; }
.meta tr { border-bottom: 1px solid #E6E1DA; }
.meta tr:last-child { border-bottom-color: #D4B572; }
.stats { display: grid; grid-template-columns: repeat(6, 1fr); row-gap: 8px; padding: 10px 0; border-bottom: 1px solid #D4B572; text-align: center; color: #1F3D2D; }
.stat { grid-column: span 2; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 0 4px; }
.stat:nth-child(2), .stat:nth-child(3), .stat:nth-child(5) { border-left: 1px solid #E6E1DA; }
.stat:nth-child(4) { grid-column: 2 / span 2; }
.stat svg { width: 22px; height: 22px; }
.stat b { font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; margin-top: 2px; }
.stat span { font-size: 11px; line-height: 1.3; color: #4B5563; white-space: pre-line; }
.summary { font-family: "Playfair Display", Georgia, serif; font-style: italic; font-size: 12.5px; line-height: 1.5; color: #1F3D2D; margin-top: 9px; }

.visual { display: flex; flex-direction: column; gap: 3.5mm; }
.photo { width: 100%; height: 78mm; border-radius: 14px; overflow: hidden; background: #1a1a1a; }
.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.greenbox { background: #1F3D2D; color: #fff; border-radius: 14px; padding: 5mm 6mm; display: flex; flex-direction: column; }
.gb-row { display: flex; gap: 12px; padding: 7px 0; }
.gb-row + .gb-row { border-top: 1px solid rgba(212,181,114,.35); }
.gb-row svg { width: 24px; height: 24px; color: #D4B572; flex-shrink: 0; margin-top: 2px; }
.gb-row h4 { font-size: 10.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #D4B572; margin-bottom: 3px; }
.gb-row p { font-size: 11.5px; line-height: 1.5; white-space: pre-line; }

.body { display: grid; grid-template-columns: 27% 1fr 1.15fr; gap: 6mm; }
.body .col + .col { border-left: 1px solid #E6D6B0; padding-left: 5mm; }
.bullets { margin: 0; padding-left: 15px; font-size: 11.5px; line-height: 1.55; }
.ings { font-size: 11px; line-height: 1.35; }
.ing { display: flex; align-items: baseline; gap: 4px; padding: 1.5px 0; }
.ing i { flex: 1; border-bottom: 1.5px dotted #BDBDBD; transform: translateY(-3px); min-width: 8px; }
.ing .qty { white-space: nowrap; text-align: right; }
.group { font-weight: 700; color: #1F3D2D; margin: 7px 0 2px; }
.steps { list-style: none; margin: 0; padding: 0; font-size: 11.5px; line-height: 1.45; }
.steps li { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 6px; }
.num { width: 18px; height: 18px; border-radius: 50%; background: #1F3D2D; color: #fff; font-size: 10px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
.sh { list-style: none; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #1F3D2D; margin: 8px 0 3px; }
.bullets li.lh { list-style: none; margin-left: -15px; margin-top: 4px; font-weight: 700; text-transform: uppercase; color: #1F3D2D; }
.checks { list-style: none; margin: 0; padding: 0; font-size: 11px; line-height: 1.5; }
.checks li { padding-left: 16px; position: relative; }
.checks li::before { content: "\\2713"; position: absolute; left: 0; color: #C9A45C; font-weight: 700; }
.notes { font-size: 11px; line-height: 1.5; white-space: pre-line; }

footer {
  margin-top: auto; background: #1F3D2D; color: #fff; border-radius: 10px; padding: 3mm 5mm;
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 4px 14px; font-size: 10px; font-weight: 500;
}
footer .doc { display: inline-flex; align-items: center; gap: 6px; }
footer svg { width: 16px; height: 16px; color: #D4B572; }
footer .brand { color: #D4B572; font-family: "Playfair Display", Georgia, serif; font-weight: 700; font-size: 13px; }

.cover { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #fff; background: linear-gradient(135deg,#1F3D2D 0%,#2a5a3d 100%); }
.cover .kicker { font-size: 13px; letter-spacing: 6px; color: #D4B572; font-weight: 700; text-transform: uppercase; margin-bottom: 24px; }
.cover h1 { color: #fff; font-size: 56px; letter-spacing: 2px; }
.cover .rule { width: 80px; height: 3px; background: #D4B572; margin: 16px auto; }
.cover p { font-size: 18px; color: rgba(255,255,255,.8); }
.cover small { display: block; font-size: 12px; color: rgba(255,255,255,.55); margin-top: 40px; }
.toc { padding: 20mm 16mm; }
.toc h2 { font-size: 11px; letter-spacing: 3px; color: #D4B572; text-transform: uppercase; margin: 0 0 8px; }
.toc h1 { font-size: 28px; margin: 0 0 24px; }
.toc .row { display: flex; justify-content: space-between; align-items: baseline; padding: 12px 0; border-bottom: 1px solid #E6E1DA; font-size: 14px; }
.toc .row span:last-child { color: #999; font-size: 12px; }

@media print {
  body { background: #FAF8F5; }
  .sheet { margin: 0; box-shadow: none; }
}

`;

// Measures every recipe sheet at true A4 size (off-screen, so it works in a
// narrow preview window too) and sets --fit so its content fills one page.
const FIT_SCRIPT = `
(function () {
  function fitAll() {
    document.querySelectorAll(".sheet.recipe").forEach(function (sheet) {
      var probe = sheet.cloneNode(true);
      probe.classList.add("measure");
      probe.style.cssText = "position:absolute;left:-10000px;top:0;visibility:hidden;margin:0;height:auto;overflow:visible";
      probe.style.setProperty("--fit", "1");
      var inner = probe.querySelector(".inner");
      inner.style.minHeight = "0";
      document.body.appendChild(probe);
      var cs = getComputedStyle(probe);
      var pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      var available = 297 * 96 / 25.4 - pad; // A4 height in CSS px, minus sheet padding
      // Shrink long SOPs to fit; gently enlarge short ones (max 12%) to avoid a half-empty page.
      // A scaled sheet is laid out wider (width = 100% / fit), which re-wraps text and
      // changes its height, so re-measure at each candidate fit until it settles.
      var fit = 1, needed = 0;
      for (var i = 0; i < 5; i++) {
        probe.style.setProperty("--fit", String(fit));
        needed = inner.offsetHeight;
        var next = Math.min(1.12, Math.floor((available / needed) * 1000) / 1000);
        if (Math.abs(next - fit) < 0.003) { fit = Math.min(fit, next); break; }
        fit = next;
      }
      document.body.removeChild(probe);
      sheet.style.setProperty("--fit", String(fit));
      sheet.setAttribute("data-fit", Math.round(needed) + "/" + Math.round(available));
    });
  }
  function ready() {
    var imgs = Array.prototype.slice.call(document.images).map(function (img) {
      return img.complete ? Promise.resolve() : new Promise(function (r) { img.onload = img.onerror = r; });
    });
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    return Promise.all(imgs.concat([fonts]));
  }
  window.__recipePrintReady = ready().then(function () { fitAll(); window.__recipePrintDone = true; });
  window.addEventListener("beforeprint", fitAll);
})();
`;

export function buildRecipePrintDocument(opts: {
  title: string;
  brandName: string;
  recipes: PrintRecipe[];
  /** Cover + table of contents pages (category download). */
  collection?: { categoryName: string; number?: number; description?: string | null };
  /** The brand's card design (defaults to the classic card). */
  template?: SopTemplateKey;
  /** Whole-brand cookbook: cover + index, then every category's recipes (replaces `recipes`). */
  cookbook?: { categories: CookbookCategory[] };
}): string {
  if (opts.template === "aiko") return buildAikoDocument(opts);
  const cb = opts.cookbook ? buildCookbookFront({ brandName: opts.brandName, categories: opts.cookbook.categories }) : null;
  const { brandName } = opts;
  const recipes = opts.cookbook ? orderCookbookCategories(opts.cookbook.categories).flatMap((c) => c.recipes) : opts.recipes;
  const collection = cb ? undefined : opts.collection;

  const front = cb
    ? cb.html
    : collection
    ? `
<section class="sheet cover">
  <div class="kicker">${esc(brandName)} Hospitality</div>
  <h1>${esc(collection.categoryName)}</h1>
  <div class="rule"></div>
  <p>${recipes.length} Recipe${recipes.length === 1 ? "" : "s"}</p>
  <small>Generated on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</small>
</section>
<section class="sheet toc">
  <h2>Table of Contents</h2>
  <h1>${esc(collection.categoryName)} Recipes</h1>
  <div style="border-top:2px solid #D4B572">
    ${recipes
      .map(
        (r, i) =>
          `<div class="row"><span><strong style="color:#1F3D2D">${i + 1}.</strong> ${esc(r.title)}</span><span>${esc(r.dishCode || "")} ${r.totalMinutes ? `&bull; ~${r.totalMinutes} min` : ""}</span></div>`,
      )
      .join("")}
  </div>
</section>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="${PRINT_VIEWPORT}">
<title>${esc(opts.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet">
<style>${STYLES}${DESSERT_CSS}${COOKBOOK_CSS}</style>
</head>
<body>
${front}
${recipes.map((r) => (isDessertStyle(opts.template ?? "classic", r.categorySlug) ? buildDessertSheet(r, brandName) : buildRecipeSheet(r, brandName))).join("")}
<script>${FIT_SCRIPT}</script>
</body>
</html>`;
}

const AIKO_PRINT_CSS = `
.sheet.aiko { padding: 0; background: #0B0B0B; }
.sheet.aiko .inner { gap: 0; }
${AIKO_CSS}
`;

/** The same document with every page in the Aiko Kitchen design (lib/sop/aiko.ts). */
function buildAikoDocument(opts: Parameters<typeof buildRecipePrintDocument>[0]): string {
  const { brandName } = opts;
  const categories = opts.cookbook
    ? opts.cookbook.categories.map((c) => ({ ...c, recipes: sortAikoRecipes(c.recipes) }))
    : null;
  const cb = categories ? buildAikoCookbookFront({ brandName, categories }) : null;
  const collection = cb ? undefined : opts.collection;
  const divider = (number: number, name: string, description: string | null) =>
    `<section class="sheet aiko"><div class="ak-root" style="height:100%">${aikoCoverHtml({ number, categoryName: name, description, brandName })}</div></section>`;
  const cover = cb
    ? cb.coverHtml + cb.indexHtml
    : collection
    ? divider(collection.number ?? 1, collection.categoryName, collection.description ?? null)
    : "";
  const dimsumSheet = (r: PrintRecipe) =>
    `<section class="sheet recipe aiko"><div class="inner dm-root${r.dimsum?.ramen ? " rm-root" : ""}">${dimsumCardHtml({
      title: r.title,
      description: r.description,
      brandName,
      heroUrl: r.heroImageUrl,
      dishCode: r.dishCode,
      author: r.author,
      approvedBy: r.approvedBy,
      ingredients: r.ingredients,
      steps: r.steps,
      qualityCheck: r.qualityCheck,
      miseEnPlace: r.miseEnPlace,
      equipment: r.equipment,
      holding: r.holding,
      plating: r.plating,
      extras: r.dimsum ?? null,
    })}</div></section>`;
  const drinkSheet = (r: PrintRecipe) =>
    `<section class="sheet recipe aiko"><div class="inner dk-root">${drinkCardHtml({
      title: r.title,
      description: r.description,
      heroUrl: r.heroImageUrl,
      ingredients: r.ingredients,
      steps: r.steps,
      qualityCheck: r.qualityCheck,
      extras: r.drink ?? null,
    })}</div></section>`;
  const aikoSheet = (r: PrintRecipe) =>
    isDrinksStyle("aiko", r.categorySlug) ? drinkSheet(r) : isDimsumStyle("aiko", r.categorySlug) ? dimsumSheet(r) : `<section class="sheet recipe aiko"><div class="inner ak-root">${aikoCardHtml({
        title: r.title,
        subtitle: r.subtitle,
        description: r.description,
        dishType: r.dishType,
        diet: r.diet,
        yieldText: r.yieldText,
        service: r.service,
        allergens: r.allergens,
        dishCode: r.dishCode,
        author: r.author,
        approvedBy: r.approvedBy,
        station: r.station,
        versionLabel: r.versionLabel,
        brandName,
        heroUrl: r.heroImageUrl,
        ingredients: r.ingredients,
        steps: r.steps,
        qualityCheck: r.qualityCheck,
        plating: r.plating,
        sopSections: r.sopSections,
        opts: r.aiko ?? null,
      })}</div></section>`;
  const sheets = categories
    ? categories
        .filter((c) => c.recipes.length > 0)
        .map((c, i) => divider(i + 1, c.name.toUpperCase(), null) + c.recipes.map(aikoSheet).join(""))
        .join("")
    : opts.recipes.map(aikoSheet).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="${PRINT_VIEWPORT}">
<title>${esc(opts.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${AIKO_FONTS_HREF}" rel="stylesheet">
<style>${STYLES}${AIKO_PRINT_CSS}${DIMSUM_CSS}${DRINK_CSS}${COOKBOOK_CSS}${AIKO_COOKBOOK_CSS}</style>
</head>
<body>
${cover}
${sheets}
<script>${FIT_SCRIPT}</script>
</body>
</html>`;
}

/**
 * Opens the printable document in a new window and prints it once images,
 * fonts and the fit pass are done. Must be called synchronously from a click
 * (before any await) so pop-up blockers allow the window.
 */
export function openPrintWindow(): Window | null {
  return window.open("", "_blank");
}

export function printInWindow(win: Window, html: string) {
  win.document.open();
  win.document.write(html);
  win.document.close();
  const w = win as Window & { __recipePrintReady?: Promise<void> };
  let printed = false;
  const go = () => {
    if (printed) return;
    printed = true;
    win.focus();
    win.print();
  };
  const start = Date.now();
  const wait = () => {
    if (w.__recipePrintReady) w.__recipePrintReady.then(() => setTimeout(go, 150));
    else if (Date.now() - start < 5000) setTimeout(wait, 50);
    else go();
  };
  wait();
  setTimeout(go, 10000); // never leave the user without a print dialog
}
