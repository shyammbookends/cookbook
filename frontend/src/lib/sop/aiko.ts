import { parseSopSections, isTotalRow, type SopItem, type SopSection } from "@/lib/sop/sections";

/**
 * The Aiko Kitchen "DISH SOP" card: black header with photo, cream
 * ingredients/method band, black quality & plating band, gold accents.
 *
 * Built as an HTML string (plus AIKO_CSS) so the web page, the admin live
 * preview and the printable PDF all render the exact same markup. Laid out
 * at A4 size (794 × 1123 CSS px); callers scale it to fit one page.
 */

/** Optional per-recipe tweaks of the standard Aiko card, kept in `customFields.aiko`. */
export interface AikoOpts {
  /** Replaces the header stat labels (e.g. portion → "YIELD", service → "BAKE"). */
  statLabels?: Partial<Record<"type" | "diet" | "portion" | "service" | "allergens", string>>;
  /** Replaces "INGREDIENTS" / "(NET WEIGHTS — 1 PORTION)" above the ingredient list. */
  ingHeading?: string;
  ingSub?: string | null;
  /** Number of ingredient groups that stay in the first column; the rest flow into a second one. */
  ingSplitAt?: number;
  /** Method numbering keeps counting across titled sections instead of restarting. */
  continuousSteps?: boolean;
}

export function aikoOptsOf(customFields: unknown): AikoOpts | null {
  const a = (customFields as { aiko?: unknown } | null | undefined)?.aiko;
  return a && typeof a === "object" ? (a as AikoOpts) : null;
}

export interface AikoCardData {
  title: string;
  subtitle: string | null;
  description: string | null;
  dishType: string | null;
  diet: string | null;
  yieldText: string | null;
  service: string | null;
  allergens: string | null;
  dishCode: string | null;
  author: string | null;
  approvedBy: string | null;
  station: string | null;
  versionLabel: string;
  brandName: string;
  heroUrl: string | null;
  ingredients: { name: string; quantity: number | null; unit: string | null; groupLabel?: string | null }[];
  steps: { title: string | null; body: string }[];
  qualityCheck: string[];
  plating: string | null;
  sopSections: string | null;
  opts?: AikoOpts | null;
}

export const AIKO_PAGE = { width: 794, height: 1123 } as const;

export const AIKO_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600&family=Nunito+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap";

const esc = (s: string | number | null | undefined) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const lines = (s: string | null | undefined) => (s ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

const svg = (paths: string, cls = "") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const ICON = {
  type: svg('<path d="M12 22c4 0 7-2.7 7-6.8 0-3.1-1.9-5.5-3.6-7.4-.3 1.7-1.2 3-2.4 3.6.2-3.4-1.2-6.8-4.2-9.4.3 3.6-1.4 5.7-3.1 7.7C4.4 11.4 5 14 5 15.2 5 19.3 8 22 12 22z" fill="currentColor" stroke="none"/>'),
  diet: svg('<path d="M20 4C11 4 5 9 5 16c0 1.4.3 2.6.8 3.6"/><path d="M20 4c0 9-5 15-12 15"/><path d="M5.8 19.6 14 11"/>'),
  portion: svg('<path d="M3 13h18a9 9 0 0 1-18 0z"/><path d="M8 13c0-2.2 1.8-4 4-4s4 1.8 4 4"/><path d="M10 7.5a2 2 0 1 1 4 0"/><path d="M8 22h8"/>'),
  service: svg('<path d="M3 14h18a9 9 0 0 1-18 0z"/><path d="M9 4c-1 1 1 2 0 3.5M12 3c-1 1 1 2 0 3.5M15 4c-1 1 1 2 0 3.5"/><path d="M7 22h10"/>'),
  allergens: svg('<circle cx="12" cy="12" r="9.5"/><path d="M5.5 18.5 18.5 5.5"/><path d="M12 7v10M9.5 9.5 12 12l2.5-2.5M9.5 13.5 12 16l2.5-2.5"/>'),
  check: svg('<circle cx="12" cy="12" r="9.5"/><path d="m7.5 12.3 3 3 6-6.3"/>', "ak-check-icon"),
  ornament: svg(
    '<circle cx="12" cy="7.2" r="4.2"/><circle cx="12" cy="16.8" r="4.2"/><circle cx="7.2" cy="12" r="4.2"/><circle cx="16.8" cy="12" r="4.2"/><circle cx="12" cy="12" r="1.6"/>',
  ),
};

/**
 * Splits a title into the card's one or two display lines and sizes it to
 * fill the intro column, like the printed Aiko SOPs: short names run large,
 * long ones break over two lines and shrink.
 */
export function aikoTitleLines(title: string): { lines: string[]; size: number } {
  const t = title.trim().replace(/\s+/g, " ");
  const words = t.split(" ");
  let lines = [t];
  if (t.length > 12 && words.length > 1) {
    const rest = words.slice(1).join(" ");
    if (rest.length <= 17) lines = [words[0], rest];
    else {
      let best = lines;
      let score = Infinity;
      for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i).join(" ");
        const b = words.slice(i).join(" ");
        const sc = Math.max(a.length, b.length - 1.5);
        if (sc < score) [score, best] = [sc, [a, b]];
      }
      lines = best;
    }
  }
  const longest = Math.max(...lines.map((l) => l.length), 1);
  const size = Math.round(Math.max(26, Math.min(64, 322 / (0.66 * longest))));
  return { lines, size };
}

