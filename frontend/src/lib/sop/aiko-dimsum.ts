/**
 * The Aiko Kitchen DIM SUM card: a second Aiko layout used only for the
 * Dim Sum category. Black header with photo, then Summary / Key Highlights /
 * QC Check Points / Serving, an Ingredients | Method box, guide panels,
 * QC & Quality Markers | Faults & Fixes and a Mise en place | Holding |
 * Service notes | Plating row, closed by a black footer bar.
 *
 * Built as an HTML string (plus DIMSUM_CSS) so the web page, the admin live
 * preview and the printable PDF share the exact same markup. Laid out at A4
 * size (794 × 1123 CSS px); callers scale it to fit one page.
 *
 * Fields that have no column of their own live in `customFields.dimsum`.
 */

export const DIMSUM_CATEGORIES = ["dim-sum", "dimsum", "dim sum", "sushi", "rice", "noodles"];

export function isDimsumStyle(template: string, categorySlug: string | null | undefined): boolean {
  return template === "aiko" && !!categorySlug && DIMSUM_CATEGORIES.includes(categorySlug.toLowerCase());
}

export type DimsumIcon = "fill" | "half" | "pleat" | "pleated" | "sealed" | "peak" | "bun" | "slit";

export interface DimsumGuide {
  title: string;
  bullets?: string[];
  /** Picture steps ("1. Place filling in center.") instead of bullets. */
  steps?: { icon: DimsumIcon; label: string }[];
  /** Icon shown beside the guide (side column, or the row layout with `iconGuides`). */
  icon?: GuideIcon;
}

export type GuideIcon = "noodle" | "wok" | "spice" | "garlic" | "mushroom" | "truffle" | "box" | "steamer" | "sauce" | "plating" | "roll" | "rice" | "bottle" | "knife" | "filling" | "corn" | "fry" | "topping" | "pan" | "fridge";

export interface DimsumTable {
  title: string;
  yield?: string;
  rows: [string, string][];
  total?: [string, string];
  bullets?: string[];
  headers?: [string, string];
}

export interface DimsumExtras {
  /** Values under the five header icons (any may be empty). */
  strip?: { type?: string; dietary?: string; portion?: string; service?: string; allergens?: string };
  summary?: [label: string, value: string][];
  highlights?: string[];
  serving?: string[];
  /** Ingredient tables. Groups render in the given column layout (default: stacked in one column). */
  ingHeading?: string;
  ingPill?: boolean;
  /** Column headers per group label ("" = ungrouped); default ["Ingredients", "Gram"]. */
  ingHeaders?: Record<string, [string, string]>;
  /** Group labels per column, e.g. [["A. FILLING","OTHERS"],["B. SAUCE"]]. */
  ingColumns?: string[][];
  ingGroupStyle?: "orange" | "center";
  /** Ingredients printed as running text per group ("Cook 1: Oil 20 g; …") instead of tables. */
  ingStages?: boolean;
  methodHeading?: string;
  methodPill?: boolean;
  methodStyle?: "numbers" | "plain" | "sections-num" | "sections-bullets";
  guides?: DimsumGuide[];
  /** "row": a box under the method; "side": stacked column right of the method. */
  guidesLayout?: "row" | "side";
  dip?: { title: string; items: string[] };
  components?: { title: string; cols: { title: string; text: string }[] };
  qcMarkers?: string[];
  faults?: [string, string][];
  serviceNotes?: string[];
  footer?: string;
  /** Sushi: a line under the header ("QC a • b • c", "Portion: 8 pcs", "SERVICE …"). */
  headLine?: { qc?: string[]; portion?: string; service?: string };
  /** Guides in the row layout get a big icon beside them (sushi). */
  iconGuides?: boolean;
  /** false: the header icons carry no text (Avo Crispy Rice). */
  stripLabels?: boolean;
  /** Replaces the five default header icons (Rice: Station / Dietary / Portion / Service / Allergens). */
  stripItems?: { icon: "wok" | "leaf" | "cloche" | "flame" | "noallergen" | "type" | "diet" | "portion" | "service" | "allergens" | "snow"; label: string; value: string }[];
  /** Small tag at the top right of the photo, e.g. "R-002 | Station: Wok". */
  tag?: string;
  /** The head line stacks under the details box instead of splitting under the photo. */
  headStack?: boolean;
  /** Method as a left-to-right flow of steps with a wok picture and arrows between them (Rice). */
  methodFlow?: boolean;
  /** Fault table header, and Mise en place shown as the third column of the QC row. */
  faultHeader?: [string, string];
  miseInQc?: boolean;
  /** The simple Noodles / Ramen card: header + Dish Code box, Ingredients | Method, Chef Notes | Service. */
  ramen?: {
    ingStyle: "bullets" | "table";
    methodStyle: "plain" | "circles";
    chefNotes?: string[];
    service?: string;
    /** Small bullet lines under the Dish Code box (page leftovers like "No oil pooling"). */
    under?: string[];
    /** Heading rows inside the ingredient table, keyed by the ingredient name they precede. */
    heads?: Record<string, string>;
  };
  /** Award / wrench icons in the QC & Faults row, and icons over the bottom columns (sushi). */
  qcIcons?: boolean;
  lowIcons?: boolean;
  /** Titled method sections flow into this many sections in the first column, the rest in a second. */
  methodSplit?: number;
  /** Ingredient list plus component tables (Avo Crispy Rice): tables fill the right of the ingredients box; the method sits below in columns. */
  compTables?: DimsumTable[];
  compHeading?: string;
  methodWide?: boolean;
  /** Hides rows from the lower columns that the PDF doesn't have (default: show all that have data). */
}

export function dimsumExtrasOf(customFields: unknown): DimsumExtras | null {
  const d = (customFields as { dimsum?: unknown } | null | undefined)?.dimsum;
  return d && typeof d === "object" ? (d as DimsumExtras) : null;
}

export interface DimsumCardData {
  title: string;
  description: string | null;
  brandName: string;
  heroUrl: string | null;
  dishCode: string | null;
  author: string | null;
  approvedBy: string | null;
  ingredients: { name: string; quantity: number | null; unit: string | null; groupLabel?: string | null }[];
  steps: { title: string | null; body: string }[];
  qualityCheck: string[];
  miseEnPlace: string[];
  equipment: string[];
  holding: string | null;
  plating: string | null;
  extras: DimsumExtras | null;
}

