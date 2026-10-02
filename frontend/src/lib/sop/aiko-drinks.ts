/**
 * The Aiko Kitchen DRINKS card ("Bar Recipe Bible"): cream recipe column on the left
 * (title, info grid, ingredient table, method, batch preparations, notes) and the photo
 * with a dark Quality Check / Serve panel on the right. Same layout as the supplied PDF,
 * recoloured to Aiko's black and gold.
 *
 * Built as an HTML string (plus DRINK_CSS) so the web page, the admin live preview and
 * the printable PDF share the same markup. Laid out at A4 size (794 × 1123 CSS px).
 * Fields without a column of their own live in `customFields.drink`.
 */

export const DRINK_CATEGORIES = ["drinks"];

export function isDrinksStyle(template: string, categorySlug: string | null | undefined): boolean {
  return template === "aiko" && !!categorySlug && DRINK_CATEGORIES.includes(categorySlug.toLowerCase());
}

export type DrinkIcon = "cocktail" | "ice" | "lemon" | "leaf" | "glass" | "cloche" | "bottle" | "boba" | "gear" | "note" | "flower" | "tumbler" | "mug";

export interface DrinkExtras {
  /** Two display lines: [black, gold]. Falls back to splitting the title. */
  titleLines?: [string, string?];
  /** Small line under the title, e.g. "(NON-ALCOHOLIC)". */
  subtitle?: string;
  /** Icon at the top right of the header row. */
  headIcon?: "cocktail" | "tumbler" | "mug";
  /** Info grid. "icons": 3 × 2 with icons; "plain": 2 × 2 gold labels. */
  infoStyle?: "icons" | "plain";
  info?: { icon?: DrinkIcon; label: string; value: string }[];
  /** "Preparation / specification" cell per ingredient (same order as the ingredients). */
  prep?: string[];
  /** Full quantity text per ingredient (overrides quantity + unit). */
  qty?: string[];
  methodTitle?: string;
  /** Large-batch preparations under the method. */
  batches?: { title: string; sub?: string; rows: [label: string, text: string][] }[];
  extraNotes?: { title: string; items: string[] };
  notes?: string[];
  sourceNote?: string;
  /** Right column: photo fills the top ("full") or sits in a gold frame on black ("framed"). */
  photoStyle?: "full" | "framed";
  serve?: { title: string; text: string };
  /** Plain QC panel (no leaf / cloche icons). */
  plainPanel?: boolean;
  /** Recipe boxes on the right (house syrups) shown instead of the QC panel. */
  panels?: { title: string; sections: { head: string; lines?: string[]; steps?: string[]; text?: string }[] }[];
  footer?: string;
  /** "Technique | Garnish" bar-card variant (Final Assembly panel instead of Quality Check). */
  bar?: {
    finalAssembly: string[];
    garnish: string;
    plating: string;
    caption?: string;
    footer?: string;
  };
}

export function drinkExtrasOf(customFields: unknown): DrinkExtras | null {
  const d = (customFields as { drink?: unknown } | null | undefined)?.drink;
  return d && typeof d === "object" ? (d as DrinkExtras) : null;
}

export interface DrinkCardData {
  title: string;
  description: string | null;
  heroUrl: string | null;
  ingredients: { name: string; quantity: number | null; unit: string | null }[];
  steps: { title: string | null; body: string }[];
  qualityCheck: string[];
  extras: DrinkExtras | null;
}

const esc = (s: string | number | null | undefined) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const field = (editable: boolean, name: string) => (editable ? ` data-field="${name}"` : "");