function dataField(editable: boolean, field: string) {
  return editable ? ` data-field="${esc(field)}"` : "";
}

function qty(i: AikoCardData["ingredients"][number]) {
  return [i.quantity ?? "", i.unit ?? ""].join(" ").trim();
}

function renderItems(items: SopItem[]) {
  return items
    .map((it) => {
      switch (it.kind) {
        case "head":
          return `<div class="ak-row ak-row-head"><span>${esc(it.label)}</span><span>${esc(it.value)}</span></div>`;
        case "row":
          return `<div class="ak-row${it.strong ? " ak-row-total" : ""}"><span>${esc(it.label)}</span><span>${esc(it.value)}</span></div>`;
        case "sub":
          return `<div class="ak-sub">${esc(it.text)}</div>`;
        case "note":
          return `<p class="ak-note">${esc(it.text)}</p>`;
        case "bullet":
          return `<p class="ak-bullet">${esc(it.text)}</p>`;
        default:
          return `<p class="ak-text">${esc(it.text)}</p>`;
      }
    })
    .join("");
}

function heading(title: string, subtitle: string | null, field: string, editable: boolean) {
  return `<div class="ak-h"${dataField(editable, field)}>${title ? `<div class="ak-h-title">${esc(title)}</div>` : ""}${
    subtitle ? `<div class="ak-h-sub">${esc(subtitle)}</div>` : ""
  }<i class="ak-rule"></i></div>`;
}

function renderPanel(s: SopSection, editable: boolean) {
  return `<div class="ak-panel">${s.title || s.subtitle ? heading(s.title, s.subtitle, "sopSections", editable) : ""}<div${dataField(editable, "sopSections")}>${renderItems(s.items)}</div></div>`;
}

