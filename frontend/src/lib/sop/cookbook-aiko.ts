/**
 * Cover + index for the Aiko Kitchen "Download Main Cookbook" PDF.
 * Page order: cover, index, then for every section a divider page followed by
 * its recipes (one A4 page each). Built from live data on every download, so
 * adding / removing a recipe updates the index and page numbers automatically.
 */
import type { CookbookCategory } from "@/lib/sop/cookbook";

export const AIKO_COOKBOOK_META = {
  tagline: "Signature Asian Cuisine",
  strap: "Recipes  |  Standards  |  Presentation",
  author: "Bookend's Hospitality",
  approvedBy: "Husen Khan",
  footer: "Professional Premium Cookbook",
};

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Natural order of dish codes ("SD-002" before "SD-010"); recipes without a code keep their order, last. */
export function sortAikoRecipes<T extends { dishCode: string | null }>(recipes: T[]): T[] {
  return recipes
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      const ca = a.r.dishCode, cb = b.r.dishCode;
      if (ca && cb) return ca.localeCompare(cb, undefined, { numeric: true }) || a.i - b.i;
      if (ca) return -1;
      if (cb) return 1;
      return a.i - b.i;
    })
    .map((x) => x.r);
}

/** One index line = 1 unit, a section heading = 2.8 units; a page holds this many units. */
const PAGE_UNITS = 50;

interface IndexLine { kind: "head" | "row"; html: string; units: number }

export function buildAikoCookbookFront(opts: { brandName: string; categories: CookbookCategory[] }): {
  coverHtml: string;
  indexHtml: string;
  /** Page number of each section divider, in category order. */
  dividerPages: number[];
  totalPages: number;
} {
  const categories = opts.categories.filter((c) => c.recipes.length > 0);
  const kitchen = `${opts.brandName} Kitchen`.toUpperCase();

  // Pages: 1 cover, then the index (n pages), then divider + recipes per section.
  // First pass with a provisional index length of 1 page; recompute once we know it.
  const build = (indexPages: number) => {
    let page = 1 + indexPages;
    const out: IndexLine[] = [];
    const dividerPages: number[] = [];
    categories.forEach((c, i) => {
      page += 1;
      dividerPages.push(page);
      out.push({ kind: "head", units: 2.8, html: `<div class="ci-head"><span>${String(i + 1).padStart(2, "0")}</span>${esc(c.name.toUpperCase())}</div>` });
      c.recipes.forEach((r) => {
        page += 1;
        out.push({
          kind: "row",
          units: 1,
          html: `<div class="ci-row"><span class="t">${esc(r.title)}${r.dishCode ? ` (${esc(r.dishCode)})` : ""}</span><i></i><b>${page}</b></div>`,
        });
      });
    });
    return { out, dividerPages, totalPages: page };
  };
  const paginate = (all: IndexLine[]) => {
    const pages: IndexLine[][] = [[]];
    let used = 0;
    for (const l of all) {
      if (used + l.units > PAGE_UNITS && pages[pages.length - 1].length) {
        pages.push([]);
        used = 0;
      }
      pages[pages.length - 1].push(l);
      used += l.units;
    }
    return pages;
  };
  let indexPageCount = paginate(build(1).out).length;
  let built = build(indexPageCount);
  const again = paginate(built.out).length;
  if (again !== indexPageCount) {
    indexPageCount = again;
    built = build(indexPageCount);
  }
  const chunks = paginate(built.out);

  const coverHtml = `
<section class="sheet ci-cover">
  <div class="ci-frame">
    <i class="ci-top"></i>
    <div class="ci-brand">${esc(kitchen)}</div>
    <div class="ci-pro">PROFESSIONAL</div>
    <div class="ci-book">COOKBOOK</div>
    <div class="ci-tag">${esc(AIKO_COOKBOOK_META.tagline)}</div>
    <div class="ci-strap">${esc(AIKO_COOKBOOK_META.strap).replace(/ {2}/g, "&nbsp; ")}</div>
    <div class="ci-sections"><b>SECTIONS</b><p>${categories.map((c) => esc(c.name.toUpperCase())).join(" ")}</p></div>
    <div class="ci-meta"><b>AUTHOR</b><span>${esc(AIKO_COOKBOOK_META.author.toUpperCase())}</span><b>APPROVED BY</b><span>${esc(AIKO_COOKBOOK_META.approvedBy.toUpperCase())}</span></div>
  </div>
</section>`;

  const indexHtml = chunks
    .map(
      (chunk, i) => `
<section class="sheet ci-index">
  <div class="ci-ihead"><h1>INDEX${chunks.length > 1 ? ` <small>(${i + 1}/${chunks.length})</small>` : ""}</h1><p>${esc(AIKO_COOKBOOK_META.author)}</p><i></i></div>
  <div class="ci-lines">${chunk.map((l) => l.html).join("")}</div>
  <div class="ci-foot">${esc(kitchen)}&nbsp; |&nbsp; ${esc(AIKO_COOKBOOK_META.footer)}</div>
</section>`,
    )
    .join("");

  return { coverHtml, indexHtml, dividerPages: built.dividerPages, totalPages: built.totalPages };
}