const svg = (body: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const ICON: Record<DrinkIcon, string> = {
  cocktail: svg('<path d="M4 5h16l-8 9z"/><path d="M12 14v6M8 20h8"/><path d="M15 3l4-2"/>'),
  ice: svg('<path d="M12 3l5 2.5v5L12 13 7 10.5v-5L12 3zM7 10.5l-4 2v5l5 2.5 4-2M17 10.5l4 2v5l-5 2.5-4-2M7 5.5l5 2.5 5-2.5M12 8v5"/>'),
  lemon: svg('<path d="M3 15a9 9 0 0 1 18 0z"/><path d="M12 15V7M6.5 15l4-7M17.5 15l-4-7M4.5 12.5h15"/>'),
  leaf: svg('<path d="M20 4C11 4 5 9 5 16c0 1.4.3 2.6.8 3.6"/><path d="M20 4c0 9-5 15-12 15"/><path d="M5.8 19.6 14 11"/>'),
  glass: svg('<path d="M6 3h12l-1.2 17a1.5 1.5 0 0 1-1.5 1.4H8.7a1.5 1.5 0 0 1-1.5-1.4L6 3z"/><path d="M6.4 8h11.2"/>'),
  cloche: svg('<path d="M3 18h18M5 18a7 7 0 0 1 14 0M12 8V6M10.5 6h3"/>'),
  bottle: svg('<path d="M10 2h4v4l2 3v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z"/><path d="M8 13h8"/>'),
  boba: svg('<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><circle cx="12" cy="14" r="3"/><circle cx="6" cy="16" r="2.4"/><circle cx="18" cy="16" r="2.4"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/><circle cx="12" cy="12" r="7"/>'),
  note: svg('<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M10 12h6M10 15h6M10 18h4"/>'),
  flower: svg('<circle cx="12" cy="12" r="2"/><path d="M12 4c2 2 2 5 0 6-2-1-2-4 0-6zM20 12c-2 2-5 2-6 0 1-2 4-2 6 0zM12 20c-2-2-2-5 0-6 2 1 2 4 0 6zM4 12c2-2 5-2 6 0-1 2-4 2-6 0z"/>'),
  tumbler: svg('<path d="M6 7h12l-1.3 14H7.3z"/><path d="M6.4 11h11.2M13 7l3-5"/>'),
  mug: svg('<rect x="6" y="5" width="12" height="16" rx="2.5"/><path d="M6.5 8.5h11"/><path d="M13 5l3-3"/>'),
};

/** Size the two title lines so the longer one just fills the recipe column. */
function titleFont(lines: string[]): number {
  const longest = Math.max(...lines.map((l) => l.length), 4);
  return Math.max(34, Math.min(70, Math.floor(405 / (longest * 0.66))));
}

function qtyCell(i: DrinkCardData["ingredients"][number]): string {
  return [i.quantity != null ? String(i.quantity) : "", i.unit ?? ""].filter(Boolean).join(" ");
}

function barCardHtml(d: DrinkCardData, editable: boolean): string {
  const x = d.extras ?? {};
  const b = x.bar!;
  const f = (n: string) => field(editable, n);
  const lines = (x.titleLines ?? [d.title]).filter(Boolean) as string[];
  const size = Math.max(40, Math.min(78, Math.floor(400 / (Math.max(...lines.map((l) => l.length), 4) * 0.7))));
  const info = (x.info ?? []).map((c) => `<div class="dkb-cell"><b>${esc(c.label.toUpperCase())}</b><span>${esc(c.value)}</span></div>`).join("");
  const ings = d.ingredients
    .map((ing, i) => `<li${f(`ingredients.${i}`)}><span>${esc(ing.name)}</span><b>${esc(x.qty?.[i] || qtyCell(ing))}</b></li>`)
    .join("");
  const steps = d.steps.map((st, i) => `<li${f(`steps.${i}`)}><b>${i + 1}</b><span>${esc(st.body)}</span></li>`).join("");
  const fin = b.finalAssembly.map((t, i) => `<li><b>${i + 1}</b><span>${esc(t)}</span></li>`).join("");
  const photo = d.heroUrl
    ? `<img src="${esc(d.heroUrl)}" alt="${esc(d.title)}">`
    : `<span class="dk-photo-empty">${editable ? "Click to add a hero image" : ""}</span>`;
  return `
<div class="dk-left dkb-left">
  <div class="dk-eyebrow"><span>DRINK</span><i></i><em>${ICON.mug}</em></div>
  <h1 class="dk-title"${f("title")} style="font-size:${size}px">${lines.map((l, i) => `<span class="${i === 0 && lines.length > 1 ? "k" : lines.length === 1 ? "k" : "g"}">${esc(l)}</span>`).join("")}</h1>
  <div class="dkb-info">${info}</div>
  <div class="dk-sec"><h2${f("ingredients")}>INGREDIENTS (NET)</h2><i class="dk-rule"></i><ul class="dkb-ing">${ings}</ul></div>
  <div class="dk-sec"><h2${f("steps")}>METHOD / PRODUCTION PROTOCOL</h2><i class="dk-rule"></i><ol class="dk-steps">${steps}</ol></div>
  <div class="dkb-plating"><h3>PLATING / GARNISH</h3><p>${esc(b.plating)}</p></div>
  <div class="dkb-foot">${esc(b.footer || "AIKO Kitchen  |  Internal Use")}</div>
</div>
<div class="dk-right dkb-right">
  <div class="dk-photo dkb-photo"${f("heroImageId")}>${photo}<div class="dkb-cap">${esc(b.caption || "REFERENCE DRINK PHOTO")}</div></div>
  <div class="dkb-panel">
    <i class="dk-qi">${ICON.mug}</i>
    <h3>FINAL ASSEMBLY</h3><div class="dk-dots"></div>
    <ol>${fin}</ol>
    <div class="dk-dots"></div>
    <h4>GARNISH</h4><p>${esc(b.garnish)}</p>
  </div>
</div>`;
}

export function drinkCardHtml(d: DrinkCardData, { editable = false } = {}): string {
  if (d.extras?.bar) return barCardHtml(d, editable);
  const x = d.extras ?? {};
  const f = (n: string) => field(editable, n);
  const words = d.title.trim().split(/\s+/);
  const half = Math.ceil(words.length / 2);
  const lines = (x.titleLines ?? (words.length > 1 ? [words.slice(0, half).join(" "), words.slice(half).join(" ")] : [d.title])).filter(Boolean) as string[];
  const size = titleFont(lines);
  const plain = x.infoStyle === "plain";
  const framed = x.photoStyle === "framed";

  const info = (x.info ?? [])
    .map((c) =>
      plain
        ? `<div class="dk-ic"><b>${esc(c.label.toUpperCase())}</b><span>${esc(c.value)}</span></div>`
        : `<div class="dk-ic"><i>${c.icon ? ICON[c.icon] : ""}</i><div><b>${esc(c.label)}</b><span>${esc(c.value)}</span></div></div>`,
    )
    .join("");

  const rows = d.ingredients
    .map(
      (ing, i) =>
        `<tr${f(`ingredients.${i}`)}><td>${esc(ing.name)}</td><td>${esc(x.qty?.[i] || qtyCell(ing) || "–")}</td><td>${esc(x.prep?.[i] || "–")}</td></tr>`,
    )
    .join("");

  const steps = d.steps
    .map((s, i) => `<li${f(`steps.${i}`)}><b>${i + 1}</b><span>${esc(s.body)}</span></li>`)
    .join("");

  const batches = (x.batches ?? [])
    .map(
      (b) =>
        `<div class="dk-batch"><h3>${esc(b.title)}${b.sub ? ` <small>– ${esc(b.sub)}</small>` : ""}</h3><i class="dk-rule"></i>${b.rows
          .map(([k, v]) => `<div class="dk-brow"><b>${esc(k)}:</b><span>${esc(v)}</span></div>`)
          .join("")}</div>`,
    )
    .join("");

  const bullets = (items: string[]) => `<ul class="dk-notes">${items.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`;
  const extraNotes = x.extraNotes ? `<div class="dk-sec"><h2>${esc(x.extraNotes.title)}</h2><i class="dk-rule"></i>${bullets(x.extraNotes.items)}</div>` : "";
  const notes = x.notes?.length ? `<div class="dk-sec"><h2>QUALITY / STORAGE NOTES</h2><i class="dk-rule"></i>${bullets(x.notes)}</div>` : "";
  const source = x.sourceNote ? `<div class="dk-source"><b>SOURCE NOTE</b><p>${esc(x.sourceNote)}</p></div>` : "";

  const photo = d.heroUrl
    ? `<img src="${esc(d.heroUrl)}" alt="${esc(d.title)}">`
    : `<span class="dk-photo-empty">${editable ? "Click to add a hero image" : ""}</span>`;

  const serve = x.serve ?? { title: "SERVE IMMEDIATELY", text: "Serve ice-cold." };
  const qcPanel = d.qualityCheck.length
    ? `<div class="dk-qc${x.plainPanel ? " plain" : ""}"${f("qualityCheck")}>
        ${x.plainPanel ? "" : `<i class="dk-qi">${ICON.leaf}</i>`}
        <h3>QUALITY CHECK POINTS</h3>
        ${x.plainPanel ? '<i class="dk-line"></i>' : ""}
        <ul>${d.qualityCheck.map((q, i) => `<li${f(`qualityCheck.${i}`)}><i>${svg('<circle cx="12" cy="12" r="9.5"/><path d="m7.5 12.3 3 3 6-6.3"/>')}</i><span>${esc(q)}</span></li>`).join("")}</ul>
        <div class="dk-dots"></div>
        ${x.plainPanel ? "" : `<i class="dk-qi sm">${ICON.cloche}</i>`}
        <h4>${esc(serve.title)}</h4><p>${esc(serve.text)}</p>
      </div>`
    : "";
  const panels = (x.panels ?? [])
    .map(
      (p) =>
        `<div class="dk-pbox"><h3>${esc(p.title)}</h3><i class="dk-line"></i>${p.sections
          .map(
            (s) =>
              `<h5>${esc(s.head)}</h5>${s.lines ? `<p class="l">${s.lines.map(esc).join("<br>")}</p>` : ""}${s.steps ? s.steps.map((t) => `<p class="s">${esc(t)}</p>`).join("") : ""}${s.text ? `<p class="t">${esc(s.text)}</p>` : ""}`,
          )
          .join("")}</div>`,
    )
    .join("");

  const headIcon = ICON[x.headIcon ?? "tumbler"];

  return `
<div class="dk-left">
  <div class="dk-eyebrow"><span>DRINK</span><i></i><em>${headIcon}</em></div>
  <h1 class="dk-title"${f("title")} style="font-size:${size}px">${lines.map((l, i) => `<span class="${i === 0 && lines.length > 1 ? "k" : lines.length === 1 ? "k" : "g"}">${esc(l)}</span>`).join("")}</h1>
  ${x.subtitle ? `<div class="dk-sub">${esc(x.subtitle)}</div>` : ""}
  ${d.description ? `<p class="dk-desc"${f("description")}>${esc(d.description)}</p>` : ""}
  <div class="dk-info ${plain ? "plain" : ""}">${info}</div>
  <div class="dk-sec"><h2${f("ingredients")}>INGREDIENTS</h2><i class="dk-rule"></i>
    <table class="dk-t"><tr><th>INGREDIENT</th><th>QUANTITY</th><th>PREPARATION / SPECIFICATION</th></tr>${rows}</table>
  </div>
  <div class="dk-sec"><h2${f("steps")}>${esc(x.methodTitle || "METHOD")}</h2><i class="dk-rule"></i><ol class="dk-steps">${steps}</ol></div>
  ${source}
  ${batches}
  ${extraNotes}
  ${notes}
  <div class="dk-foot"><i></i><span>${esc(x.footer || "AIKO Bar Recipe Bible")}</span></div>
</div>
<div class="dk-right ${framed ? "framed" : ""}">
  <div class="dk-photo"${f("heroImageId")}>${photo}</div>
  ${panels ? `<div class="dk-panels">${panels}</div>` : qcPanel}
</div>`;
}

const GOLD = "#DDA132";
const GOLD_SOFT = "#EBD6A6";

export const DRINK_CSS = `
.dk-root { width: 100%; min-height: 100%; display: grid; grid-template-columns: 55% 45%; background: #F9F4EA; color: #111;
  font-family: "Nunito Sans", system-ui, sans-serif; -webkit-font-smoothing: antialiased; text-align: left; line-height: 1.38; }
.dk-root *, .dk-root *::before, .dk-root *::after { box-sizing: border-box; }
.dk-root p, .dk-root h1, .dk-root h2, .dk-root h3, .dk-root h4, .dk-root h5, .dk-root ul, .dk-root ol { margin: 0; padding: 0; }
.dk-root svg { display: block; width: 100%; height: 100%; }
.dk-left { padding: 18px 20px 14px 26px; display: flex; flex-direction: column; min-width: 0; }
.dk-eyebrow { display: flex; align-items: center; gap: 0; color: ${GOLD}; font-weight: 700; font-size: 11.5px; letter-spacing: .02em; }
.dk-eyebrow i { flex: 1; height: 1.3px; background: ${GOLD}; margin: 17px 14px 0 0; align-self: flex-end; }
.dk-eyebrow span { align-self: flex-start; } .dk-eyebrow em { width: 28px; height: 38px; color: ${GOLD}; margin-top: -2px; margin-left: -4px; }
.dk-root h1.dk-title { font-family: "EB Garamond", Georgia, serif; font-weight: 700; line-height: .98; text-transform: uppercase; margin: 8px 0 0; letter-spacing: -.01em; }
.dk-title span { display: block; } .dk-title .k { color: #0B0B0B; } .dk-title .g { color: ${GOLD}; }
.dk-sub { font-family: "EB Garamond", Georgia, serif; font-weight: 500; font-size: 22px; color: #0B0B0B; margin-top: 4px; text-transform: uppercase; }
.dk-root .dk-desc { font-size: 11.5px; line-height: 1.5; margin-top: 10px; color: #1b1b1b; }
.dk-info { margin-top: 14px; background: #141414; border-radius: 9px; display: grid; grid-template-columns: repeat(3, 1fr); padding: 3px 0; }
.dk-info .dk-ic { display: flex; gap: 9px; align-items: center; padding: 11px 12px; color: #fff; border-right: 1px dotted rgba(221,161,50,.8); border-bottom: 1px dotted rgba(221,161,50,.8); min-width: 0; }
.dk-info .dk-ic:nth-child(3n) { border-right: 0; } .dk-info .dk-ic:nth-last-child(-n+3) { border-bottom: 0; }
.dk-ic > i { width: 26px; height: 26px; color: ${GOLD}; flex: none; }
.dk-ic b { display: block; font-size: 10.6px; font-weight: 700; } .dk-ic span { display: block; font-size: 9.6px; line-height: 1.3; }
.dk-info.plain { grid-template-columns: repeat(2, 1fr); padding: 6px 0; }
.dk-info.plain .dk-ic { display: block; padding: 10px 24px; } .dk-info.plain .dk-ic:nth-child(3n) { border-right: 1px dotted rgba(221,161,50,.8); } .dk-info.plain .dk-ic:nth-child(2n) { border-right: 0; } .dk-info.plain .dk-ic:nth-last-child(-n+2) { border-bottom: 0; } .dk-info.plain .dk-ic:nth-last-child(3) { border-bottom: 1px dotted rgba(221,161,50,.8); }
.dk-info.plain .dk-ic b { color: ${GOLD}; font-size: 10.6px; letter-spacing: .02em; margin-bottom: 4px; } .dk-info.plain .dk-ic span { font-size: 11px; }
.dk-sec { margin-top: 14px; }
.dk-root h2 { font-family: "EB Garamond", Georgia, serif; font-weight: 700; font-size: 20px; color: #0B0B0B; letter-spacing: 0; text-transform: uppercase; border: 0; padding: 0; }
.dk-rule { display: block; height: 1.3px; background: ${GOLD}; margin: 3px 0 7px; }
.dk-t { width: 100%; border-collapse: collapse; font-size: 10.6px; }
.dk-t th { font-size: 8.4px; letter-spacing: .06em; font-weight: 800; text-align: left; padding: 5px 7px 6px; border-bottom: 1.2px solid ${GOLD_SOFT}; }
.dk-t td { padding: 3.6px 7px; border-bottom: 1px solid ${GOLD_SOFT}; vertical-align: middle; line-height: 1.25; }
.dk-t td + td, .dk-t th + th { border-left: 1px dotted ${GOLD}; }
.dk-steps { list-style: none; margin-top: 2px; }
.dk-steps li { display: flex; gap: 11px; align-items: flex-start; margin-bottom: 7px; font-size: 11px; line-height: 1.4; }
.dk-steps b { flex: none; width: 21px; height: 21px; border-radius: 50%; background: ${GOLD}; color: #fff; font-size: 11.5px; text-align: center; line-height: 21px; font-weight: 700; }
.dk-steps span { padding-top: 1px; }
.dk-batch { margin-top: 12px; }
.dk-root .dk-batch h3 { font-family: "EB Garamond", Georgia, serif; font-weight: 700; font-size: 17px; color: #0B0B0B; text-transform: uppercase; letter-spacing: 0; } .dk-batch h3 small { font-size: 13.4px; font-weight: 700; }
.dk-brow { display: grid; grid-template-columns: auto 1fr; gap: 0 10px; font-size: 10.2px; line-height: 1.38; margin-top: 4px; } .dk-brow b { color: ${GOLD}; font-weight: 800; white-space: nowrap; }
.dk-notes { list-style: none; } .dk-notes li { position: relative; padding-left: 17px; font-size: 10.8px; margin-bottom: 3px; } .dk-notes li::before { content: ""; position: absolute; left: 4px; top: .46em; width: 6px; height: 6px; border-radius: 50%; background: ${GOLD}; }
.dk-source { margin-top: 12px; border: 1px solid ${GOLD}; border-radius: 6px; background: #FBF1DC; padding: 8px 12px; } .dk-source b { color: ${GOLD}; font-size: 10.4px; font-weight: 800; letter-spacing: .02em; } .dk-source p { font-size: 9.8px; margin-top: 3px; line-height: 1.4; }
.dk-foot { margin-top: auto; padding-top: 14px; } .dk-foot i { display: block; height: 1.3px; background: ${GOLD}; margin-bottom: 8px; } .dk-foot span { font-family: "EB Garamond", Georgia, serif; font-size: 12px; }
.dkb-left { padding: 22px 22px 14px 26px; }
.dkb-left .dk-title { margin-top: 12px; }
.dk-root .dkb-left h2 { font-size: 17.5px; white-space: nowrap; }
.dkb-info { margin-top: 18px; background: #141414; border-radius: 10px; display: grid; grid-template-columns: 1fr 1fr; padding: 16px 0 20px; color: #fff; min-height: 76px; }
.dkb-cell { padding: 0 20px; } .dkb-cell + .dkb-cell { border-left: 1px dotted ${GOLD}; }
.dkb-cell b { display: block; font-size: 11.6px; font-weight: 800; letter-spacing: .02em; margin-bottom: 8px; } .dkb-cell span { display: block; font-size: 11.4px; line-height: 1.3; }
.dkb-ing { list-style: none; margin-top: 4px; }
.dkb-ing li { position: relative; display: flex; justify-content: space-between; gap: 10px; padding: 3.6px 4px 3.6px 18px; font-size: 12.4px; line-height: 1.3; }
.dkb-ing li::before { content: ""; position: absolute; left: 3px; top: .72em; width: 6px; height: 6px; border-radius: 50%; background: ${GOLD}; }
.dkb-ing b { font-weight: 500; white-space: nowrap; }
.dkb-left .dk-steps li { font-size: 11.6px; margin-bottom: 9px; }
.dkb-plating { margin-top: auto; border: 1.2px solid ${GOLD}; padding: 14px 20px 18px; }
.dk-root .dkb-plating h3 { font-family: "EB Garamond", Georgia, serif; font-weight: 700; font-size: 17px; color: #0B0B0B; text-transform: uppercase; letter-spacing: 0; } .dkb-plating p { font-size: 12px; margin-top: 8px; }
.dkb-foot { padding-top: 16px; font-size: 10px; color: #777; }
.dkb-right { background: #070707; }
.dkb-photo { height: 62%; }
.dkb-cap { position: absolute; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.62); color: #fff; font-size: 10px; font-weight: 800; letter-spacing: .02em; padding: 11px 24px; }
.dkb-panel { margin: 28px 22px 26px; border: 1.2px solid ${GOLD}; border-radius: 14px; background: #0D0D0D; padding: 18px 20px 20px; flex: 1; text-align: center; color: #fff; display: flex; flex-direction: column; align-items: center; }
.dkb-panel .dk-qi { width: 28px; height: 28px; margin-bottom: 4px; }
.dk-root .dkb-panel h3 { font-family: "EB Garamond", Georgia, serif; font-weight: 700; font-size: 21px; letter-spacing: 0; text-transform: uppercase; }
.dkb-panel .dk-dots { margin: 12px 0 14px; }
.dkb-panel ol { list-style: none; text-align: left; align-self: stretch; margin-bottom: auto; } .dkb-panel li { display: flex; gap: 12px; align-items: flex-start; font-size: 12.4px; margin-bottom: 10px; line-height: 1.35; }
.dkb-panel li b { flex: none; width: 21px; height: 21px; border-radius: 50%; background: ${GOLD}; color: #fff; font-size: 11px; text-align: center; line-height: 21px; }
.dk-root .dkb-panel h4 { font-family: "EB Garamond", Georgia, serif; font-weight: 700; font-size: 17px; text-transform: uppercase; } .dkb-panel p { font-size: 12.4px; margin-top: 6px; text-align: left; align-self: stretch; }
.dk-right { background: #070707; display: flex; flex-direction: column; min-width: 0; }
.dk-photo { height: 57.5%; background: #1a1a1a; overflow: hidden; flex: none; position: relative; }
.dk-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.dk-photo-empty { display: flex; height: 100%; align-items: center; justify-content: center; color: #888; font-size: 12px; }
.dk-right.framed .dk-photo { height: auto; flex: none; margin: 24px 14px 0 14px; border: 1.2px solid ${GOLD}; background: #000; display: flex; justify-content: center; aspect-ratio: 1 / 1.38; }
.dk-right.framed .dk-photo img { width: auto; max-width: 100%; height: 100%; object-fit: contain; }
.dk-qc { margin: 12px 18px 22px 16px; border: 1.2px solid ${GOLD}; padding: 16px 20px 22px; flex: 1; text-align: center; color: #fff; display: flex; flex-direction: column; align-items: center; background: #0D0D0D; }
.dk-qi { display: block; width: 38px; height: 38px; color: ${GOLD}; margin-bottom: 8px; } .dk-qi.sm { width: 40px; height: 32px; margin-bottom: 8px; }
.dk-root .dk-qc h3 { font-family: "EB Garamond", Georgia, serif; font-weight: 700; font-size: 20px; letter-spacing: 0; text-transform: uppercase; }
.dk-qc ul { list-style: none; margin: 12px 0 0; text-align: left; }
.dk-qc li { display: flex; gap: 12px; align-items: center; font-size: 11.6px; margin-bottom: 8px; } .dk-qc li i { width: 20px; height: 20px; color: ${GOLD}; flex: none; }
.dk-dots { align-self: stretch; border-top: 1.3px dotted ${GOLD}; margin: 10px 0 14px; }
.dk-root .dk-qc h4 { font-family: "EB Garamond", Georgia, serif; font-weight: 700; font-size: 19px; text-transform: uppercase; } .dk-qc p { font-size: 12.5px; margin-top: 3px; color: #ddd; }
.dk-qc.plain { border-radius: 10px; padding-top: 18px; } .dk-qc.plain h3 { font-size: 22px; } .dk-qc.plain .dk-line { display: block; align-self: stretch; height: 1.3px; background: ${GOLD}; margin: 6px 0 0; } .dk-qc.plain li { font-size: 11px; margin-bottom: 4px; }
.dk-panels { padding: 14px 14px 16px; display: flex; flex-direction: column; gap: 12px; }
.dk-pbox { border: 1.2px solid ${GOLD}; border-radius: 10px; background: #0E0E0E; padding: 14px 18px 14px; color: #fff; }
.dk-root .dk-pbox h3 { font-family: "EB Garamond", Georgia, serif; font-weight: 700; font-size: 18px; text-transform: uppercase; letter-spacing: 0; }
.dk-line { display: block; height: 1.3px; background: ${GOLD}; margin: 5px 0 8px; }
.dk-root .dk-pbox h5 { color: ${GOLD}; font-size: 9.6px; font-weight: 800; letter-spacing: .02em; margin: 8px 0 3px; text-transform: uppercase; }
.dk-pbox p { font-size: 8.8px; line-height: 1.38; color: #f1f1f1; } .dk-pbox p.s { margin-bottom: 3px; } .dk-pbox p.t { color: #f1f1f1; }
`;
