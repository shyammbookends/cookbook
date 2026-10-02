/**
 * Exact wording for the Prep / Cook / Total stats ("3–4 min", "~6 min"), kept in
 * `customFields.timeText` so ranges survive next to the numeric minute columns.
 * Missing entries fall back to "<minutes> min".
 */
export interface TimeText {
  prep?: string;
  cook?: string;
  total?: string;
}

export function timeTextOf(customFields: unknown): TimeText | null {
  const t = (customFields as { timeText?: unknown } | null | undefined)?.timeText;
  if (!t || typeof t !== "object") return null;
  const pick = (k: keyof TimeText) => {
    const v = (t as Record<string, unknown>)[k];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  const out = { prep: pick("prep"), cook: pick("cook"), total: pick("total") };
  return out.prep || out.cook || out.total ? out : null;
}