const esc = (s: string | number | null | undefined) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const lines = (s: string | null | undefined) => (s ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const field = (editable: boolean, name: string) => (editable ? ` data-field="${name}"` : "");

const svg = (body: string, cls = "") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const ICON = {
  type: svg('<path d="M12 22c4 0 7-2.7 7-6.8 0-3.1-1.9-5.5-3.6-7.4-.3 1.7-1.2 3-2.4 3.6.2-3.4-1.2-6.8-4.2-9.4.3 3.6-1.4 5.7-3.1 7.7C4.4 11.4 5 14 5 15.2 5 19.3 8 22 12 22z" fill="currentColor" stroke="none"/>'),
  diet: svg('<path d="M20 4C11 4 5 9 5 16c0 1.4.3 2.6.8 3.6"/><path d="M20 4c0 9-5 15-12 15"/><path d="M5.8 19.6 14 11"/>'),
  portion: svg('<path d="M3 13h18a9 9 0 0 1-18 0z"/><path d="M8 13c0-2.2 1.8-4 4-4s4 1.8 4 4"/><path d="M10 7.5a2 2 0 1 1 4 0"/><path d="M8 22h8"/>'),
  service: svg('<path d="M3 14h18a9 9 0 0 1-18 0z"/><path d="M9 4c-1 1 1 2 0 3.5M12 3c-1 1 1 2 0 3.5M15 4c-1 1 1 2 0 3.5"/><path d="M7 22h10"/>'),
  allergens: svg('<circle cx="12" cy="12" r="9.5"/><path d="M5.5 18.5 18.5 5.5"/><path d="M12 7v10M9.5 9.5 12 12l2.5-2.5M9.5 13.5 12 16l2.5-2.5"/>'),
  ornament: svg('<circle cx="12" cy="7.2" r="4.2"/><circle cx="12" cy="16.8" r="4.2"/><circle cx="7.2" cy="12" r="4.2"/><circle cx="16.8" cy="12" r="4.2"/><circle cx="12" cy="12" r="1.6"/>'),
  steamer: svg('<ellipse cx="12" cy="6" rx="8" ry="2.6"/><path d="M4 6v5c0 1.4 3.6 2.6 8 2.6s8-1.2 8-2.6V6M4 11v5c0 1.4 3.6 2.6 8 2.6s8-1.2 8-2.6v-5M10 3c-.6.8.6 1.2 0 2M14 3c-.6.8.6 1.2 0 2"/>'),
  sauce: svg('<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M14 11l5-7"/><path d="M8 21h8"/>'),
  wok: svg('<path d="M3 11h18c0 5-4 8-9 8s-9-3-9-8z"/><path d="M21 9l2-2M7 5c-.6.8.6 1.2 0 2M11 4c-.6.8.6 1.2 0 2M15 5c-.6.8.6 1.2 0 2"/><path d="M8 22c1-1 2.5-1 4-1s3 0 4 1"/>'),
  flame: svg('<path d="M12 22c4 0 7-2.7 7-6.8 0-3.1-1.9-5.5-3.6-7.4-.3 1.7-1.2 3-2.4 3.6.2-3.4-1.2-6.8-4.2-9.4.3 3.6-1.4 5.7-3.1 7.7C4.4 11.4 5 14 5 15.2 5 19.3 8 22 12 22z"/><path d="M12 22c-2 0-3.2-1.2-3.2-3 0-1.4 1.2-2.4 3.2-4.4 2 2 3.2 3 3.2 4.4 0 1.8-1.2 3-3.2 3z"/>'),
  noallergen: svg('<circle cx="12" cy="12" r="9.5"/><path d="M5.5 18.5 18.5 5.5"/><path d="M12 7v10M9.5 9.5 12 12l2.5-2.5M9.5 13.5 12 16l2.5-2.5"/>'),
  spice: svg('<path d="M8 8h8l1 4v9H7v-9z"/><path d="M9 4h6v4H9z"/><circle cx="10.5" cy="6" r=".5"/><circle cx="13" cy="6" r=".5"/><path d="M9 14h6"/>'),
  garlic: svg('<path d="M12 3c1 2 1 3 0 4M12 7c-5 1-8 5-7 9 1 3 4 5 7 5s6-2 7-5c1-4-2-8-7-9z"/><path d="M12 7c-2 3-2 9 0 14M12 7c2 3 2 9 0 14"/>'),
  mushroom: svg('<path d="M3 12a9 8 0 0 1 18 0z"/><path d="M9 12v3c0 2 1 4 3 4s3-2 3-4v-3"/><circle cx="8" cy="9" r=".8"/><circle cx="14" cy="8" r=".8"/>'),
  truffle: svg('<circle cx="9" cy="14" r="6"/><circle cx="16" cy="11" r="4.5"/><path d="M7 12l2 1M10 16l2-1M15 9l1.5 1M17 13l1-1"/>'),
  box: svg('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 11h18M10 14h4"/><path d="M5 7l2-3h10l2 3"/>'),
  roll: svg('<ellipse cx="12" cy="13" rx="9" ry="7"/><ellipse cx="12" cy="11" rx="9" ry="7"/><circle cx="12" cy="11" r="3.6"/><circle cx="12" cy="11" r="1.4"/>'),
  rice: svg('<path d="M3 13h18a9 9 0 0 1-18 0z"/><path d="M6 13c0-4 2.5-7 6-7s6 3 6 7"/><path d="M9 5c-.6.8.6 1.2 0 2M12 3.5c-.6.8.6 1.2 0 2M15 5c-.6.8.6 1.2 0 2"/><path d="M8 22h8"/>'),
  bottle: svg('<path d="M10 2h4v4l2 3v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z"/><path d="M8 12h8M8 17h8"/>'),
  knife: svg('<path d="M21 3L9 14.5l2.8 2.7C16.5 15.5 20.5 10 21 3z"/><path d="M9 14.5L3 21"/>'),
  snow: svg('<path d="M12 2v20M4.2 7l15.6 10M4.2 17L19.8 7"/><path d="M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5"/>'),
  filling: svg('<path d="M12 21c-4 0-7-3-7-7 0-3 3-6 7-9 4 3 7 6 7 9 0 4-3 7-7 7z"/><path d="M12 6c1 2 1 5 0 15M9 12c1 0 2 .5 3 2M15 11c-1 0-2 .5-3 2"/>'),
  corn: svg('<path d="M12 2c3 3 5 7 5 11 0 4-2 7-5 9-3-2-5-5-5-9 0-4 2-8 5-11z"/><path d="M9 8h6M8.5 12h7M9 16h6M12 4v16"/>'),
  fry: svg('<circle cx="11" cy="14" r="7"/><path d="M5 13h12M11 7v14"/><path d="M16 8l5-6"/>'),
  topping: svg('<path d="M3 12h18a9 9 0 0 1-18 0z"/><path d="M13 3l-4 7"/><circle cx="7" cy="16" r=".7"/><circle cx="12" cy="17" r=".7"/><circle cx="16" cy="15.5" r=".7"/>'),
  pan: svg('<ellipse cx="11" cy="14" rx="8" ry="4"/><path d="M19 13l3-2M7 11c.5-2 3.5-2 4-4"/>'),
  fridge: svg('<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M6 10h12M9 5v3M9 13v4"/>'),
  award: svg('<circle cx="12" cy="9" r="6.5"/><circle cx="12" cy="9" r="3.5"/><path d="M8.5 14.5L7 22l5-2.5 5 2.5-1.5-7.5"/>'),
  wrench: svg('<path d="M14.5 6.5a4 4 0 1 0-4 4L3 18l3 3 7.5-7.5a4 4 0 0 0 4-4l-2.5 2.5-2.5-.5-.5-2.5z"/>'),
  clipboard: svg('<path d="M8 4H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M8 11h1.5M8 15h1.5M8 19h1.5M11.5 11H16M11.5 15H16M11.5 19H16"/>'),
  noodle: svg('<path d="M3 13h18a9 9 0 0 1-18 0z"/><path d="M6 12c1-3 2-5 1-8M10 12c1-3 2-6 1-9M14 12c1-3 2-5 1-8M17 12c.5-2 1.5-3 1-5"/><path d="M8 22h8"/>'),
  hat: svg('<path d="M7 13a4 4 0 1 1 1.5-7.7A4.5 4.5 0 0 1 16 5.4 4 4 0 1 1 17 13v6H7v-6z"/><path d="M7 16h10"/>'),
  cloche: svg('<path d="M3 18h18M5 18a7 7 0 0 1 14 0M12 8V6M10.5 6h3"/>'),
  lotus: svg('<path d="M12 20c-3-1-6-4-6-8 3 0 5 2 6 4 1-2 3-4 6-4 0 4-3 7-6 8z"/><path d="M12 16c-2-2-2-6 0-10 2 4 2 8 0 10z"/>'),
  plating: svg('<circle cx="12" cy="13" r="8"/><circle cx="12" cy="13" r="4.5"/><circle cx="10.5" cy="12" r=".6"/><circle cx="13.5" cy="12.5" r=".6"/><circle cx="12" cy="15" r=".6"/>'),
};

/** Dumpling-folding pictograms for the wrapping / pleating / shaping guides. */
const STEP_ICON: Record<DimsumIcon, string> = {
  fill: '<ellipse cx="30" cy="22" rx="20" ry="16"/><circle cx="30" cy="22" r="9"/><circle cx="26" cy="19" r="1.4"/><circle cx="31" cy="18" r="1.4"/><circle cx="34" cy="23" r="1.4"/><circle cx="27" cy="25" r="1.4"/><circle cx="31" cy="26" r="1.4"/>',
  half: '<path d="M8 30C12 8 48 8 52 30"/><path d="M8 30c14 4 30 4 44 0"/><circle cx="30" cy="22" r="1.4"/>',
  pleat: '<path d="M6 32C10 8 50 8 54 32c-16 4-32 4-48 0z"/><path d="M14 20l3 8M20 16l2 12M27 14l1 14"/>',
  pleated: '<path d="M6 32C10 8 50 8 54 32c-16 4-32 4-48 0z"/><path d="M12 22l3 8M18 17l2 12M25 14l1 14M32 14l-1 14M39 16l-2 12M46 20l-3 9"/>',
  sealed: '<path d="M6 32C10 10 50 10 54 32c-16 5-32 5-48 0z"/><path d="M14 22l4 8M22 17l3 12M30 15v14M38 17l-3 12M46 22l-4 8"/><circle cx="30" cy="12" r="1.3"/>',
  peak: '<path d="M30 6l22 28c-14 6-30 6-44 0z"/><path d="M30 6v28M20 20l6 12M40 20l-6 12"/>',
  bun: '<path d="M30 8c-3 0-5 2-5 4C14 14 8 24 12 33c4 6 32 6 36 0 4-9-2-19-13-21 0-2-2-4-5-4z"/><path d="M22 18l4 14M30 14v18M38 18l-4 14"/>',
  slit: '<path d="M8 30C12 8 48 8 52 30c-16 4-32 4-44 0z"/><path d="M30 18c3 2 3 8 0 10-3-2-3-8 0-10z"/>',
};
const stepIcon = (k: DimsumIcon) => `<svg class="dm-pic" viewBox="0 0 60 40" fill="none" stroke="#222" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${STEP_ICON[k] ?? STEP_ICON.fill}</svg>`;

function list(items: string[] | undefined, editable = false, prefix = ""): string {
  if (!items?.length) return "";
  return `<ul class="dm-ul">${items.map((i, n) => `<li${prefix ? field(editable, `${prefix}.${n}`) : ""}>${esc(i)}</li>`).join("")}</ul>`;
}

function cell(ing: DimsumCardData["ingredients"][number]): string {
  const q = ing.quantity != null ? String(ing.quantity) : "";
  return esc([q, ing.unit ?? ""].filter(Boolean).join(" "));
}

function renderIngredients(d: DimsumCardData, editable: boolean): string {
  const x = d.extras ?? {};
  const groups: { label: string; rows: DimsumCardData["ingredients"] }[] = [];
  d.ingredients.forEach((ing) => {
    const label = ing.groupLabel ?? "";
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.rows.push(ing);
    else groups.push({ label, rows: [ing] });
  });
  const heading = `<h3 class="dm-h${x.ingPill ? " dm-pill" : ""}"${field(editable, "ingredients")}>${esc(x.ingHeading || "INGREDIENTS")}</h3>`;

  if (x.ingStages) {
    return `<div class="dm-ing">${heading}${groups
      .map(
        (g) =>
          `<p class="dm-stage"><b>${esc(g.label)}</b> ${g.rows.map((r) => esc([r.name, cell(r)].filter(Boolean).join(" "))).join("; ")}.</p>`,
      )
      .join("")}</div>`;
  }

  const table = (g: (typeof groups)[number]) => {
    const [h1, h2] = x.ingHeaders?.[g.label] ?? x.ingHeaders?.[""] ?? ["Ingredients", "Gram"];
    const title = g.label ? `<div class="dm-gl ${x.ingGroupStyle === "center" ? "c" : ""}">${esc(g.label)}</div>` : "";
    return `${title}<table class="dm-t">${h1 || h2 ? `<tr><th>${esc(h1)}</th><th>${esc(h2)}</th></tr>` : ""}${g.rows
      .map((r) => {
        const bold = r.name.startsWith("* ");
        return `<tr${bold ? ' class="b"' : ""}><td>${esc(bold ? r.name.slice(2) : r.name)}</td><td>${cell(r)}</td></tr>`;
      })
      .join("")}</table>`;
  };

  if (x.ingColumns?.length) {
    return `<div class="dm-ing">${heading}<div class="dm-ing-cols" style="grid-template-columns:repeat(${x.ingColumns.length},1fr)">${x.ingColumns
      .map((labels) => `<div>${labels.map((l) => groups.filter((g) => g.label === l).map(table).join("")).join("")}</div>`)
      .join("")}</div></div>`;
  }
  return `<div class="dm-ing">${heading}${groups.map(table).join("")}</div>`;
}

function renderMethod(d: DimsumCardData, editable: boolean): string {
  const x = d.extras ?? {};
  const style = x.methodStyle ?? "numbers";
  const heading = `<h3 class="dm-h${x.methodPill ? " dm-pill" : ""}"${field(editable, "steps")}>${esc(x.methodHeading || "METHOD (EXECUTION)")}</h3>`;

  if (x.methodFlow) {
    const pic = `<svg class="dm-wok" viewBox="0 0 80 40" fill="none" stroke="#222" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 18h50c0 8-10 14-25 14S8 26 8 18z"/><path d="M58 17l16-5"/><path d="M20 36l4-4M44 36l-4-4" stroke="#E39B1F"/><path d="M26 15c1-2 3-2 5 0M36 14c1-2 3-2 5 0" stroke="#E39B1F"/></svg>`;
    return `<div class="dm-method flow">${heading}<div class="dm-flow" style="grid-template-columns:repeat(${d.steps.length},1fr)">${d.steps
      .map(
        (st, i) =>
          `<div class="dm-fs"${field(editable, `steps.${i}`)}><div class="t">${esc(st.title || "")}</div><p>${esc(st.body)}</p><div class="pic">${pic}${i < d.steps.length - 1 ? '<em>→</em>' : ""}</div></div>`,
      )
      .join("")}</div></div>`;
  }
  if (style === "numbers" || style === "plain") {
    return `<div class="dm-method">${heading}<ol class="dm-steps ${style}">${d.steps
      .map(
        (s, i) =>
          `<li${field(editable, `steps.${i}`)}><b>${style === "plain" ? `${i + 1}.` : String(i + 1).padStart(2, "0")}</b><span>${esc(s.body)}</span></li>`,
      )
      .join("")}</ol></div>`;
  }

  // Titled sections: a step with a title starts a new section (numbering restarts).
  const sections: { title: string; items: { body: string; i: number }[] }[] = [];
  d.steps.forEach((s, i) => {
    if (s.title || !sections.length) sections.push({ title: s.title ?? "", items: [] });
    sections[sections.length - 1].items.push({ body: s.body, i });
  });
  const secHtml = (sec: (typeof sections)[number]) =>
    `<div class="dm-sec"><div class="dm-sec-t">${esc(sec.title)}</div>${
          style === "sections-num"
            ? `<ol class="dm-steps">${sec.items.map((it, n) => `<li${field(editable, `steps.${it.i}`)}><b>${String(n + 1).padStart(2, "0")}</b><span>${esc(it.body)}</span></li>`).join("")}</ol>`
            : `<ul class="dm-ul">${sec.items.map((it) => `<li${field(editable, `steps.${it.i}`)}>${esc(it.body)}</li>`).join("")}</ul>`
        }</div>`;
  if (x.methodSplit && sections.length > x.methodSplit) {
    return `<div class="dm-method">${heading}<div class="dm-mcols"><div>${sections.slice(0, x.methodSplit).map(secHtml).join("")}</div><div>${sections.slice(x.methodSplit).map(secHtml).join("")}</div></div></div>`;
  }
  if (x.methodWide) {
    return `<div class="dm-method wide">${heading}<div class="dm-mcols n${sections.length}">${sections.map((sec) => `<div>${secHtml(sec)}</div>`).join("")}</div></div>`;
  }
  return `<div class="dm-method">${heading}${sections.map(secHtml).join("")}</div>`;
}

function renderGuide(g: DimsumGuide, side: boolean, iconRow = false): string {
  const body = g.steps
    ? `<div class="dm-pics">${g.steps
        .map((s, i) => `${i ? '<span class="dm-arrow">→</span>' : ""}<div class="dm-pic-s">${stepIcon(s.icon)}<small>${esc(s.label)}</small></div>`)
        .join("")}</div>`
    : list(g.bullets);
  if (side) {
    return `<div class="dm-side-g"><span class="dm-gi">${g.icon ? ICON[g.icon] : ""}</span><div><h4>${esc(g.title)}</h4>${body}</div></div>`;
  }
  if (g.icon && iconRow) {
    return `<div class="dm-g ic"><span class="dm-gi big">${ICON[g.icon]}</span><div><h4>${esc(g.title)}</h4>${body}</div></div>`;
  }
  return `<div class="dm-g ${g.steps ? "wide" : ""}"><h4>${esc(g.title)}</h4>${body}</div>`;
}

function ramenCardHtml(d: DimsumCardData, editable: boolean): string {
  const x = d.extras ?? {};
  const rm = x.ramen!;
  const f = (name: string) => field(editable, name);
  const [tagCode, ...tagRest] = (x.tag ?? "").split("|");
  const photo = d.heroUrl
    ? `<img src="${esc(d.heroUrl)}" alt="${esc(d.title)}">`
    : `<span class="dm-photo-empty">${editable ? "Click to add a hero image" : ""}</span>`;
  const rows = d.ingredients
    .map((ing, i) => {
      const q = [ing.quantity != null ? String(ing.quantity) : "", ing.unit ?? ""].filter(Boolean).join(" ");
      const head = rm.heads?.[ing.name] ? `<div class="rm-ihead">${esc(rm.heads[ing.name])}</div>` : "";
      return `${head}<div class="rm-irow"${f(`ingredients.${i}`)}><span>${esc(ing.name)}</span><b>${esc(q)}</b></div>`;
    })
    .join("");
  const ingBox =
    rm.ingStyle === "table"
      ? `<div class="rm-itable"><div class="rm-ith"><span>INGREDIENT</span><span>GRAM</span></div>${rows}</div>`
      : `<div class="rm-ibul">${rows}</div>`;
  const steps = d.steps
    .map((st, i) => `<div class="rm-step"${f(`steps.${i}`)}><i>${rm.methodStyle === "circles" ? i + 1 : `${i + 1}.`}</i><p>${esc(st.body)}</p></div>`)
    .join("");
  const notes = (rm.chefNotes ?? []).map((n) => `<p>${esc(n)}</p>`).join("");
  return `
<div class="rm-top">
  <div class="rm-photo"${f("heroImageId")}>${photo}</div>
  <div class="rm-intro">
    <div class="rm-tag">${x.tag ? `<b>${esc(tagCode.trim())}</b> | ${esc(tagRest.join("|").trim())}` : ""}</div>
    <i class="rm-rule"></i>
    <h1 class="rm-title"${f("title")}>${esc(d.title)}</h1>
    ${d.description ? `<p class="rm-desc"${f("description")}>${esc(d.description)}</p>` : ""}
    <div class="rm-box">
      <div${f("dishCode")}><b>DISH CODE</b><span>${esc(d.dishCode || "N/A")}</span></div>
      <div${f("author")}><b>AUTHOR</b><span class="sm">${esc((d.author || "Bookend's Hospitality").toUpperCase())}</span></div>
      <div${f("approvedBy")}><b>APPROVED BY</b><span>${esc((d.approvedBy || "N/A").toUpperCase())}</span></div>
    </div>
    ${rm.under?.length ? `<ul class="rm-under">${rm.under.map((u) => `<li>${esc(u)}</li>`).join("")}</ul>` : ""}
  </div>
</div>
<div class="rm-cream">
  <div class="rm-main">
    <div class="rm-ing"><h3${f("ingredients")}>INGREDIENTS</h3><i class="rm-hr"></i>${ingBox}</div>
    <div class="rm-meth${rm.methodStyle === "circles" ? " circ" : ""}"><h3${f("steps")}>METHOD</h3><i class="rm-hr"></i>${steps}</div>
  </div>
  <div class="rm-foot">
    <div class="rm-fi">${ICON.hat}<div><h4>CHEF NOTES</h4>${notes}</div></div>
    <div class="rm-fi">${ICON.cloche}<div><h4>SERVICE</h4><p>${esc(rm.service || "Serve immediately hot.")}</p></div></div>
  </div>
</div>`;
}

export function dimsumCardHtml(d: DimsumCardData, { editable = false } = {}): string {
  if (d.extras?.ramen) return ramenCardHtml(d, editable);
  const x = d.extras ?? {};
  const f = (name: string) => field(editable, name);
  const strip = x.strip ?? {};
  const showLabels = x.stripLabels !== false;
  const stat = (icon: string, label: string, value: string | undefined) =>
    `<div class="dm-stat">${icon}${showLabels ? `<b>${label}</b>` : ""}${value ? `<span>${esc(value)}</span>` : ""}</div>`;
  const typeIcon = /cold/i.test(strip.type ?? "") ? ICON.snow : ICON.type;

  const photo = d.heroUrl
    ? `<img src="${esc(d.heroUrl)}" alt="${esc(d.title)}">`
    : `<span class="dm-photo-empty">${editable ? "Click to add a hero image" : ""}</span>`;
  const titleSize = d.title.length > 24 ? 40 : 46;

  const top = `
<div class="dm-top">
  <div class="dm-photo"${f("heroImageId")}>${photo}${x.tag ? `<span class="dm-tag"><b>${esc(x.tag.split("|")[0].trim())}</b> | ${esc(x.tag.split("|").slice(1).join("|").trim())}</span>` : ""}</div>
  <div class="dm-intro">
    <div class="dm-eyebrow"${f("brandId")}>${esc(d.brandName)} Kitchen</div>
    <div class="dm-title"${f("title")} style="font-size:${titleSize}px">${esc(d.title || "Untitled recipe")}</div>
    <div class="dm-sop">– Dish SOP</div>
    ${d.description || editable ? `<p class="dm-desc"${f("description")}>${esc(d.description || "Add a description…")}</p>` : ""}
    <div class="dm-strip">
      ${
        x.stripItems
          ? x.stripItems.map((it) => stat(ICON[it.icon === "leaf" ? "diet" : it.icon === "cloche" ? "cloche" : it.icon], it.label, it.value)).join("")
          : `${stat(typeIcon, "Type", strip.type)}${stat(ICON.diet, "Dietary", strip.dietary)}${stat(ICON.portion, "Portion", strip.portion)}${stat(ICON.service, "Service", strip.service)}${stat(ICON.allergens, "Allergens", strip.allergens)}`
      }
    </div>
    <div class="dm-meta">
      <div${f("dishCode")}><b>Dish code</b><span>${esc(d.dishCode || "N/A")}</span></div>
      <div${f("author")}><b>Author</b><span>${esc(d.author || "Bookend's Hospitality")}</span></div>
      <div${f("approvedBy")}><b>Approved by</b><span>${esc(d.approvedBy || "N/A")}</span></div>
    </div>
  </div>
</div>`;

  const summaryRows = (x.summary ?? []).map(([k, v]) => `<tr><td>${esc(k)}</td><td>: ${esc(v)}</td></tr>`).join("");
  const four = `
<div class="dm-four">
  <div><h3 class="dm-h u">Summary</h3><table class="dm-sum">${summaryRows}</table></div>
  <div><h3 class="dm-h u">Key Highlights</h3>${list(x.highlights)}</div>
  <div${f("qualityCheck")}><h3 class="dm-h u">QC Check Points</h3>${list(d.qualityCheck, editable, "qualityCheck")}</div>
  <div><h3 class="dm-h u">Serving</h3>${(x.serving ?? []).map((p) => `<p class="dm-p">${esc(p)}</p>`).join("")}</div>
</div>`;

  const guides = x.guides ?? [];
  const side = x.guidesLayout === "side";
  const compTable = (t: DimsumTable) => {
    const [h1, h2] = t.headers ?? ["Ingredients", "Gram"];
    return `<div class="dm-comp"><div class="dm-gl">${esc(t.title)}${t.yield ? ` <small>(${esc(t.yield)})</small>` : ""}</div><table class="dm-t"><tr><th>${esc(h1)}</th><th>${esc(h2)}</th></tr>${t.rows
      .map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`)
      .join("")}${t.total ? `<tr class="b"><td>${esc(t.total[0])}</td><td>${esc(t.total[1])}</td></tr>` : ""}</table>${list(t.bullets)}</div>`;
  };
  const mainBox = x.compTables
    ? `<div class="dm-box dm-main comps">
  ${renderIngredients(d, editable)}
  <div class="dm-method"><h3 class="dm-h">${esc(x.compHeading || "COMPONENTS & PREPARATION")}</h3><div class="dm-comp-row" style="grid-template-columns:repeat(${x.compTables.length},1fr)">${x.compTables.map(compTable).join("")}</div></div>
</div>
<div class="dm-box dm-methodbox">${renderMethod(d, editable)}</div>`
    : `
<div class="dm-box dm-main ${side ? "has-side" : ""}">
  ${renderIngredients(d, editable)}
  ${renderMethod(d, editable)}
  ${side ? `<div class="dm-side">${guides.map((g) => renderGuide(g, true)).join("")}</div>` : ""}
</div>`;

  const guideRow =
    !side && guides.length
      ? `<div class="dm-box dm-guides" style="grid-template-columns:${guides.map((g) => (g.steps ? "1.7fr" : "1fr")).join(" ")}">${guides.map((g) => renderGuide(g, false, !!x.iconGuides)).join("")}</div>`
      : "";

  const dip = x.dip
    ? `<div class="dm-box dm-dip"><h4>${esc(x.dip.title)}</h4><p>${x.dip.items.map((i) => `<span>• ${esc(i)}</span>`).join("")}</p></div>`
    : "";
  const comps = x.components
    ? `<div class="dm-box dm-comps"><h4>${esc(x.components.title)}</h4><div style="grid-template-columns:repeat(${x.components.cols.length},1fr)">${x.components.cols
        .map((c) => `<div><b>${esc(c.title)}</b><p>${esc(c.text)}</p></div>`)
        .join("")}</div></div>`
    : "";

  const qcMise = x.miseInQc ? `<div class="ic">${`<span class="dm-gi big">${ICON.clipboard}</span>`}<div><h4>Mise en place</h4>${list(d.miseEnPlace, editable, "miseEnPlace")}</div></div>` : "";
  const qc =
    x.qcMarkers?.length || x.faults?.length
      ? `<div class="dm-box dm-qc ${x.qcIcons ? "ic" : ""}${x.miseInQc ? " three" : ""}">
    <div>${x.qcIcons ? `<span class="dm-gi big">${ICON.award}</span>` : ""}<div><h4>QC &amp; Quality Markers</h4>${list(x.qcMarkers)}</div></div>
    <div>${x.qcIcons ? `<span class="dm-gi big">${ICON.wrench}</span>` : ""}<div><h4>Faults &amp; Fixes</h4><table class="dm-ff">${x.faultHeader ? `<tr class="h"><td>${esc(x.faultHeader[0])}</td><td></td><td>${esc(x.faultHeader[1])}</td></tr>` : ""}${(x.faults ?? []).map(([a, b]) => `<tr><td>${esc(a)}</td><td>→</td><td>${esc(b)}</td></tr>`).join("")}</table></div></div>
    ${qcMise}
  </div>`
      : "";

  const mise = x.miseInQc ? 0 : d.miseEnPlace.length || d.equipment.length;
  const cols: string[] = [];
  const lowIc = (k: keyof typeof ICON) => (x.lowIcons ? `<span class="dm-gi">${ICON[k]}</span>` : "");
  const lowCol = (k: keyof typeof ICON, inner: string, attr = "") => (x.lowIcons ? `<div${attr} class="ic">${lowIc(k)}<div>${inner}</div></div>` : `<div${attr}>${inner}</div>`);
  if (mise)
    cols.push(
      lowCol("clipboard", `<h4>Mise en place</h4>${list(d.miseEnPlace, editable, "miseEnPlace")}${
        d.equipment.length ? `<p class="dm-eq"><i>Equipment/Tools:</i> ${esc(d.equipment.join(", "))}</p>` : ""
      }`, f("miseEnPlace")),
    );
  if (lines(d.holding).length) cols.push(lowCol("fridge", `<h4>Holding &amp; Storage</h4>${list(lines(d.holding))}`, f("holding")));
  if (x.serviceNotes?.length) cols.push(lowCol("cloche", `<h4>Service Notes</h4>${list(x.serviceNotes)}`));
  if (lines(d.plating).length) cols.push(lowCol("lotus", `<h4>Plating &amp; Presentation</h4>${list(lines(d.plating))}`, f("plating")));
  const lower = cols.length ? `<div class="dm-box dm-low" style="grid-template-columns:repeat(${cols.length},1fr)">${cols.join("")}</div>` : "";

  const foot = `
<div class="dm-foot">
  <span class="dm-logo"><span class="dm-logo-o">${ICON.ornament}</span><span class="dm-logo-w"><b>${esc(d.brandName.toUpperCase().split("").join(" "))}</b><small>KITCHEN</small></span></span>
  <i></i><em>${esc(x.footer || "Serve hot for the best taste and experience.")}</em><i></i>
  <span class="dm-logo-o r">${ICON.ornament}</span>
</div>`;

  const hl = x.headLine;
  const headLine = hl
    ? `<div class="dm-headline${x.headStack ? " stack" : ""}"><div>${hl.qc?.length ? `<p class="q"><b>QC</b> ${hl.qc.map((q, i) => `${i ? '<i class="dot"></i>' : ""}${esc(q)}`).join("")}</p>` : ""}${hl.portion ? `<p class="p"><i class="sq"></i>${esc(hl.portion)}</p>` : ""}</div><div>${hl.service ? `<p class="s"><b>SERVICE</b> ${esc(hl.service)}</p>` : ""}</div></div>`
    : "";
  return `<div class="dm-topwrap">${top}${headLine}</div><div class="dm-cream">${four}${mainBox}${guideRow}${dip}${comps}${qc}${lower}</div>${foot}`;
}

const RMGOLD = "#B88A2D";
const GOLD = "#F2A62B";
const LINE = "#EBBD74";

export const DIMSUM_CSS = `
.rm-top { position: relative; display: flex; min-height: 570px; background: #111; }
.rm-photo { position: absolute; top: 0; right: 0; bottom: 0; width: 53%; background: #1a1a1a; overflow: hidden; border-left: 1.5px solid ${RMGOLD}; }
.rm-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.rm-intro { position: relative; width: 47%; padding: 26px 0 20px 34px; display: flex; flex-direction: column; }
.rm-tag { text-align: right; padding-right: 38px; font-size: 12.5px; color: #e8e2d6; min-height: 16px; } .rm-tag b { color: ${RMGOLD}; font-weight: 700; }
.rm-rule { display: block; height: 1.4px; width: 74%; background: ${RMGOLD}; margin: 14px 0 20px; }
.rm-root h1.rm-title { font-family: "Nunito Sans", sans-serif; font-weight: 800; font-size: 41px; line-height: 1.04; color: #fff; text-transform: uppercase; margin: 0; letter-spacing: -.01em; overflow-wrap: anywhere; }
.rm-root .rm-desc { color: #fff; font-size: 14.2px; line-height: 1.5; margin-top: 18px; padding-right: 22px; }
.rm-box { margin-top: 26px; margin-right: 38px; border: 1.4px solid ${RMGOLD}; background: #000; padding: 16px 18px 26px; }
.rm-box div { display: grid; grid-template-columns: 112px 1fr; align-items: center; padding: 11px 0; }
.rm-box b { color: ${RMGOLD}; font-weight: 800; font-size: 13px; letter-spacing: .02em; } .rm-box span { color: #fff; font-size: 13px; } .rm-box span.sm { font-size: 11px; }
.rm-root .rm-under { list-style: none; margin-top: 16px; font-size: 11px; color: #ddd; } .rm-under li { position: relative; padding-left: 16px; } .rm-under li::before { content: ""; position: absolute; left: 3px; top: .5em; width: 4px; height: 4px; border-radius: 50%; background: ${RMGOLD}; }
.rm-cream { flex: 1; background: #FAF6EE; padding: 24px 30px 18px; display: flex; flex-direction: column; }
.rm-main { display: grid; grid-template-columns: 1fr 1.04fr; flex: 1; }
.rm-ing { padding-right: 26px; border-right: 1px solid #E3D3AE; } .rm-meth { padding-left: 28px; }
.rm-root h3 { font-size: 20px; font-weight: 800; color: ${RMGOLD}; letter-spacing: .01em; margin: 0; }
.rm-hr { display: block; height: 1.3px; background: ${RMGOLD}; margin: 8px 0 14px; }
.rm-irow { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; line-height: 1.3; padding: 4px 0; color: #1d1d1d; } .rm-irow b { font-weight: 500; white-space: nowrap; text-align: right; }
.rm-ibul .rm-irow { padding-left: 16px; position: relative; } .rm-ibul .rm-irow::before { content: ""; position: absolute; left: 2px; top: .62em; width: 5px; height: 5px; border-radius: 50%; background: ${RMGOLD}; }
.rm-itable .rm-irow { border-bottom: 1px dotted #D9CDB0; padding: 3.5px 0; font-size: 12.5px; }
.rm-ith { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: ${RMGOLD}; border-bottom: 1.2px solid #E0CB98; padding-bottom: 5px; margin-bottom: 4px; }
.rm-ihead { font-size: 10.5px; font-weight: 800; color: ${RMGOLD}; text-transform: uppercase; padding: 7px 0 2px; }
.rm-step { display: flex; gap: 12px; align-items: flex-start; padding: 8px 0; font-size: 13.4px; line-height: 1.38; color: #1d1d1d; border-bottom: 1px dotted #DCD0B3; } .rm-step:last-child { border-bottom: 0; }
.rm-step i { font-style: normal; font-weight: 800; color: ${RMGOLD}; min-width: 20px; font-size: 14px; } .rm-step p { margin: 0; }
.rm-meth.circ .rm-step i { background: ${RMGOLD}; color: #fff; width: 21px; height: 21px; border-radius: 50%; min-width: 21px; text-align: center; font-size: 11px; line-height: 21px; }
.rm-foot { display: grid; grid-template-columns: 1fr 1fr; border-top: 1.3px solid ${RMGOLD}; margin-top: 16px; padding-top: 16px; }
.rm-fi { display: flex; gap: 16px; align-items: center; padding: 0 20px; } .rm-fi + .rm-fi { border-left: 1px solid #E3D3AE; }
.rm-fi svg { width: 50px; height: 50px; color: ${RMGOLD}; flex: none; } .rm-root h4 { font-size: 15px; font-weight: 800; color: ${RMGOLD}; margin: 0 0 4px; } .rm-fi p { font-size: 12.5px; line-height: 1.35; margin: 0; color: #1d1d1d; }
.rm-root { width: 100%; min-height: 100%; display: flex; flex-direction: column; background: #FAF6EE; font-family: "Nunito Sans", system-ui, sans-serif; text-align: left; -webkit-font-smoothing: antialiased; }
.rm-root *, .rm-root *::before, .rm-root *::after { box-sizing: border-box; } .rm-root p, .rm-root h1, .rm-root h3, .rm-root h4, .rm-root ul { margin: 0; padding: 0; } .rm-root svg { display: block; }
.dm-root { width: 100%; min-height: 100%; display: flex; flex-direction: column; background: #F7F2EA; color: #1f1f1f;
  font-family: "Nunito Sans", system-ui, sans-serif; -webkit-font-smoothing: antialiased; line-height: 1.4; text-align: left; font-size: 9.6px; }
.dm-root *, .dm-root *::before, .dm-root *::after { box-sizing: border-box; }
.dm-root p, .dm-root h3, .dm-root h4, .dm-root ul, .dm-root ol { margin: 0; padding: 0; }
.dm-root svg { display: block; }
.dm-topwrap { background: #0A0A0A; position: relative; }
.dm-headline { position: relative; z-index: 1; display: grid; grid-template-columns: 43% 57%; padding: 6px 0 8px; color: #fff; font-size: 11.5px; }
.dm-headline > div:first-child { padding-left: 22px; } .dm-headline > div:last-child { padding-left: 16px; }
.dm-headline b { color: ${GOLD}; font-weight: 800; } .dm-headline p { margin: 3px 0; }
.dm-headline .dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #fff; margin: 0 8px; }
.dm-headline .p { color: #bbb; font-style: italic; font-size: 10px; } .dm-headline .sq { display: inline-block; width: 8px; height: 8px; background: #888; margin-right: 6px; }
.dm-headline .s { font-size: 12.5px; }
.dm-tag { position: absolute; top: 14px; right: 16px; color: #fff; font-size: 11.5px; } .dm-tag b { color: ${GOLD}; font-weight: 700; }
.dm-headline.stack { display: block; padding: 4px 0 8px 22px; border-top: 0; } .dm-headline.stack > div { padding: 0 !important; width: 43%; } .dm-headline.stack > div:last-child { border-top: 1px solid rgba(242,166,43,.55); margin-top: 6px; padding-top: 6px !important; }
.dm-flow { display: grid; } .dm-fs { padding: 0 10px; position: relative; } .dm-fs + .dm-fs { border-left: 0; }
.dm-fs .t { color: #D88A14; font-weight: 800; text-transform: uppercase; font-size: 9px; margin-bottom: 3px; } .dm-fs p { font-size: 9.4px; line-height: 1.35; min-height: 38px; }
.dm-fs .pic { display: flex; align-items: center; margin-top: 7px; } .dm-wok { width: 92px; height: 46px; } .dm-fs p { font-size: 10px; } .dm-fs .pic em { color: #E39B1F; font-style: normal; font-size: 14px; margin-left: 4px; }
.dm-qc.three { grid-template-columns: 1fr 1.25fr .95fr; } .dm-qc.three > div.ic { padding: 0 16px; display: flex; gap: 10px; align-items: flex-start; } .dm-qc.three > div + div { border-left: 1px solid ${LINE}; }
.dm-ff tr.h td { font-weight: 800; }
.dm-top { position: relative; display: flex; min-height: 440px; background: #0A0A0A; }
.dm-photo { position: absolute; top: 0; right: 0; bottom: 0; width: 57%; background: #1a1a1a; overflow: hidden; }
.dm-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.dm-photo-empty { display: flex; height: 100%; align-items: center; justify-content: center; color: #888; font-size: 12px; }
.dm-intro { position: relative; width: 43%; background: #0A0A0A; padding: 20px 0 16px 22px; display: flex; flex-direction: column; }
.dm-eyebrow { color: ${GOLD}; font-weight: 700; font-size: 14px; letter-spacing: .04em; text-transform: uppercase; padding-bottom: 8px; border-bottom: 1px solid ${GOLD}; align-self: flex-start; padding-right: 20px; }
.dm-title { font-weight: 800; color: #fff; text-transform: uppercase; line-height: 1.02; margin-top: 16px; padding-right: 12px; overflow-wrap: anywhere; }
.dm-sop { color: ${GOLD}; font-weight: 800; font-size: 25px; margin-top: 8px; text-transform: uppercase; }
.dm-root .dm-desc { color: #fff; font-size: 13.2px; line-height: 1.42; margin-top: 10px; padding-right: 12px; font-weight: 500; }
.dm-strip { display: flex; margin-top: auto; padding-top: 16px; padding-right: 6px; }
.dm-stat { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 2px; min-width: 0; }
.dm-stat + .dm-stat { border-left: 1px solid rgba(242,166,43,.55); }
.dm-stat svg { width: 26px; height: 26px; color: ${GOLD}; margin-bottom: 7px; }
.dm-stat b { color: #fff; font-size: 8px; font-weight: 700; letter-spacing: .02em; text-transform: uppercase; }
.dm-stat span { color: #fff; font-size: 7.6px; font-weight: 600; text-transform: uppercase; margin-top: 3px; line-height: 1.25; overflow-wrap: anywhere; }
.dm-meta { margin: 14px -34px -2px 0; position: relative; z-index: 2; border: 1px solid ${GOLD}; background: #0A0A0A; padding: 12px 14px; font-size: 12px; }
.dm-meta div { display: grid; grid-template-columns: 112px 1fr; padding: 3px 0; }
.dm-meta b { color: ${GOLD}; font-weight: 800; text-transform: uppercase; letter-spacing: .02em; }
.dm-meta span { color: #fff; text-transform: uppercase; font-weight: 600; }
.dm-cream { padding: 18px 20px 14px; display: flex; flex-direction: column; gap: 9px; flex: 1; justify-content: space-between; }
.dm-h { font-size: 12.4px; font-weight: 800; color: #111; text-transform: uppercase; letter-spacing: .01em; margin-bottom: 6px; }
.dm-h.u { padding-bottom: 5px; position: relative; margin-bottom: 8px; }
.dm-h.u::after { content: ""; position: absolute; left: 0; bottom: 0; width: 22px; height: 2px; background: ${GOLD}; }
.dm-h.dm-pill { display: inline-block; background: #0A0A0A; color: #fff; padding: 4px 14px; border-radius: 3px; font-size: 11px; letter-spacing: .04em; }
.dm-four { display: grid; grid-template-columns: 1.02fr 1fr 1fr .8fr; }
.dm-four > div { padding: 0 14px; }
.dm-four > div + div { border-left: 1px solid ${LINE}; }
.dm-four > div:first-child { padding-left: 0; }
.dm-sum { border-collapse: collapse; font-size: 9.8px; }
.dm-sum td { padding: 3px 0; vertical-align: top; } .dm-sum td:first-child { padding-right: 14px; white-space: nowrap; }
.dm-ul { list-style: none; font-size: 9.6px; line-height: 1.42; }
.dm-ul li { position: relative; padding-left: 12px; margin-bottom: 3px; }
.dm-ul li::before { content: ""; position: absolute; left: 3px; top: .55em; width: 3.4px; height: 3.4px; border-radius: 50%; background: #1f1f1f; }
.dm-root p.dm-p { font-size: 9.8px; line-height: 1.55; margin-bottom: 6px; }
.dm-box { border: 1px solid ${LINE}; border-radius: 7px; padding: 10px 14px; }
.dm-main { display: grid; grid-template-columns: .93fr 1.07fr; gap: 0; padding: 12px 0 12px 0; }
.dm-main.has-side { grid-template-columns: .85fr 1.1fr .88fr; }
.dm-ing { padding: 0 14px; border-right: 1px solid ${LINE}; }
.dm-method { padding: 0 14px; }
.dm-ing-cols { display: grid; gap: 14px; }
.dm-gl { font-weight: 800; color: #D88A14; text-transform: uppercase; font-size: 10.2px; margin: 7px 0 3px; }
.dm-gl.c { color: #111; text-align: center; font-size: 10px; margin-top: 10px; }
.dm-t { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 2px; }
.dm-t th, .dm-t td { border: 1px solid #555; padding: 1.4px 5px; text-align: left; line-height: 1.3; }
.dm-t th { font-weight: 800; } .dm-t td + td, .dm-t th + th { text-align: center; width: 34%; }
.dm-t tr.b td { font-weight: 800; }
.dm-stage { font-size: 9.8px; line-height: 1.55; margin-top: 2px; } .dm-stage b { color: #D88A14; font-weight: 800; }
.dm-steps { list-style: none; font-size: 10px; line-height: 1.45; }
.dm-steps li { display: flex; gap: 9px; margin-bottom: 6px; }
.dm-steps li b { color: #E39B1F; font-weight: 800; min-width: 17px; }
.dm-steps.plain li { margin-bottom: 9px; }
.dm-sec { padding: 4px 0 5px; border-bottom: 1px solid ${LINE}; } .dm-sec:last-child { border-bottom: 0; }
.dm-sec-t { color: #D88A14; font-weight: 800; text-transform: uppercase; font-size: 10.2px; margin-bottom: 3px; }
.dm-sec .dm-steps { font-size: 9.2px; line-height: 1.38; } .dm-sec .dm-steps li { margin-bottom: 2px; }
.dm-sec .dm-ul { font-size: 9.2px; } .dm-sec .dm-ul li { margin-bottom: 2px; }
.dm-mcols { display: grid; grid-template-columns: 1fr 1fr; gap: 0; } .dm-mcols > div:first-child { padding-right: 14px; border-right: 1px solid ${LINE}; } .dm-mcols > div:last-child { padding-left: 14px; }
.dm-mcols .dm-sec { border-bottom: 0; padding: 3px 0 7px; }
.dm-method.wide .dm-mcols { grid-template-columns: repeat(4, 1fr); } .dm-method.wide .dm-mcols > div { padding: 0 10px; border-right: 1px solid ${LINE}; } .dm-method.wide .dm-mcols > div:last-child { border-right: 0; }
.dm-main.comps { grid-template-columns: .62fr 1.6fr; }
.dm-comp-row { display: grid; gap: 10px; } .dm-comp .dm-gl { margin-top: 0; font-size: 9.2px; } .dm-comp .dm-gl small { font-weight: 600; color: #555; text-transform: none; }
.dm-comp .dm-ul { margin-top: 5px; font-size: 8.8px; } .dm-methodbox { padding: 10px 0 8px; margin-top: -9px; border-top: 0; border-radius: 0 0 7px 7px; }
.dm-g.ic { display: flex; align-items: flex-start; gap: 10px; } .dm-g.ic h4 { text-align: left; }
.dm-gi.big svg { width: 36px; height: 36px; color: #D88A14; } .dm-gi.big { flex: none; padding-top: 2px; }
.dm-qc.ic > div { display: flex; gap: 14px; align-items: flex-start; justify-content: center; } .dm-qc.ic h4 { text-align: left; }
.dm-qc.ic > div:last-child .dm-ff { margin: 0; } .dm-qc.ic .dm-ul { margin: 0; }
.dm-low > div.ic { display: flex; gap: 8px; align-items: flex-start; } .dm-low .dm-gi svg { width: 26px; height: 26px; color: #D88A14; flex: none; }
.dm-side {  padding: 0 12px 0 14px; border-left: 1px solid ${LINE}; display: flex; flex-direction: column; justify-content: space-between; }
.dm-side-g { display: flex; gap: 8px; padding: 6px 0 8px; border-bottom: 1px solid ${LINE}; } .dm-side-g:last-child { border-bottom: 0; }
.dm-gi svg { width: 28px; height: 28px; color: #D88A14; }
.dm-side-g h4, .dm-g h4, .dm-qc h4, .dm-low h4, .dm-dip h4, .dm-comps h4 { font-size: 11.2px; font-weight: 800; text-transform: uppercase; margin-bottom: 5px; color: #111; }
.dm-guides { display: grid; gap: 0; padding: 10px 0; }
.dm-g { padding: 0 14px; } .dm-g + .dm-g { border-left: 1px solid ${LINE}; } .dm-g h4 { text-align: center; }
.dm-pics { display: flex; align-items: flex-start; justify-content: center; gap: 4px; }
.dm-pic-s { text-align: center; width: 54px; } .dm-pic-s small { display: block; font-size: 8px; line-height: 1.25; margin-top: 3px; }
.dm-pic { width: 52px; height: 35px; margin: 0 auto; }
.dm-arrow { padding-top: 11px; font-size: 11px; }
.dm-dip { text-align: center; padding: 7px 10px; } .dm-dip h4 { font-size: 11px; text-transform: none; margin-bottom: 4px; }
.dm-dip p { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 22px; font-size: 10px; margin: 0; }
.dm-comps { padding: 8px 0; } .dm-comps h4 { text-align: center; }
.dm-comps > div { display: grid; } .dm-comps > div > div { padding: 0 12px; text-align: center; } .dm-comps > div > div + div { border-left: 1px solid ${LINE}; }
.dm-comps b { font-size: 9.4px; text-transform: uppercase; } .dm-comps p { font-size: 9px; margin-top: 3px; }
.dm-qc { display: grid; grid-template-columns: 1fr 1fr; padding: 9px 0; }
.dm-qc > div { padding: 0 16px; } .dm-qc > div + div { border-left: 1px solid ${LINE}; }
.dm-qc h4 { text-align: center; } .dm-qc .dm-ul { width: max-content; max-width: 100%; margin: 0 auto; }
.dm-ff { border-collapse: collapse; font-size: 9.4px; margin: 0 auto; } .dm-ff td { padding: 1.6px 8px 1.6px 0; vertical-align: top; } .dm-ff td:nth-child(2) { padding: 1.6px 12px 1.6px 4px; }
.dm-low { display: grid; padding: 9px 0; }
.dm-low > div { padding: 0 14px; } .dm-low > div + div { border-left: 1px solid ${LINE}; }
.dm-low .dm-ul { font-size: 9.2px; line-height: 1.38; } .dm-low .dm-ul li { margin-bottom: 2px; }
.dm-eq { font-size: 9.2px; margin-top: 3px; } .dm-eq i { font-weight: 700; }
.dm-foot { display: flex; align-items: center; gap: 12px; background: #0A0A0A; padding: 8px 16px; color: ${GOLD}; margin-top: auto; }
.dm-foot i { flex: 1; height: 1px; background: rgba(242,166,43,.55); }
.dm-foot em { font-style: normal; font-size: 12px; font-weight: 600; white-space: nowrap; }
.dm-logo { display: flex; align-items: center; gap: 8px; } .dm-logo-o svg { width: 24px; height: 24px; color: ${GOLD}; }
.dm-logo-w b { display: block; font-family: "EB Garamond", Georgia, serif; font-weight: 500; font-size: 19px; color: ${GOLD}; letter-spacing: .02em; line-height: 1; }
.dm-logo-w small { display: block; font-size: 6.5px; letter-spacing: .5em; margin-top: 2px; text-align: center; }
`;