export const AIKO_COOKBOOK_CSS = `
.sheet.ci-cover { padding: 0; background: #070707; color: #fff; position: relative; font-family: "Nunito Sans", system-ui, sans-serif; }
.ci-frame { position: absolute; left: 13mm; right: 13mm; top: 12mm; bottom: 12mm; border: 1.4px solid #D4AF37; padding: 0 9mm; }
.ci-top { display: block; height: 1px; background: rgba(212,175,55,.55); margin: 15mm 0 8mm; }
.ci-brand { font-family: "EB Garamond", Georgia, serif; font-weight: 500; font-size: 34px; letter-spacing: .02em; color: #F6F1E9; }
.ci-pro { font-weight: 800; font-size: 40px; color: #D4AF37; letter-spacing: .01em; margin-top: 2mm; }
.ci-book { font-weight: 800; font-size: 62px; color: #F6F1E9; line-height: 1.05; }
.ci-tag { font-family: "EB Garamond", Georgia, serif; font-size: 21px; color: #F6F1E9; margin-top: 5mm; }
.ci-strap { font-size: 13px; color: #D9D3C7; margin-top: 2.5mm; letter-spacing: .02em; }
.ci-sections { position: absolute; left: 9mm; right: 9mm; bottom: 63mm; border: 1px solid #D4AF37; background: #0C0C0C; padding: 5mm 5mm 9mm; }
.ci-sections b { display: block; color: #D4AF37; font-size: 13px; letter-spacing: .04em; margin-bottom: 3mm; }
.ci-sections p { font-size: 11.5px; color: #EEE8DD; margin: 0; line-height: 1.7; }
.ci-meta { position: absolute; left: 9mm; right: 9mm; bottom: 12mm; }
.ci-meta b { display: block; color: #D4AF37; font-size: 11px; letter-spacing: .05em; margin-top: 4mm; }
.ci-meta span { display: block; font-size: 16px; color: #F6F1E9; margin-top: 1mm; }
.sheet.ci-index { padding: 0; background: #F7F1E5; color: #0E3B2D; position: relative; font-family: "Nunito Sans", system-ui, sans-serif; }
.ci-ihead { padding: 17mm 15mm 0; }
.sheet.ci-index h1 { font-family: "EB Garamond", Georgia, serif; font-weight: 700; font-size: 40px; color: #0A2E22; margin: 0; letter-spacing: .01em; border: 0; padding: 0; text-transform: none; }
.sheet.ci-index h1 small { font-size: 14px; font-weight: 500; color: #8a7a55; }
.ci-ihead p { color: #C69A3C; font-size: 13px; margin: 1mm 0 0; }
.ci-ihead i { display: block; height: 1.4px; background: #C9A45C; margin-top: 4mm; }
.ci-lines { padding: 8mm 15mm 0; }
.ci-head { font-weight: 800; font-size: 15px; color: #0A2E22; letter-spacing: .02em; margin: 4.5mm 0 1.2mm; }
.ci-head:first-child { margin-top: 0; }
.ci-head span { display: inline-block; width: 8mm; }
.ci-row { display: flex; align-items: baseline; gap: 5px; font-size: 10.6px; line-height: 1.42; color: #1d2b25; padding-left: 4mm; }
.ci-row i { flex: 1; border-bottom: 1px dotted rgba(60,60,60,.45); transform: translateY(-2px); min-width: 8px; }
.ci-row b { color: #C69A3C; font-weight: 800; min-width: 7mm; text-align: right; }
.ci-foot { position: absolute; left: 0; right: 0; bottom: 0; height: 13mm; background: #0A2E22; color: #F6F1E9; font-size: 10px; padding: 0 15mm; display: flex; align-items: center; }
`;