function renderIngredients(d: AikoCardData, editable: boolean, above = "", below = "") {
  const split = d.opts?.ingSplitAt ?? 0;
  const groupStarts: number[] = [];
  d.ingredients.forEach((ing, i) => {
    if (i === 0 || (ing.groupLabel ?? "") !== (d.ingredients[i - 1].groupLabel ?? "")) groupStarts.push(i);
  });
  const cut = split && split < groupStarts.length ? groupStarts[split] : d.ingredients.length;
  const renderRows = (from: number, to: number) => d.ingredients
    .map((ing, i) => ({ ing, i }))
    .filter(({ i }) => i >= from && i < to)
    .map(({ ing, i }) => {
      // "> text" rows are italic notes under a group heading.
      if (ing.name.startsWith("> ")) {
        const g = ing.groupLabel && ing.groupLabel !== d.ingredients[i - 1]?.groupLabel ? `<div class="ak-sub${i > 0 ? " ak-gap" : ""}">${esc(ing.groupLabel)}</div>` : "";
        return `${g}<p class="ak-note"${dataField(editable, `ingredients.${i}`)}>${esc(ing.name.slice(2))}</p>`;
      }
      let group = "";
      if (ing.groupLabel && ing.groupLabel !== d.ingredients[i - 1]?.groupLabel) {
        // "Label | Gram" is a table header row; a plain label is a gold sub-heading.
        const [label, value] = ing.groupLabel.split("|").map((s) => s.trim());
        group =
          value !== undefined
            ? `<div class="ak-row ak-row-head${i > 0 ? " ak-gap" : ""}"><span>${esc(label)}</span><span>${esc(value)}</span></div>`
            : `<div class="ak-sub${i > 0 ? " ak-gap" : ""}">${esc(label)}</div>`;
      }
      const total = isTotalRow(ing.name);
      return `${group}<div class="ak-row${total ? " ak-row-total" : ""}"${dataField(editable, `ingredients.${i}`)}><span>${esc(ing.name)}</span><span>${esc(qty(ing))}</span></div>`;
    })
    .join("");
  const title = d.opts?.ingHeading ?? "INGREDIENTS";
  const sub = d.opts?.ingHeading ? (d.opts.ingSub ?? null) : "(NET WEIGHTS — 1 PORTION)";
  const first = `<div class="ak-col ak-col-ing">${above}${heading(title, sub, "ingredients", editable)}<div class="ak-list">${renderRows(0, cut)}</div>${below}</div>`;
  if (cut >= d.ingredients.length) return first;
  return `${first}<div class="ak-col ak-col-ing"><div class="ak-h ak-h-spacer"><i class="ak-rule"></i></div><div class="ak-list">${renderRows(cut, d.ingredients.length)}</div></div>`;
}

function renderMethod(d: AikoCardData, editable: boolean) {
  let n = 0;
  const dense = d.steps.length > 8;
  const body = d.steps
    .map((s, i) => {
      if (s.title && !d.opts?.continuousSteps) n = 0;
      n += 1;
      // "Method — …" headings read as a second method block; others as gold sub-steps.
      const title = s.title ? `<div class="ak-step-title${/^method\b/i.test(s.title) ? " ak-step-title-major" : ""}">${esc(s.title)}</div>` : "";
      const text = lines(s.body).map(esc).join("<br>");
      return `${title}<div class="ak-step"${dataField(editable, `steps.${i}`)}><span class="ak-num">${String(n).padStart(2, "0")}</span><p>${text}</p></div>`;
    })
    .join("");
  return `<div class="ak-col ak-col-method${dense ? " ak-dense" : ""}">${heading("METHOD (EXECUTION)", null, "steps", editable)}${body}</div>`;
}

function renderPlating(d: AikoCardData, editable: boolean) {
  const ls = lines(d.plating);
  if (ls.length === 0) return `<p class="ak-closing"${dataField(editable, "plating")}>N/A</p>`;
  if (ls.length === 1) return `<p class="ak-closing ak-closing-only"${dataField(editable, "plating")}>${esc(ls[0])}</p>`;
  const bullets = ls.slice(0, -1).map((l) => `<li>${esc(l.replace(/^[-•]\s*/, ""))}</li>`).join("");
  return `<div${dataField(editable, "plating")}><ul class="ak-dots">${bullets}</ul><p class="ak-closing">${esc(ls[ls.length - 1])}</p></div>`;
}

