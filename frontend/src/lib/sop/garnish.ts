/** Garnish list for the SOP card, kept in `customFields.garnish` (no schema change needed). */
export function garnishOf(customFields: unknown): string[] {
  const g = (customFields as { garnish?: unknown } | null | undefined)?.garnish;
  return Array.isArray(g) ? g.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim()) : [];
}
