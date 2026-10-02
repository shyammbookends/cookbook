/**
 * Recipe/SOP card designs. Each brand picks one through `theme.sopTemplate`;
 * brands without one use the original "classic" card (Capiche's).
 * To add a brand design: add its key here and in BrandThemeSchema, build its
 * card (see lib/sop/aiko.ts), and branch on the key in SopCard and the print builder.
 */
export const SOP_TEMPLATES = [
  { key: "classic", label: "Classic (Capiche)" },
  { key: "aiko", label: "Aiko Kitchen" },
] as const;

export type SopTemplateKey = (typeof SOP_TEMPLATES)[number]["key"];

export function sopTemplateOf(theme: unknown): SopTemplateKey {
  const key = (theme as { sopTemplate?: unknown } | null)?.sopTemplate;
  return SOP_TEMPLATES.some((t) => t.key === key) ? (key as SopTemplateKey) : "classic";
}