/** The card's inner markup (without the page wrapper). */
export function aikoCardHtml(d: AikoCardData, { editable = false } = {}): string {
  const f = (field: string) => dataField(editable, field);
  const title = aikoTitleLines(d.title || "Untitled recipe");
  const sections = parseSopSections(d.sopSections);
  const by = (place: SopSection["place"]) => sections.filter((s) => s.place === place);
  const lead = by("lead");
  const mid = by("mid");
  const side = by("side");
  const above = by("above");
  const below = by("below");
  const bottom = by("bottom");

  // Column widths for whichever of lead | ingredients | mid | method | side are present.
  const cols = [
    ...(lead.length ? ["0.95fr"] : []),
    "1fr",
    ...(d.opts?.ingSplitAt ? ["1fr"] : []),
    ...(mid.length ? ["1fr"] : []),
    side.length || lead.length || mid.length ? "1.25fr" : "1.55fr",
    ...(side.length ? ["0.95fr"] : []),
  ].join(" ");

  const L = d.opts?.statLabels ?? {};
  const stat = (icon: string, label: string, value: string | null, field: string, upper = true) =>
    `<div class="ak-stat"${f(field)}>${icon}<b>${label}</b><span${upper ? ' class="ak-up"' : ""}>${esc(value || "—")}</span></div>`;

  const photo = d.heroUrl
    ? `<img src="${esc(d.heroUrl)}" alt="${esc(d.title)}">`
    : `<span class="ak-photo-empty">${editable ? "Click to add a hero image" : ""}</span>`;

  const compact = sections.length > 0 && (mid.length + lead.length + bottom.length > 0 || d.steps.length > 8);
  return `${compact ? '<div class="ak-compact" hidden></div>' : ""}
<div class="ak-top">
  <div class="ak-intro">
    <div class="ak-eyebrow"${f("brandId")}>${esc(d.brandName)} Kitchen</div>
    <i class="ak-rule ak-rule-top"></i>
    <div class="ak-title"${f("title")} style="font-size:${title.size}px">${title.lines.map(esc).join("<br>")}</div>
    ${d.subtitle ? `<div class="ak-subtitle"${f("subtitle")}>${esc(d.subtitle)}</div>` : ""}
    <div class="ak-sop">– Dish SOP</div>
    ${d.description || editable ? `<p class="ak-desc"${f("description")}>${esc(d.description || "Add a description…")}</p>` : ""}
    <div class="ak-stats">
      ${stat(ICON.type, L.type ?? "Type", d.dishType, "dishType")}
      ${stat(ICON.diet, L.diet ?? "Dietary", d.diet, "dietary")}
      ${stat(ICON.portion, L.portion ?? "Portion", d.yieldText, "yieldText", false)}
      ${stat(ICON.service, L.service ?? "Service", d.service, "service")}
      ${stat(ICON.allergens, L.allergens ?? "Allergens", d.allergens, "allergens")}
    </div>
    <div class="ak-meta">
      <div class="ak-meta-row"${f("dishCode")}><b>Dish code</b><span>${esc(d.dishCode || "N/A")}</span></div>
      <div class="ak-meta-row"${f("author")}><b>Author</b><span>${esc(d.author || `${d.brandName} Kitchen`)}</span></div>
      <div class="ak-meta-row"${f("approvedBy")}><b>Approved by</b><span>${esc(d.approvedBy || "N/A")}</span></div>
      ${
        d.station
          ? `<div class="ak-meta-foot"><span${f("station")}><b>Station</b>${esc(d.station)}</span><span${f("sopVersion")}><b>Version</b><em>v${esc(d.versionLabel)}</em></span></div>`
          : ""
      }
    </div>
  </div>
  <div class="ak-photo"${f("heroImageId")}>${photo}</div>
</div>

<div class="ak-cream">
  <div class="ak-grid" style="grid-template-columns:${cols}">
    ${lead.length ? `<div class="ak-col">${lead.map((s) => renderPanel(s, editable)).join("")}</div>` : ""}
    ${renderIngredients(d, editable, above.map((s) => renderPanel(s, editable)).join(""), below.map((s) => renderPanel(s, editable)).join(""))}
    ${mid.length ? `<div class="ak-col">${mid.map((s) => renderPanel(s, editable)).join("")}</div>` : ""}
    ${renderMethod(d, editable)}
    ${side.length ? `<div class="ak-col">${side.map((s) => renderPanel(s, editable)).join("")}</div>` : ""}
  </div>
  ${bottom.length ? `<div class="ak-bottom" style="grid-template-columns:repeat(${bottom.length},1fr)">${bottom.map((s) => `<div class="ak-col">${renderPanel(s, editable)}</div>`).join("")}</div>` : ""}
</div>

<div class="ak-band">
  <div class="ak-band-grid">
    <div${f("qualityCheck")}>
      <div class="ak-band-h">Quality Check Points</div>
      <ul class="ak-checks">${
        d.qualityCheck.length
          ? d.qualityCheck.map((q, i) => `<li${f(`qualityCheck.${i}`)}>${ICON.check}<span>${esc(q)}</span></li>`).join("")
          : `<li>${ICON.check}<span>N/A</span></li>`
      }</ul>
    </div>
    <div class="ak-band-plating">
      <div class="ak-band-h">Plating &amp; Service</div>
      <i class="ak-rule"></i>
      ${renderPlating(d, editable)}
    </div>
  </div>
  <div class="ak-foot">
    <span class="ak-logo"><span class="ak-logo-a">A</span><span class="ak-logo-word"><b>${esc(d.brandName)}</b><small>Kitchen</small></span></span>
    <i class="ak-foot-line"></i>
    <span class="ak-ornament">${ICON.ornament}</span>
  </div>
</div>`;
}

