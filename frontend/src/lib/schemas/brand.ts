import { z } from "zod";
import { BrandThemeSchema } from "@/lib/schemas/theme";

/**
 * Kept separate from server/services/brand.ts (which is "server-only" and
 * pulls in Prisma/pg) so client components — the admin brand form's
 * zodResolver needs this schema object at runtime, not just its type — can
 * import it without accidentally bundling the database driver.
 */
export const BrandInputSchema = z.object({
  slug: z.string().trim().min(2).max(60),
  name: z.string().trim().min(1).max(80),
  number: z.number().int().positive(),
  eyebrow: z.string().trim().max(80).optional().nullable(),
  tagline: z.string().trim().max(160).optional().nullable(),
  quote: z.string().trim().max(300).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  handle: z.string().trim().max(60).optional().nullable(),
  followerLabel: z.string().trim().max(20).optional().nullable(),
  status: z.enum(["ACTIVE", "HIDDEN"]).default("ACTIVE"),
  personality: z.string().trim().max(200).optional().nullable(),
  moodFeel: z.string().trim().max(200).optional().nullable(),
  promise: z.string().trim().max(200).optional().nullable(),
  voiceWords: z.array(z.string().trim().max(30)).max(8).default([]),
  sampleLines: z.array(z.string().trim().max(240)).max(20).default([]),
  theme: BrandThemeSchema,
  logoId: z.string().cuid().optional().nullable(),
  markId: z.string().cuid().optional().nullable(),
  ogImageId: z.string().cuid().optional().nullable(),
  seoTitle: z.string().trim().max(70).optional().nullable(),
  seoDescription: z.string().trim().max(170).optional().nullable(),
  sortOrder: z.number().int().default(0),
});
export type BrandInput = z.infer<typeof BrandInputSchema>;
