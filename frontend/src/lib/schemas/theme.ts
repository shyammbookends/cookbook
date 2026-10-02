import { z } from "zod";

/**
 * A brand's visual identity, stored as JSON on Brand.theme and turned into
 * CSS variables by `themeToCssVars`. Colours are sampled from the brand-book
 * screenshots (see the plan doc) — swap them here once official hex codes
 * are confirmed, no code changes needed elsewhere.
 */
export const BrandThemeSchema = z.object({
  bg: z.string(), // page background
  fg: z.string(), // primary text / logo colour on bg
  numeral: z.string(), // faded giant-numeral tint
  accent: z.string(), // eyebrow / highlight colour
  accentSoft: z.string().optional(), // secondary accent (e.g. Ghaslet's yellow)
  cardBg: z.string().optional(), // recipe card background (defaults to bg)
  cardFg: z.string().optional(), // recipe card text (defaults to fg)
  muted: z.string().optional(), // secondary/body text
  gradient: z.array(z.string()).optional(), // e.g. Ghaslet's flame bar
  fontDisplay: z.enum(["script", "marker", "flared-serif", "grotesk", "heavy"]).default("heavy"),
  fontBody: z.enum(["serif-italic", "sans"]).default("serif-italic"),
  motion: z.enum(["loud", "slow-burn", "calm", "feral"]).default("calm"),
  /** Which recipe/SOP card design this brand uses (see lib/sop/templates.ts). */
  sopTemplate: z.enum(["classic", "aiko"]).optional(),
});

export type BrandTheme = z.infer<typeof BrandThemeSchema>;

export function themeToCssVars(theme: BrandTheme): Record<string, string> {
  return {
    "--brand-bg": theme.bg,
    "--brand-fg": theme.fg,
    "--brand-numeral": theme.numeral,
    "--brand-accent": theme.accent,
    "--brand-accent-soft": theme.accentSoft ?? theme.accent,
    "--brand-card-bg": theme.cardBg ?? theme.bg,
    "--brand-card-fg": theme.cardFg ?? theme.fg,
    "--brand-muted": theme.muted ?? theme.fg,
    "--brand-gradient": theme.gradient?.length ? theme.gradient.join(", ") : theme.accent,
  };
}