/** A section cover page in the Aiko style (category PDF download). */
export function aikoCoverHtml(opts: { number: number; categoryName: string; description: string | null; brandName: string }) {
  return `
<div class="ak-cover">
  <div class="ak-cover-frame">
    <div class="ak-cover-num">${String(opts.number).padStart(2, "0")}</div>
    <i class="ak-cover-rule"></i>
    <div class="ak-cover-title">${esc(opts.categoryName)}</div>
    ${opts.description ? `<p class="ak-cover-desc">${esc(opts.description)}</p>` : ""}
    <div class="ak-cover-foot">
      <b>${esc(opts.brandName)} Kitchen</b>
      <span>Bookend's Hospitality</span>
      <small>Premium recipe section</small>
    </div>
  </div>
</div>`;
}

const GOLD = "#D09A3E";

export const AIKO_CSS = `
.ak-root { width: 100%; min-height: 100%; display: flex; flex-direction: column; background: #0B0B0B; color: #fff;
  font-family: "Nunito Sans", system-ui, sans-serif; -webkit-font-smoothing: antialiased; line-height: 1.4; text-align: left; }
.ak-root *, .ak-root *::before, .ak-root *::after { box-sizing: border-box; }
.ak-root p { margin: 0; }
.ak-root ul { margin: 0; padding: 0; list-style: none; }
.ak-root svg { display: block; }
.ak-up { text-transform: uppercase; }
.ak-rule { display: block; width: 42px; height: 2px; background: ${GOLD}; margin: 12px 0 14px; }

.ak-top { display: grid; grid-template-columns: 48% 52%; min-height: 610px; }
.ak-intro { padding: 34px 18px 26px 34px; display: flex; flex-direction: column; }
.ak-eyebrow { color: ${GOLD}; font-size: 15px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
.ak-rule-top { margin: 12px 0 26px; }
.ak-title { font-family: "EB Garamond", Georgia, serif; font-weight: 500; font-size: 49px; line-height: 1.05; letter-spacing: .01em;
  text-transform: uppercase; color: #F6F1E9; overflow-wrap: anywhere; }
.ak-subtitle { font-family: "EB Garamond", Georgia, serif; font-weight: 500; font-size: 25px; color: ${GOLD}; text-transform: uppercase; margin-top: 8px; }
.ak-sop { font-family: "EB Garamond", Georgia, serif; font-weight: 500; font-size: 30px; color: ${GOLD}; text-transform: uppercase; margin-top: 8px; letter-spacing: .02em; }
.ak-root .ak-desc { margin-top: 22px; font-size: 15px; line-height: 1.52; color: #EFE9E1; max-width: 345px; white-space: pre-line; }
.ak-stats { display: grid; grid-template-columns: repeat(5, 1fr); margin-top: 26px; }
.ak-stat { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 3px; }
.ak-stat + .ak-stat { border-left: 1px solid rgba(208,154,62,.55); }
.ak-stat svg { width: 27px; height: 27px; color: ${GOLD}; }
.ak-stat b { font-weight: 400; font-size: 9.5px; letter-spacing: .05em; text-transform: uppercase; margin-top: 11px; }
.ak-stat span { font-size: 9.5px; letter-spacing: .03em; margin-top: 7px; line-height: 1.45; }
.ak-meta { margin-top: 20px; border: 1.5px solid ${GOLD}; padding: 18px 20px 16px; display: flex; flex-direction: column; gap: 16px; }
.ak-meta-row { display: grid; grid-template-columns: 136px 1fr; align-items: baseline; }
.ak-meta-row b { color: ${GOLD}; font-size: 14px; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; }
.ak-meta-row span { font-size: 12.5px; letter-spacing: .02em; white-space: nowrap; text-transform: uppercase; }
.ak-meta-foot { display: flex; gap: 40px; font-size: 9px; text-transform: uppercase; letter-spacing: .04em; margin-top: 4px; }
.ak-meta-foot em { font-style: normal; text-transform: none; }
.ak-meta-foot b { color: ${GOLD}; font-weight: 700; margin-right: 22px; }
.ak-photo { position: relative; overflow: hidden; background: #151515; }
.ak-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.ak-photo-empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,.5); font-size: 14px; }

.ak-cream { flex: 1; background: #F3EDE4; color: #262626; padding: 26px 34px 20px; display: flex; flex-direction: column; gap: 18px; }
.ak-grid { display: grid; align-items: start; flex: 1; }
.ak-grid > .ak-col { padding: 0 22px; min-width: 0; height: 100%; }
.ak-grid > .ak-col:first-child { padding-left: 0; }
.ak-grid > .ak-col:last-child { padding-right: 0; }
.ak-grid > .ak-col + .ak-col { border-left: 1px solid rgba(208,154,62,.8); }
.ak-h-title { font-family: "EB Garamond", Georgia, serif; font-weight: 500; font-size: 21px; letter-spacing: .02em; color: #161616; line-height: 1.12; }
.ak-h-sub { font-size: 11.5px; letter-spacing: .03em; color: #3A3A3A; margin-top: 5px; }
.ak-list { display: flex; flex-direction: column; }
.ak-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; padding: 6.5px 0; font-size: 13px;
  border-bottom: 1px solid #D8CFC2; }
.ak-row span:last-child { text-align: right; white-space: nowrap; }
.ak-row-head { font-weight: 800; font-size: 12px; border-bottom: 1.5px solid #BFB4A5; }
.ak-h-spacer { min-height: 20px; }
.ak-col-ing > .ak-note { margin: 2px 0 6px; }
.ak-row-total { font-weight: 800; font-size: 13.5px; border-bottom: 0; border-top: 1.5px solid #BFB4A5; margin-top: 8px; padding-top: 10px; }
.ak-row-total + .ak-row-total { border-top: 0; margin-top: 2px; }
.ak-gap { margin-top: 16px; }
.ak-step-title { color: ${GOLD}; font-weight: 700; font-size: 12.5px; margin: 10px 0 3px; }
.ak-h + .ak-step-title { margin-top: 0; }
.ak-step-title-major { font-family: "EB Garamond", Georgia, serif; font-weight: 500; font-size: 16px; letter-spacing: .02em; text-transform: uppercase; color: #161616; margin: 16px 0 8px; }
.ak-step { display: grid; grid-template-columns: 36px 1fr; align-items: baseline; margin-bottom: 15px; }
.ak-num { font-family: "EB Garamond", Georgia, serif; color: ${GOLD}; font-size: 21px; line-height: 1; }
.ak-step p { font-size: 13px; line-height: 1.5; max-width: 360px; }
.ak-dense .ak-step { margin-bottom: 7px; grid-template-columns: 28px 1fr; }
.ak-dense .ak-num { font-size: 16px; }
.ak-dense .ak-step p { font-size: 12px; line-height: 1.4; }
.ak-panel + .ak-panel { margin-top: 18px; }
.ak-panel .ak-h-title { font-size: 18px; }
.ak-panel .ak-row { font-size: 12px; padding: 5px 0; }
.ak-panel .ak-row-head { font-size: 11.5px; }
.ak-sub { color: ${GOLD}; font-weight: 700; font-size: 12.5px; letter-spacing: .02em; margin: 14px 0 4px; }
.ak-panel .ak-sub:first-child, .ak-list .ak-sub:first-child { margin-top: 0; }
.ak-list .ak-sub.ak-gap { margin-top: 16px; }
.ak-root .ak-note { font-style: italic; font-size: 12.5px; line-height: 1.5; margin-top: 12px; color: #333; }
.ak-root .ak-text { font-size: 12.5px; line-height: 1.5; color: #333; margin-top: 4px; }
.ak-root .ak-bullet { font-size: 12.5px; line-height: 1.5; padding-left: 14px; position: relative; margin-top: 3px; }
.ak-bullet::before { content: ""; position: absolute; left: 2px; top: .62em; width: 5px; height: 5px; border-radius: 50%; background: ${GOLD}; }
.ak-col-ing > .ak-panel:first-child { margin-bottom: 18px; }
.ak-col-ing > .ak-list + .ak-panel { margin-top: 18px; }
.ak-bottom { display: grid; border-top: 1px solid rgba(208,154,62,.8); padding-top: 16px; }
.ak-bottom > .ak-col { padding: 0 20px; min-width: 0; }
.ak-bottom > .ak-col:first-child { padding-left: 0; }
.ak-bottom > .ak-col + .ak-col { border-left: 1px solid rgba(208,154,62,.8); }
.ak-bottom .ak-rule { display: none; }
.ak-bottom .ak-h-title { font-size: 15px; margin-bottom: 8px; }

.ak-band { background: #0B0B0B; padding: 20px 34px 14px; }
.ak-band-grid { display: grid; grid-template-columns: 1fr 1.25fr; }
.ak-band-grid > div + div { border-left: 1px solid rgba(208,154,62,.8); padding-left: 36px; }
.ak-band-h { font-family: "EB Garamond", Georgia, serif; font-weight: 500; font-size: 18px; letter-spacing: .04em; text-transform: uppercase; color: ${GOLD}; }
.ak-band-plating .ak-rule { margin: 8px 0 14px; }
.ak-checks { margin-top: 10px !important; display: flex; flex-direction: column; gap: 5px; padding-right: 20px !important; }
.ak-checks li { display: flex; gap: 9px; align-items: flex-start; font-size: 13px; line-height: 1.35; }
.ak-check-icon { width: 15px; height: 15px; color: ${GOLD}; flex-shrink: 0; margin-top: 1px; }
.ak-dots li { position: relative; padding-left: 18px; font-size: 13.5px; line-height: 1.45; margin-bottom: 3px; }
.ak-dots li::before { content: ""; position: absolute; left: 3px; top: .58em; width: 6px; height: 6px; border-radius: 50%; background: ${GOLD}; }
.ak-closing { font-size: 13.5px; border-top: 1px solid rgba(208,154,62,.8); margin-top: 12px !important; padding-top: 12px; max-width: 350px; }
.ak-closing-only { border-top: 0; margin-top: 0 !important; padding-top: 0; }
.ak-foot { display: flex; align-items: center; margin-top: 12px; }
.ak-logo { display: inline-flex; align-items: center; gap: 12px; color: ${GOLD}; }
.ak-logo-a { width: 46px; height: 46px; border-radius: 50%; border: 1.5px solid ${GOLD}; display: inline-flex; align-items: center; justify-content: center;
  font-family: "EB Garamond", Georgia, serif; font-size: 27px; line-height: 1; }
.ak-logo-word { display: inline-flex; flex-direction: column; align-items: center; }
.ak-logo-word b { font-family: "EB Garamond", Georgia, serif; font-weight: 500; font-size: 31px; letter-spacing: .24em; text-transform: uppercase; line-height: 1; margin-right: -.24em; }
.ak-logo-word small { font-size: 9px; letter-spacing: .42em; text-transform: uppercase; margin-top: 3px; margin-right: -.42em; }
.ak-foot-line { flex: 1; height: 1px; background: rgba(208,154,62,.8); margin: 0 26px; }
.ak-ornament svg { width: 36px; height: 36px; color: ${GOLD}; }

.ak-cover { width: 100%; height: 100%; background: #0B0B0B; padding: 40px; }
.ak-cover-frame { height: 100%; border: 1.5px solid #D4AF37; padding: 60px 40px 40px; display: flex; flex-direction: column; }
.ak-cover-num { font-family: "EB Garamond", Georgia, serif; font-weight: 600; font-size: 72px; color: #D4AF37; line-height: 1; }
.ak-cover-rule { display: block; height: 1px; background: #D4AF37; margin: 26px 0 40px; }
.ak-cover-title { font-family: "Nunito Sans", sans-serif; font-weight: 800; font-size: 76px; letter-spacing: .02em; text-transform: uppercase; color: #F5F2EA; line-height: 1; }
.ak-cover-desc { font-family: "EB Garamond", Georgia, serif; font-size: 22px; color: #E8E3D8; margin-top: 26px; }
.ak-cover-foot { margin-top: auto; display: flex; flex-direction: column; gap: 6px; }
.ak-cover-foot b { color: #D4AF37; font-size: 17px; letter-spacing: .04em; text-transform: uppercase; }
.ak-cover-foot span { color: #F5F2EA; font-size: 15px; }
.ak-cover-foot small { color: #BDBDBD; font-size: 13px; }

/* Dense cards (sub-recipe panels, long methods) — flagged by a leading .ak-compact
   marker because callers own the root element — tighten up so less scaling is needed. */
.ak-compact ~ .ak-top { min-height: 470px; }
.ak-compact ~ .ak-top .ak-intro { padding-top: 26px; padding-bottom: 20px; }
.ak-compact ~ .ak-top .ak-rule-top { margin-bottom: 18px; }
.ak-compact ~ .ak-top .ak-desc { margin-top: 14px; font-size: 14px; }
.ak-compact ~ .ak-top .ak-stats { margin-top: 18px; }
.ak-compact ~ .ak-top .ak-meta { margin-top: 16px; padding: 14px 18px 12px; gap: 12px; }
.ak-compact ~ .ak-cream { padding-top: 20px; padding-bottom: 16px; gap: 14px; }
.ak-compact ~ .ak-cream .ak-row { padding: 4px 0; font-size: 12px; }
.ak-compact ~ .ak-cream .ak-panel .ak-row { padding: 3px 0; font-size: 11.5px; }
.ak-compact ~ .ak-cream .ak-rule { margin: 8px 0 10px; }
.ak-compact ~ .ak-cream .ak-h-title { font-size: 19px; }
.ak-compact ~ .ak-cream .ak-panel .ak-h-title { font-size: 16px; }
.ak-compact ~ .ak-cream .ak-step { margin-bottom: 9px; }
.ak-compact ~ .ak-cream .ak-dense .ak-step { margin-bottom: 5px; }
.ak-compact ~ .ak-band { padding-top: 16px; }
.ak-compact ~ .ak-band .ak-checks li { font-size: 12.5px; }

.ak-root [data-field] { cursor: pointer; }
`;
