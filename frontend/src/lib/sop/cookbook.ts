/**
 * Front matter (cover + index) for the "Download Main Cookbook" PDF: every
 * published recipe of a brand, one A4 page each, category by category.
 * Built from live data on each download, so adding or removing a recipe
 * changes the index and the page numbers automatically.
 */
import type { PrintRecipe } from "@/lib/recipe-print";

export interface CookbookCategory {
  name: string;
  slug: string;
  recipes: PrintRecipe[];
}

/** Fixed wording shown on the cover (edit here). */
export const COOKBOOK_META = {
  publisher: "Bookend's Hospitality",
  tagline: "Recipe development and kitchen operations",
  version: "v1.3",
  effective: "16 Apr 2026",
};

/** Section order of the cookbook; categories not listed follow in their normal order. */
const PREFERRED_ORDER = ["salads", "appetiser", "pasta", "pizza", "desserts", "drinks"];

export function orderCookbookCategories(categories: CookbookCategory[]): CookbookCategory[] {
  const rank = (c: CookbookCategory) => {
    const i = PREFERRED_ORDER.indexOf(c.slug.toLowerCase());
    return i < 0 ? PREFERRED_ORDER.length : i;
  };
  return categories.map((c, i) => ({ c, i })).sort((a, b) => rank(a.c) - rank(b.c) || a.i - b.i).map((x) => x.c);
}

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Index capacity of one page, in lines (an entry = 1, a category heading = 2.6). */
const PAGE_UNITS = 100;

function chunkIndex(categories: CookbookCategory[]): CookbookCategory[][] {
  const pages: CookbookCategory[][] = [[]];
  let used = 0;
  for (const c of categories) {
    const need = 2.6 + c.recipes.length;
    if (used + need > PAGE_UNITS && pages[pages.length - 1].length > 0) {
      pages.push([]);
      used = 0;
    }
    pages[pages.length - 1].push(c);
    used += need;
  }
  return pages;
}

export function buildCookbookFront(opts: { brandName: string; categories: CookbookCategory[] }): { html: string; totalPages: number } {
  const categories = orderCookbookCategories(opts.categories).filter((c) => c.recipes.length > 0);
  const recipeCount = categories.reduce((n, c) => n + c.recipes.length, 0);
  const indexChunks = chunkIndex(categories);
  const totalPages = 1 + indexChunks.length + recipeCount;
  const brand = opts.brandName.toUpperCase();

  const tiles = categories
    .map(
      (c) =>
        `<div class="cb-tile"><div><small>${esc(c.name.toUpperCase())}</small><b>${c.recipes.length} page${c.recipes.length === 1 ? "" : "s"}</b></div><i></i></div>`,
    )
    .join("");

  const cover = `
<section class="sheet cb-cover">
  <div class="cb-frame"><div class="cb-frame2"></div></div>
  <div class="cb-in">
    <div class="cb-orn"><span></span><em></em><span></span></div>
    <div class="cb-head">
      <h1>${esc(brand)}</h1>
      <h2>MASTER COOKBOOK</h2>
      <h3>&amp; RECIPE MANUAL</h3>
    </div>
    <p class="cb-kick">PREMIUM CULINARY TRAINING MANUAL</p>
    <p class="cb-line">One dish per A4 page &nbsp;<span>|</span>&nbsp; Standardised kitchen recipes</p>
    <p class="cb-line">Deep green - burnt orange - off-white</p>
    <div class="cb-info">
      <div><b>PREPARED FOR</b><span>${esc(brand)}</span></div>
      <div><b>AUTHOR</b><span>${esc(COOKBOOK_META.publisher)}</span></div>
      <div><b>VERSION</b><span>${esc(COOKBOOK_META.version)}</span></div>
      <div><b>EFFECTIVE</b><span>${esc(COOKBOOK_META.effective)}</span></div>
      <div><b>TOTAL PAGES</b><span>${totalPages}</span></div>
    </div>
    <h4>SECTIONS</h4>
    <div class="cb-tiles">${tiles}</div>
    <div class="cb-foot">
      <div><b>${esc(COOKBOOK_META.publisher)}</b><span>${esc(COOKBOOK_META.tagline)}</span></div>
      <div class="r"><b>${esc(brand)}</b><span>Master Recipe Collection</span></div>
    </div>
  </div>
</section>`;

  let page = 1 + indexChunks.length; // last page before the first recipe
  const indexPages = indexChunks
    .map((chunk, idx) => {
      const blocks = chunk
        .map((c) => {
          const rows = c.recipes
            .map((r) => {
              page += 1;
              return `<div class="cb-row"><span>${esc(r.title)}${r.dishCode ? ` (${esc(r.dishCode)})` : ""}</span><span>${page}</span></div>`;
            })
            .join("");
          return `<div class="cb-cat"><h3>${esc(c.name.toUpperCase())}</h3>${rows}</div>`;
        })
        .join("");
      return `
<section class="sheet cb-index">
  <div class="cb-ihead"><h1>Index${indexChunks.length > 1 ? ` <small>(${idx + 1}/${indexChunks.length})</small>` : ""}</h1><span>${esc(COOKBOOK_META.publisher)}</span></div>
  <div class="cb-cols">${blocks}</div>
</section>`;
    })
    .join("");

  return { html: cover + indexPages, totalPages };
}

