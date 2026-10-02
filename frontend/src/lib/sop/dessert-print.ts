/** Printable (A4) version of the Desserts / Drinks card; see components/recipe/DessertSopView.tsx. */
import type { PrintRecipe } from "@/lib/recipe-print";

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function fmtDate(d: string | null): string {
  if (!d) return "N/A";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

const ico = (paths: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

const ICO = {
  tag: ico('<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>'),
  pot: ico('<path d="M5 9h14v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9z"/><path d="M3 9h18M9 6h6M12 4v2"/>'),
  user: ico('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'),
  leaf: ico('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'),
  sprout: ico('<path d="M12 21v-9"/><path d="M12 12C12 8 9 5.5 4.5 5.5 4.5 10 7 12 12 12z"/><path d="M12 14c0-3.5 2.5-6 7.5-6 0 4.5-2.5 6-7.5 6z"/>'),
  snow: ico('<path d="M12 2v20M4.2 7l15.6 10M4.2 17L19.8 7"/>'),
  clock: ico('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9.5 2.5h5"/>'),
  cup: ico('<path d="M6 3h12l-1.2 17a1.5 1.5 0 0 1-1.5 1.4H8.7a1.5 1.5 0 0 1-1.5-1.4L6 3z"/><path d="M6.4 8H12M6.8 13H12M7.2 17.5H12"/>'),
  ice: ico('<path d="M12 3l5 2.5v5L12 13 7 10.5v-5L12 3zM7 10.5l-4 2v5l5 2.5 4-2M17 10.5l4 2v5l-5 2.5-4-2M7 5.5l5 2.5 5-2.5M12 8v5"/>'),
  hat: ico('<path d="M7 13a4 4 0 1 1 1.5-7.7A4.5 4.5 0 0 1 16 5.4 4 4 0 1 1 17 13v6H7v-6z"/><path d="M7 16h10"/>'),
  check: ico('<circle cx="12" cy="12" r="9.5"/><path d="M7.8 12.4l2.9 2.9 5.5-5.8"/>'),
  cloche: ico('<path d="M3 18h18M5 18a7 7 0 0 1 14 0M12 8V6M10.5 6h3"/>'),
};

const dstat = (icon: string, label: string, value: string) =>
  `<div class="dz-stat"><span class="ic">${icon}</span><b>${label}</b><span class="v">${value}</span></div>`;
const bullets = (items: string[]) => `<ul class="dz-ul">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
const up = (s: string | null | undefined) => esc((s || "N/A").toUpperCase());

export function buildDessertSheet(r: PrintRecipe, brandName: string): string {
  const words = r.title.trim().split(/\s+/);
  const title =
    words.length > 1
      ? `<span class="g">${esc(words[0])}</span><span class="o">${esc(words.slice(1).join(" "))}</span>`
      : `<span class="g">${esc(r.title)}</span>`;
  const x = r.dessert;
  const mins = (m: number | null, t?: string) => esc((t ?? `${m || 0} min`).toUpperCase());
  const eyebrow = x?.eyebrow || (r.categoryName || "Dessert").replace(/s$/i, "");

  const ings = r.ingredients
    .map((ing, i) => {
      const group =
        ing.groupLabel && ing.groupLabel !== r.ingredients[i - 1]?.groupLabel ? `<div class="dz-group">${esc(ing.groupLabel)}</div>` : "";
      const qty = [ing.quantity ?? "", ing.unit ?? ""].join(" ").trim();
      const k = ing.name.indexOf(" – ");
      const name = k < 0 ? ing.name : ing.name.slice(0, k);
      const note = k < 0 ? "" : `<div class="note">${esc(ing.name.slice(k + 3))}</div>`;
      return `${group}<div class="dz-ing"><div class="row"><span class="b">${esc(name)}</span><span>${esc(qty)}</span></div>${note}</div>`;
    })
    .join("");

  const steps = r.steps
    .map((s, i) => {
      // Time-stamped steps ("Build (0:10–0:25): Add …") put the stamp on its own line.
      const m = s.body.match(/^(.{2,40}?\([0-9:–\- ]+\)):\s+([\s\S]*)$/);
      return `<li><span class="n">${i + 1}</span><p>${m ? `${esc(m[1])}:<br>${esc(m[2])}` : esc(s.body)}</p></li>`;
    })
    .join("");

  const statsHtml = x?.stats
    ? x.stats.map((st) => dstat(ICO[st.icon], esc(st.label), esc(st.value))).join("")
    : [
        dstat(ICO.tag, "Prep time", mins(r.prepMinutes, r.timeText?.prep)),
        dstat(ICO.pot, "Cook time", mins(r.cookMinutes, r.timeText?.cook)),
        dstat(ICO.user, "Yield", up(r.yieldText)),
        x?.chillTime ? dstat(ICO.clock, "Chill time", esc(x.chillTime.toUpperCase())) : "",
        dstat(ICO.leaf, "Diet", up(r.diet)),
        x?.storeAt ? dstat(ICO.snow, "Store at", esc(x.storeAt)) : "",
      ].join("");

  const hasSide = r.qualityCheck.length > 0 || !!r.notes || !!x?.serveTitle || !!x?.serveText || !!x?.assembly;
  const panelIcon = x?.panelIcon === "leaf" ? ICO.sprout : ICO.check;
  const notes = r.notes ? `<div class="blk"><span class="pi">${ICO.hat}</span><h3>${esc(x?.notesTitle || "Chef’s Notes")}</h3><p>${esc(r.notes)}</p></div>` : "";
  const quality = r.qualityCheck.length
    ? `<div class="blk">${r.notes ? "<hr>" : ""}<span class="pi">${panelIcon}</span><h3>Quality Check Points</h3><ul class="dz-q">${r.qualityCheck
        .map((q) => `<li><span class="ci">${ICO.check}</span>${esc(q)}</li>`)
        .join("")}</ul></div>`
    : "";
  const service = x?.serviceStandard
    ? `<div class="blk sv"><hr><h3 class="o">Service Standard</h3>${x.serviceStandard
        .map((s) => `<div class="r"><b>${esc(s.label)}:</b><span>${esc(s.value)}</span></div>`)
        .join("")}</div>`
    : "";
  const assembly = x?.assembly
    ? `<div class="blk"><h3 class="big">Final Assembly</h3><hr class="t"><ol class="dz-as">${x.assembly
        .map((a, i) => `<li><span class="n">${i + 1}</span>${esc(a)}</li>`)
        .join("")}</ol>${x.assemblyGarnish ? `<hr><h3>Garnish</h3><p class="g">${esc(x.assemblyGarnish)}</p>` : ""}</div>`
    : "";
  const serve =
    x?.serveTitle || x?.serveText
      ? `<div class="blk"><hr><span class="pi">${ICO.cloche}</span>${x.serveTitle ? `<h3>${esc(x.serveTitle)}</h3>` : ""}${x.serveText ? `<p>${esc(x.serveText)}</p>` : ""}</div>`
      : "";
  const side = hasSide ? `<div class="dz-panel"><div class="dz-panel-in">${notes}${quality}${service}${assembly}${serve}</div></div>` : "";

  const showAuthor = !!r.author || !x?.glassware;
  const effectiveRow = x?.effectiveInBox
    ? `<div class="dz-ap2"><div><b>Approved by:</b> ${esc(r.approvedBy || "N/A")}</div><div class="bl sm">Effective: ${fmtDate(r.effectiveDate)}</div></div>`
    : `<div><b>Approved by:</b> ${esc(r.approvedBy || "N/A")}</div>`;

  return `
<section class="sheet recipe dz-sheet">
  <div class="inner dz">
    <div class="dz-left">
      <div class="dz-eyebrow">${esc(eyebrow)}</div>
      <div class="dz-rule"><i></i><em>&#10070;</em></div>
      <h1>${title}</h1>
      ${r.subtitle ? `<p class="dz-subt">${esc(r.subtitle)}</p>` : ""}
      ${r.description ? `<p class="dz-desc">${esc(r.description)}</p>` : ""}
      ${r.summary ? `<p class="dz-sum">&ldquo;${esc(r.summary)}&rdquo;</p>` : ""}
      <div class="dz-box">
        <div class="g2">
          <div class="c">${r.dishCode || !x?.hideEmpty ? `<div><b>Dish Code:</b> <span class="${x?.glassware ? "code" : ""}">${esc(r.dishCode || "N/A")}</span></div>` : ""}<div><b>Version:</b> v${esc(r.versionLabel)}</div></div>
          <div class="c bl">${r.station || !x?.hideEmpty ? `<div><b>Station:</b> ${esc(r.station || "N/A")}</div>` : ""}
            ${x?.glassware ? `<div><b>Glassware:</b> ${esc(x.glassware)}</div>` : ""}
            ${x?.garnishInfo ? `<div><b>Garnish:</b> ${esc(x.garnishInfo)}</div>` : ""}
            ${showAuthor ? `<div><b>Author:</b> ${esc(r.author || brandName)}</div>` : ""}</div>
        </div>
        <div class="ap">${effectiveRow}</div>
      </div>
      <div class="dz-stats">${statsHtml}</div>
      <div class="dz-orn"><i></i><em>&#10070;</em><i></i></div>
      <div class="dz-cols">
        <div class="c1">
          <h3>Ingredients (NET)</h3>${ings}
          ${r.miseEnPlace.length ? `<hr><h3>Mise en place</h3>${bullets(r.miseEnPlace)}` : ""}
          ${r.equipment.length ? `<hr><h3>Equipment / Tools</h3>${bullets(r.equipment)}` : ""}
          ${x?.chefTip ? `<div class="dz-tip"><span class="ic">${ICO.hat}</span><div><h4>Chef&rsquo;s Tip</h4><p>${esc(x.chefTip)}</p></div></div>` : ""}
        </div>
        <div class="c2">
          <h3>${esc(x?.methodTitle || "Method")}</h3><ol class="dz-steps">${steps}</ol>
          ${r.garnish?.length ? `<h3 class="mt">Garnish</h3>${bullets(r.garnish)}` : ""}
          ${x?.ccp ? `<hr class="s"><h3>CCP / Quality</h3><p>${esc(x.ccp)}</p>` : ""}
          ${r.plating || !x?.hideEmpty ? `<hr class="s"><h3>${esc(x?.platingTitle || "Plating & Portioning")}</h3><p>${esc(r.plating || "N/A")}</p>` : ""}
          ${r.holding || (!x?.platingTitle && !x?.hideEmpty) ? `<hr class="s"><h3>Holding &amp; Shelf Life</h3><p>${esc(r.holding || "N/A")}</p>` : ""}
          ${r.allergens || (!x?.platingTitle && !x?.hideEmpty) ? `<hr class="s"><h3>Allergens</h3><p>${esc(r.allergens || "N/A")}</p>` : ""}
          ${x?.prepNote ? `<hr class="s"><h3>Notes</h3><p>${esc(x.prepNote)}</p>` : ""}
        </div>
      </div>
    </div>
    <div class="dz-right">
      <div class="dz-photo">${r.heroImageUrl ? `<img src="${esc(r.heroImageUrl)}" alt="${esc(r.title)}">` : ""}</div>${x?.photoCaption ? `<div class="dz-cap">${esc(x.photoCaption)}</div>` : ""}
      ${side}
    </div>
  </div>
</section>`;
}

// Every selector is scoped under .dz-sheet so the standard card's global h1/h3 rules never leak in.
export const DESSERT_CSS = `
.sheet.dz-sheet { padding: 0; background: #F7F2EB; }
.dz-sheet .inner.dz { display: grid; grid-template-columns: 1fr 1fr; gap: 0; align-items: stretch; }
.dz-sheet h1, .dz-sheet h3, .dz-sheet h4 { border: 0; padding: 0; text-transform: none; letter-spacing: normal; }
.dz-left { padding: 9mm 8mm 8mm 9mm; display: flex; flex-direction: column; min-width: 0; }
.dz-eyebrow { color: #D95F1E; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.dz-rule { display: flex; align-items: center; gap: 6px; margin: 5px 0 10px; }
.dz-rule i { flex: 1; height: 1px; background: #D95F1E; }
.dz-rule em { color: #D95F1E; font-style: normal; font-size: 15px; line-height: 1; }
.dz-sheet .dz-left h1 { font-family: "Playfair Display", Georgia, serif; font-weight: 500; font-size: 44px; line-height: 1.02; margin: 0; text-transform: uppercase; }
.dz-left h1 span { display: block; } .dz-left h1 .g { color: #173B2B; } .dz-left h1 .o { color: #D95F1E; }
.dz-subt { font-size: 12px; color: #777; margin: 8px 0 0; }
.dz-cap { flex: none; background: #2A2220; color: #fff; font-size: 9.5px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; padding: 7px 18px; }
.dz-panel .sv { text-align: left; } .dz-panel .sv h3.o { color: #D95F1E; font-size: 12px; letter-spacing: .05em; margin: 0 0 8px; }
.dz-panel .sv .r { display: grid; grid-template-columns: 70px 1fr; gap: 8px; font-size: 11.5px; margin-top: 4px; } .dz-panel .sv .r b { color: #E8A35E; text-transform: uppercase; }
.dz-panel h3.big { font-size: 16px; margin: 0; } .dz-panel hr.t { margin: 12px 0; }
.dz-as { list-style: none; margin: 0; padding: 0; text-align: left; font-size: 12px; }
.dz-as li { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px; }
.dz-as .n { flex: none; width: 17px; height: 17px; border-radius: 50%; background: #D95F1E; color: #fff; font-size: 9.5px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-top: 1px; }
.dz-panel p.g { font-size: 11.5px; font-weight: 600; margin: 4px 0 0; }
.dz-desc { font-size: 12.5px; line-height: 1.55; color: #3d3d3d; margin: 14px 0 0; }
.dz-sum { font-family: "Playfair Display", Georgia, serif; font-style: italic; font-size: 12px; color: #173B2B; margin: 8px 0 0; }
.dz-box { background: #173B2B; color: #fff; border-radius: 12px; padding: 13px 16px; margin-top: 14px; font-size: 11.5px; }
.dz-box .g2 { display: grid; grid-template-columns: 1fr 1fr; }
.dz-box .c > div + div { margin-top: 6px; } .dz-box .c { padding-right: 12px; }
.dz-box .bl { border-left: 1px dotted rgba(217,95,30,.8); padding-left: 12px; }
.dz-box .code { color: #E8A35E; }
.dz-box .ap { margin-top: 10px; padding-top: 10px; border-top: 1px dotted rgba(217,95,30,.8); }
.dz-box .dz-ap2 { display: grid; grid-template-columns: 1.3fr 1fr; }
.dz-box .g2 { grid-template-columns: .8fr 1.2fr; }
.dz-box .sm { font-size: 10px; }
.dz-stats { display: flex; align-items: flex-start; margin-top: 18px; }
.dz-stat { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 3px; border-left: 1px dotted rgba(217,95,30,.55); color: #173B2B; }
.dz-stat:first-child { border-left: 0; }
.dz-stat .ic { width: 40px; height: 40px; border: 1px solid #173B2B; border-radius: 50%; padding: 9px; display: flex; }
.dz-stat b { font-size: 8.5px; text-transform: uppercase; letter-spacing: .04em; margin-top: 12px; }
.dz-stat .v { font-size: 10px; line-height: 1.35; margin-top: 10px; white-space: pre-line; }
.dz-orn { display: flex; align-items: center; gap: 8px; margin: 18px 0; }
.dz-orn i { flex: 1; height: 1px; background: #D95F1E; }
.dz-orn em { color: #D95F1E; font-style: normal; font-size: 14px; line-height: 1; }
.dz-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; flex: 1; }
.dz-sheet .dz-cols h3 { font-family: "Playfair Display", Georgia, serif; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; color: #173B2B; margin: 0 0 8px; }
.dz-sheet .dz-cols h3.mt { margin-top: 16px; }
.dz-cols .c1 { border-right: 1px dotted rgba(217,95,30,.6); padding-right: 12px; min-width: 0; }
.dz-cols .c2 { min-width: 0; }
.dz-cols hr { border: 0; border-top: 1px dotted rgba(217,95,30,.6); margin: 16px 0; }
.dz-cols hr.s { width: 40%; margin: 12px 0; }
.dz-cols p { font-size: 11.5px; line-height: 1.45; margin: 0; white-space: pre-line; }
.dz-group { color: #D95F1E; font-size: 10.5px; font-weight: 700; text-transform: uppercase; margin: 8px 0 2px; }
.dz-ing { padding: 3px 0; font-size: 11px; line-height: 1.4; }
.dz-ing .row { display: flex; justify-content: space-between; gap: 8px; }
.dz-ing .note { padding-left: 13px; padding-top: 2px; font-size: 10.5px; }
.dz-ing .b, .dz-ul li { position: relative; padding-left: 13px; }
.dz-ing .b::before, .dz-ul li::before { content: ""; position: absolute; left: 0; top: .55em; width: 4px; height: 4px; border-radius: 50%; background: #D95F1E; }
.dz-ul { list-style: none; margin: 0; padding: 0; font-size: 11.5px; line-height: 1.45; }
.dz-ul li + li { margin-top: 4px; }
.dz-steps { list-style: none; margin: 0; padding: 0; font-size: 11.5px; line-height: 1.4; }
.dz-steps li { display: flex; gap: 8px; margin-bottom: 10px; align-items: flex-start; }
.dz-steps .n { flex: none; width: 17px; height: 17px; border-radius: 50%; background: #D95F1E; color: #fff; font-size: 9.5px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-top: 1px; }
.dz-steps p { margin: 0; }
.dz-tip { display: flex; gap: 8px; align-items: flex-start; margin-top: 18px; border: 1px solid rgba(217,95,30,.6); border-radius: 8px; padding: 10px; }
.dz-tip .ic { flex: none; width: 24px; height: 24px; color: #D95F1E; }
.dz-sheet .dz-tip h4 { font-family: "Playfair Display", Georgia, serif; font-size: 12.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; color: #173B2B; margin: 0; }
.dz-sheet .dz-cols .dz-tip p { font-size: 10px; line-height: 1.4; margin: 4px 0 0; }
.dz-right { display: flex; flex-direction: column; min-width: 0; }
.dz-photo { height: 62%; background: #1a1a1a; overflow: hidden; flex: none; }
.dz-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.dz-panel { flex: 1; background: #173B2B; color: #fff; padding: 22px 24px; text-align: center; display: flex; }
.dz-panel-in { flex: 1; border: 1px solid rgba(217,95,30,.6); padding: 18px 22px; display: flex; flex-direction: column; justify-content: space-around; }
.dz-panel .pi { display: block; width: 28px; height: 28px; margin: 0 auto; color: #D95F1E; }
.dz-sheet .dz-panel h3 { font-family: "Playfair Display", Georgia, serif; font-size: 15px; font-weight: 500; text-transform: uppercase; letter-spacing: .03em; color: #fff; margin: 8px 0 0; }
.dz-panel p { font-size: 12px; line-height: 1.55; margin: 8px 0 0; color: rgba(255,255,255,.9); white-space: pre-line; }
.dz-panel hr { border: 0; border-top: 1px dotted #D95F1E; margin: 0 0 16px; }
.dz-q { list-style: none; margin: 12px auto 0; padding: 0; text-align: left; font-size: 12px; display: inline-block; }
.dz-q li { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 9px; }
.dz-q .ci { flex: none; width: 16px; height: 16px; color: #D95F1E; margin-top: 1px; }
`;
