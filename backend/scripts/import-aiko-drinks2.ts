/**
 * Adds the 7 "AIKO Bar" drinks of rec i.pdf (Melon Fresca, Basil Smash, Lemon Ice Tea, Mint
 * Mojito, Moscow Mule, Pina Colada, Jamun Jamun) to the Aiko DRINKS category, with the
 * photos taken from the PDF (backend/data/aiko-drinks2). They use the Aiko Drinks card's
 * "bar" variant (Technique | Garnish box, Final Assembly panel) in Aiko's black and gold.
 * Safe to re-run: recipes are matched by externalId and replaced.
 *
 *   npx tsx --tsconfig tsconfig.json --conditions=react-server backend/scripts/import-aiko-drinks2.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "@/server/db";
import { uploadImage } from "@/server/media/upload";
import { createRecipe } from "@/server/services/recipe";
import { RecipeInputSchema } from "@/lib/schemas/recipe";

const PHOTOS = path.resolve("backend/data/aiko-drinks2");

interface Drink {
  code: string;
  photo: string;
  slug: string;
  title: string;
  lines: [string, string];
  technique: string;
  garnish: string;
  /** "Name|Quantity" */
  ingredients: string[];
  steps: string[];
  final: string[];
}

const DRINKS: Drink[] = [
  {
    code: "DR-13", photo: "src-1-0.jpeg", slug: "melon-fresca", title: "Melon Fresca", lines: ["MELON", "FRESCA"], technique: "Shake + strain + top up", garnish: "Melon, lemon grass",
    ingredients: ["Lemon grass cordial|30 ml", "Watermelon juice|60 ml", "Ginger zest|1 gm", "Salt|1 pinch", "Ginger ale|Top up"],
    steps: ["Add lemongrass cordial, watermelon juice, ginger zest and salt in a shaker with ice.", "Shake well.", "Pour into a glass using a bar strainer.", "Top up with ginger ale.", "Garnish with melon and lemon grass."],
    final: ["Top up with ginger ale.", "Garnish with melon and lemon grass."],
  },
  {
    code: "DR-14", photo: "src-2-0.jpeg", slug: "basil-smash", title: "Basil Smash", lines: ["BASIL", "SMASH"], technique: "Muddle + shake + strain", garnish: "Cucumber slice",
    ingredients: ["Cucumber|5 slice", "Basil water|30 ml", "Pineapple juice|30 ml", "Orgeat syrup|20 ml", "Lime juice|15 ml", "Sugar syrup|10", "Ginger ale|Top up"],
    steps: ["Add cucumber in a shaker and muddle it.", "Add pineapple juice, orgeat syrup, lemon juice and sugar syrup.", "Add ice and shake well.", "Strain into a glass with a bar strainer.", "Top up with ginger ale.", "Garnish with cucumber slice."],
    final: ["Top up with ginger ale.", "Garnish with cucumber slice."],
  },
  {
    code: "DR-15", photo: "src-3-0.jpeg", slug: "lemon-ice-tea", title: "Lemon Ice Tea", lines: ["LEMON", "ICE TEA"], technique: "Shake", garnish: "Dry lemon",
    ingredients: ["Ice tea|180 ml", "Lemon juice|25 ml", "Sugar syrup|45 ml"],
    steps: ["Take a shaker; add the tea, sugar syrup, lemon juice and ice cubes.", "Shake well.", "Take a glass and add an iced tea ice cube.", "Pour the iced tea over the top and let it froth.", "Garnish with dry lemon."],
    final: ["Pour the iced tea over the top and let it froth.", "Garnish with dry lemon."],
  },
  {
    code: "DR-16", photo: "src-4-0.jpeg", slug: "mint-mojito", title: "Mint Mojito", lines: ["MINT", "MOJITO"], technique: "Build in glass + top up", garnish: "Mint sprig",
    ingredients: ["Salt|1 pinch", "Lemon juice|30 ml", "Sugar syrup|20 ml", "Ice|Full glass", "Mint syrup|60 ml", "Soda|Top up"],
    steps: ["Take a mojito glass.", "Add a pinch of salt, sugar syrup and lemon juice.", "Add a full glass of ice.", "Add mint syrup.", "Top it up with soda to make two glasses.", "Garnish with mint sprig."],
    final: ["Top it up with soda to make two glasses.", "Garnish with mint sprig."],
  },
  {
    code: "DR-17", photo: "src-5-0.jpeg", slug: "moscow-mule", title: "Moscow Mule", lines: ["MOSCOW", "MULE"], technique: "Build in glass + top up", garnish: "Rosemary, lemon slice",
    ingredients: ["Ginger zest|1 pinch", "Lemon juice|30 ml", "Ice cube|Full glass", "Ginger beer|330 ml"],
    steps: ["Take a Moscow mule glass.", "Add ginger zest and lemon juice.", "Add ice cube.", "Top up with ginger beer.", "Garnish with rosemary and lemon slice."],
    final: ["Top up with ginger beer.", "Garnish with rosemary and lemon slice."],
  },
  {
    code: "DR-18", photo: "src-6-0.jpeg", slug: "pina-colada", title: "Pina Colada", lines: ["PINA", "COLADA"], technique: "Blend", garnish: "Pineapple slice & pineapple leaf",
    ingredients: ["Milk|60 ml", "Coconut milk|60 ml", "Ice cube|50 gm", "Pineapple jam|120 gm", "Vanilla ice cream|1 scoop"],
    steps: ["Take one JTC jar.", "Add milk, coconut milk, pineapple jam, ice cube and vanilla ice cream.", "Blend it all together.", "Pour into a pina colada glass.", "Garnish with pineapple slice and pineapple leaf."],
    final: ["Pour into a pina colada glass.", "Garnish with pineapple slice and pineapple leaf."],
  },
  {
    code: "DR-19", photo: "src-7-0.jpeg", slug: "jamun-jamun", title: "Jamun Jamun", lines: ["JAMUN", "JAMUN"], technique: "Stir + top up", garnish: "Jamun candy",
    ingredients: ["Chat masala|1.5 pinch", "Lemon|15 ml", "Sugar syrup|10 ml", "Jamun juice|120 ml", "Ginger syrup|5 ml", "Ginger ale|Top up"],
    steps: ["Take a Jamun Jamun glass.", "Add chat masala, lemon juice, ginger syrup and jamun syrup.", "Stir it.", "Add ice cube.", "Top with ginger ale.", "Garnish with jamun candy."],
    final: ["Top with ginger ale.", "Garnish with jamun candy."],
  },
];