export const COOKBOOK_CSS = `
.sheet.cb-cover { padding: 0; background: #0E3B2D; color: #fff; position: relative; }
.cb-cover::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 7mm; background: #0A3226; }
.cb-cover::after { content: ""; position: absolute; left: 7mm; top: 0; bottom: 0; width: 2.5mm; background: #0B2F24; }
.cb-frame { position: absolute; left: 12mm; right: 8mm; top: 5mm; bottom: 5mm; border: 1.2px solid #C9A45C; border-radius: 10mm; }
.cb-frame2 { position: absolute; inset: 2.2mm; border: .6px solid rgba(201,164,92,.45); border-radius: 8mm; }
.cb-in { position: relative; padding: 9mm 22mm 12mm 26mm; height: 100%; display: flex; flex-direction: column; text-align: center; }
.cb-orn { display: flex; align-items: center; gap: 4px; margin: 0 0 14mm; }
.cb-orn span { flex: 1; height: 1px; background: #C9A45C; }
.cb-orn em { width: 9px; height: 9px; border-radius: 50%; background: #D95F1E; }
.cb-cover h1, .cb-cover h2, .cb-cover h3, .cb-cover h4 { border: 0; padding: 0; letter-spacing: normal; text-transform: none; }
.cb-head h1 { font-family: "Playfair Display", Georgia, serif; font-weight: 700; font-size: 58px; letter-spacing: .06em; color: #F3EBDD; margin: 6mm 0 0; line-height: 1; }
.cb-head h2 { font-size: 26px; letter-spacing: 0; color: #D95F1E; margin: 10mm 0 0; font-weight: 700; }
.cb-head h3 { font-size: 28px; color: #fff; margin: 4mm 0 0; font-weight: 700; }
.cb-kick { color: #C9A45C; font-size: 13.5px; font-weight: 700; letter-spacing: .03em; margin: 17mm 0 0; }
.cb-line { font-size: 12.5px; margin: 5mm 0 0; } .cb-line span { color: #C9A45C; }
.cb-info { margin: 12mm 0 0; border: 1px solid #C9A45C; border-radius: 9mm; background: #0A2E23; padding: 8mm 10mm; text-align: left; }
.cb-info div { display: flex; font-size: 12px; padding: 1.4mm 0; }
.cb-info b { width: 38mm; color: #C9A45C; font-size: 11.5px; letter-spacing: .02em; }
.cb-in h4 { text-align: left; font-size: 17px; margin: 12mm 0 4mm; color: #fff; }
.cb-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm 28mm; }
.cb-tile { display: flex; justify-content: space-between; align-items: center; border: 1px solid #C9A45C; border-radius: 4mm; background: #0A2E23; padding: 3.2mm 5mm; text-align: left; }
.cb-tile small { display: block; color: #C9A45C; font-size: 9px; font-weight: 700; letter-spacing: .03em; }
.cb-tile b { display: block; font-size: 14px; margin-top: 1.2mm; }
.cb-tile i { width: 9px; height: 9px; border-radius: 50%; background: #D95F1E; }
.cb-foot { margin-top: auto; border-top: 1px solid #C9A45C; padding-top: 3mm; display: flex; justify-content: space-between; text-align: left; }
.cb-foot b { display: block; color: #C9A45C; font-size: 13.5px; }
.cb-foot span { display: block; font-size: 10px; margin-top: 1mm; }
.cb-foot .r { text-align: right; } .cb-foot .r b { color: #D95F1E; font-size: 12px; }
.sheet.cb-index { background: #F7F3EC; color: #2b2b2b; padding: 15mm 16mm; }
.cb-ihead { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 9mm; }
.cb-ihead h1 { font-family: "DM Sans", sans-serif; font-weight: 700; font-size: 30px; color: #123B2B; margin: 0; }
.cb-ihead h1 small { font-size: 13px; font-weight: 500; color: #777; }
.cb-ihead span { font-size: 12px; color: #555; }
.cb-cols { column-count: 2; column-gap: 11mm; }
.cb-cat { break-inside: avoid; margin-bottom: 5mm; }
.cb-cat h3 { font-size: 15px; font-weight: 700; color: #D95F1E; margin: 0 0 2mm; padding-bottom: 1.6mm; border-bottom: 1.4px solid #D9873E; letter-spacing: .01em; }
.cb-row { display: flex; justify-content: space-between; gap: 6px; font-size: 10px; line-height: 1.32; padding: .5mm 1mm; }
`;
