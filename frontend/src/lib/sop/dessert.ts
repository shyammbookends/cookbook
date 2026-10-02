/**
 * The Desserts / Drinks card design (a second layout for brands on the "classic"
 * template): photo + Chef's Notes panel on the right, details on the left.
 * Every other category keeps the standard card.
 */
export const DESSERT_STYLE_CATEGORIES = ["desserts", "dessert", "drinks", "drink", "beverages", "beverage"];

export function isDessertStyle(template: string, categorySlug: string | null | undefined): boolean {
  return template === "classic" && !!categorySlug && DESSERT_STYLE_CATEGORIES.includes(categorySlug.toLowerCase());
}

export const DESSERT_STAT_ICONS = ["tag", "pot", "user", "leaf", "snow", "clock", "cup", "ice"] as const;
export type DessertStatIcon = (typeof DESSERT_STAT_ICONS)[number];

/** Extra card fields kept in `customFields.card` (no schema change). */
export interface DessertExtras {
  /** "−18 °C" — shown as the "Store at" stat. */
  storeAt?: string;
  /** "2 h" — shown as the "Chill time" stat. */
  chillTime?: string;
  /** Closing line under Quality Check, e.g. "Serve immediately". */
  serveTitle?: string;
  serveText?: string;
  /** Replaces the default Prep / Cook / Yield / Diet stats row (drinks: Yield, Serve with ice, Build time…). */
  stats?: { label: string; value: string; icon: DessertStatIcon }[];
  /** Extra rows in the green info box. */
  glassware?: string;
  garnishInfo?: string;
  /** Hides rows that have no data (dish code, station, plating, holding, allergens) instead of showing "N/A". */
  hideEmpty?: boolean;
  /** Shows the effective date inside the green info box (drinks). */
  effectiveInBox?: boolean;
  /** Heading override, e.g. "Method (time-stamped)". */
  methodTitle?: string;
  /** "CCP / Quality" block under the method. */
  ccp?: string;
  /** Heading override for the plating block, e.g. "Plating & Holding". */
  platingTitle?: string;
  /** "Notes" block at the foot of the method column, e.g. "Prep in Appendix: Mint Syrup". */
  prepNote?: string;
  /** Boxed "Chef's Tip" at the foot of the left column. */
  chefTip?: string;
  /** Icon above "Quality Check Points": "leaf" (drinks) or the default check. */
  panelIcon?: string;
  /** Replaces the top-left eyebrow (default: the category name), e.g. "Dessert / Pastry Kitchen SOP". */
  eyebrow?: string;
  /** Small caption strip under the photo, e.g. "Reference drink photo". */
  photoCaption?: string;
  /** Heading of the dark notes panel (default "Chef's Notes"), e.g. "Serving Note". */
  notesTitle?: string;
  /** "Final Assembly" panel: numbered steps + a garnish line. */
  assembly?: string[];
  assemblyGarnish?: string;
  /** "Service Standard" rows (label / value) under the notes. */
  serviceStandard?: { label: string; value: string }[];
}

const STRING_KEYS = ["storeAt", "chillTime", "serveTitle", "serveText", "glassware", "garnishInfo", "methodTitle", "ccp", "platingTitle", "prepNote", "chefTip", "panelIcon", "eyebrow", "photoCaption", "notesTitle", "assemblyGarnish"] as const;

export function dessertExtrasOf(customFields: unknown): DessertExtras | null {
  const c = (customFields as { card?: unknown } | null | undefined)?.card;
  if (!c || typeof c !== "object") return null;
  const rec = c as Record<string, unknown>;
  const out: DessertExtras = {};
  for (const k of STRING_KEYS) {
    const v = rec[k];
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
  }
  if (rec.effectiveInBox === true) out.effectiveInBox = true;
  if (rec.hideEmpty === true) out.hideEmpty = true;
  if (Array.isArray(rec.assembly)) {
    const a = rec.assembly.filter((x): x is string => typeof x === "string" && x.trim() !== "");
    if (a.length) out.assembly = a;
  }
  if (Array.isArray(rec.serviceStandard)) {
    const r = rec.serviceStandard.filter((x): x is { label: string; value: string } => !!x && typeof x.label === "string" && typeof x.value === "string");
    if (r.length) out.serviceStandard = r;
  }
  if (Array.isArray(rec.stats)) {
    const stats = rec.stats
      .filter((s): s is { label: string; value: string; icon: DessertStatIcon } => !!s && typeof s.label === "string" && typeof s.value === "string")
      .map((s) => ({ label: s.label, value: s.value, icon: (DESSERT_STAT_ICONS as readonly string[]).includes(s.icon) ? s.icon : "tag" }));
    if (stats.length) out.stats = stats;
  }
  return Object.keys(out).length ? out : null;
}