function parseQty(text: string): { quantity: number | null; unit: string | null } {
  const m = text.match(/^(\d+(?:\.\d*[1-9])?)(?:\s+(\S.*))?$/);
  if (m) return { quantity: Number(m[1]), unit: m[2] ?? null };
  return { quantity: null, unit: text };
}

async function main() {
  const brand = await db.brand.findUniqueOrThrow({ where: { slug: "aiko" } });
  const admin = await db.admin.findFirstOrThrow({ where: { role: "OWNER", isActive: true } });
  const category = await db.category.findUniqueOrThrow({ where: { brandId_slug: { brandId: brand.id, slug: "drinks" } } });

  for (const s of DRINKS) {
    const externalId = `AIKO-${s.code}`;
    const old = await db.recipe.findMany({ where: { brandId: brand.id, externalId }, select: { id: true } });
    if (old.length) await db.recipe.deleteMany({ where: { id: { in: old.map((r) => r.id) } } });

    const media = await uploadImage({
      buffer: readFileSync(path.join(PHOTOS, s.photo)),
      originalName: `${s.slug}.jpg`,
      alt: s.title,
      brandId: brand.id,
      uploadedById: admin.id,
    });

    const rows = s.ingredients.map((r) => r.split("|"));
    const input = RecipeInputSchema.parse({
      brandId: brand.id,
      categoryId: category.id,
      externalId,
      slug: s.slug,
      title: s.title,
      excerpt: `${s.title} – ${s.technique}`.slice(0, 220),
      heroImageId: media.id,
      dietary: [],
      plating: s.garnish,
      customFields: {
        drink: {
          titleLines: s.lines,
          info: [{ label: "Technique", value: s.technique }, { label: "Garnish", value: s.garnish }],
          qty: rows.map((r) => r[1]),
          bar: { finalAssembly: s.final, garnish: s.garnish, plating: s.garnish, caption: "REFERENCE DRINK PHOTO" },
        },
      },
      ingredients: rows.map(([name, qty], position) => {
        const { quantity, unit } = parseQty(qty);
        return { position, groupLabel: null, quantity, unit, name, raw: `${name} ${qty}` };
      }),
      steps: s.steps.map((body, position) => ({ phase: "COOK" as const, position, title: null, body })),
      status: "PUBLISHED",
    });
    const recipe = await createRecipe(input, admin);
    console.log(`✓ ${s.code} ${s.title} → /aiko/recipes/${recipe.slug}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
