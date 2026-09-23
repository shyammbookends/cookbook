import "dotenv/config";
import { PrismaClient } from "../../frontend/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
import type { BrandTheme } from "../../frontend/src/lib/schemas/theme";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// Colours + voice sourced from the Digit Works "Brand Understanding Document"
// (Jun 2026) — the group's own 18-part read of each Instagram account. Beshak
// isn't covered by that document at all (it's a 4-brand review: Bookends,
// Capiche, Aiko, Ghaslet), so Beshak keeps placeholder content below until
// its own brand material is available.
const BRANDS: {
  slug: string; name: string; number: number; eyebrow: string; tagline: string;
  quote: string; description: string; handle: string; followerLabel: string;
  personality: string; moodFeel: string; promise: string; voiceWords: string[]; sampleLines: string[];
  theme: BrandTheme;
}[] = [
  {
    slug: "capiche", name: "Capiche", number: 1, eyebrow: "THE FLAGSHIP",
    tagline: "Hot pies · Big slices · Very little nonsense",
    quote: "Surat's loudest slice. A New York pizza joint with streetwear-crew energy that sells attitude and belonging as much as it sells pizza.",
    description: "A loud, lowercase neighbourhood pizza joint that's quietly becoming a youth-culture label — it sells cravings, comedy and a crew you want to belong to.",
    handle: "@pizza.capiche", followerLabel: "~22.1K",
    personality: "The charismatic friend who knows everyone at the party — quick-witted, generous, hypes the crew before himself.",
    moodFeel: "Hot, fast, fun — diner-nostalgia meeting streetwear. My spot, my people.",
    promise: "Hot pies, big slices, very little nonsense. Capiche?",
    voiceWords: ["Loud", "Lowercase", "Cheeky", "Warm", "Confident"],
    sampleLines: [
      "new pie just dropped. you know what to do ;)",
      "\"best slice in surat, no notes\" — a regular. we're not crying, you are.",
      "fold it or don't. just don't embarrass the slice.",
      "crew friday. the people who make the magic (and the mess).",
      "added ghaslet to the diavola. consider this your warning ;)",
      "tag the friend who says \"just one slice\" and orders three.",
      "hot pies, big slices, very little nonsense. capiche?",
    ],
    theme: {
      bg: "#EE1E25", fg: "#F5ECDC", numeral: "#F15050", accent: "#FFE3CC", accentSoft: "#145A32",
      cardBg: "#F5ECDC", cardFg: "#1A0A0A", muted: "#FFD9C2",
      fontDisplay: "script", fontBody: "serif-italic", motion: "loud",
    },
  },
  {
    slug: "aiko", name: "Aiko", number: 2, eyebrow: "THE SLOW-BURN FAVOURITE",
    tagline: "Asian inspired komfort · Surat · Ahmedabad",
    quote: "Komfort, with a K. An editorial, sensory Asian-comfort kitchen that tells food like a slow, warm story — by the third bite you're fully committed.",
    description: "A warm, editorial Asian-comfort kitchen that sells komfort and craft — food shot like a story, not a menu.",
    handle: "@aikomfort", followerLabel: "~11.4K",
    personality: "The calm, stylish friend who cooks for you — soft-spoken, tasteful, a little artsy, deeply hospitable.",
    moodFeel: "Cozy, slow, tactile — steam and soft daylight, the chopstick lift.",
    promise: "Komfort, with a K — by the third bite, you're fully committed.",
    voiceWords: ["Warm", "Sensory", "Editorial", "Calm", "Considered"],
    sampleLines: [
      "steam first. questions later.",
      "a 12-hour broth that doesn't rush, so you don't have to.",
      "by the third bite, you're fully committed. komfort, with a K.",
      "the open bao — because the best part shouldn't hide.",
      "your komfort order is waiting. you already know which one.",
      "a little chilli crisp makes everything braver.",
      "dessert isn't an afterthought here. it's the closing line.",
    ],
    theme: {
      bg: "#EFB22C", fg: "#0A0A0A", numeral: "#F5D385", accent: "#6B4A12", accentSoft: "#FF6B4A",
      cardBg: "#FFF7E3", cardFg: "#0A0A0A", muted: "#3B2A0E",
      fontDisplay: "marker", fontBody: "serif-italic", motion: "slow-burn",
    },
  },
  {
    slug: "beshak", name: "Beshak", number: 3, eyebrow: "",
    tagline: "",
    quote: "",
    description: "",
    handle: "", followerLabel: "",
    personality: "", moodFeel: "", promise: "", voiceWords: [], sampleLines: [],
    theme: {
      bg: "#1F2338", fg: "#FFFFFF", numeral: "#3A3F5C", accent: "#D64B2C",
      cardBg: "#F4EFE7", cardFg: "#1F2338", muted: "#B7BAD0",
      fontDisplay: "flared-serif", fontBody: "sans", motion: "calm",
    },
  },
  {
    slug: "ghaslet", name: "Ghaslet", number: 4, eyebrow: "THE STRONGEST IDENTITY, SMALLEST STAGE",
    tagline: "Dangerously addictive handcrafted heat",
    quote: "The house's most feral, most ownable identity — a punk, kerosene-joke hot sauce on its smallest stage, growing on its siblings' borrowed reach.",
    description: "A punk, meme-fluent house hot sauce — the name is the joke (ghaslet = kerosene) — with the loudest identity in the group and the smallest audience to hear it.",
    handle: "@ghaslet.in", followerLabel: "~418",
    personality: "The unhinged, funniest friend who dares you to do the stupid thing — feral, confident, chaotic, never trying to be liked.",
    moodFeel: "Hot, dangerous, hilarious — band poster meets hazard sign.",
    promise: "Dangerously addictive handcrafted heat. No mercy, only damage.",
    voiceWords: ["Punk", "Irreverent", "Lowercase", "Meme-fluent", "Heat-obsessed"],
    sampleLines: [
      "bet you can't finish gates of hell without crying. you will. you'll reorder.",
      "fridge empty, ghaslet full. dinner is a spoon and a bad decision.",
      "you said make it spicy. blame ghaslet for what's coming ;)",
      "NO MERCY ONLY DAMAGE.",
      "ghaslet = kerosene. your tongue = the wick.",
      "\"is it too spicy?\" yes. that's the point. next question.",
      "put it on the capiche diavola. we regret nothing.",
    ],
    theme: {
      bg: "#0B0B0B", fg: "#FFFFFF", numeral: "#6B3515", accent: "#F0802A", accentSoft: "#E8B81F",
      gradient: ["#F9C21A", "#F37A21", "#EE1D24", "#E8397F"],
      cardBg: "#161616", cardFg: "#FFFFFF", muted: "#B8ADA0",
      fontDisplay: "marker", fontBody: "sans", motion: "feral",
    },
  },
];

async function main() {
  console.log("Seeding brands...");
  const brandRecords: Record<string, { id: string }> = {};
  for (const b of BRANDS) {
    const brand = await db.brand.upsert({
      where: { slug: b.slug },
      create: {
        slug: b.slug, name: b.name, number: b.number, eyebrow: b.eyebrow || null,
        tagline: b.tagline || null, quote: b.quote || null, description: b.description || null,
        handle: b.handle || null, followerLabel: b.followerLabel || null,
        personality: b.personality || null, moodFeel: b.moodFeel || null, promise: b.promise || null,
        voiceWords: b.voiceWords, sampleLines: b.sampleLines,
        status: "ACTIVE", theme: b.theme as object, sortOrder: b.number,
        seoTitle: `${b.name} | Bookends Hospitality`,
        seoDescription: b.description || b.tagline || null,
      },
      update: {
        // Re-running the seed refreshes brand-voice content (safe: these
        // fields aren't admin-editable-and-precious yet — see README gaps).
        eyebrow: b.eyebrow || null, tagline: b.tagline || null, quote: b.quote || null,
        description: b.description || null, handle: b.handle || null, followerLabel: b.followerLabel || null,
        personality: b.personality || null, moodFeel: b.moodFeel || null, promise: b.promise || null,
        voiceWords: b.voiceWords, sampleLines: b.sampleLines, theme: b.theme as object,
      },
    });
    brandRecords[b.slug] = brand;
  }

  const bookendsData = {
    eyebrow: "THE PARENT · THE SLEEPING GIANT",
    tagline: "We believe in unreasonable hospitality.",
    quote: "The refined parent that sells trust — premium catering, venues and an employer brand, told cinematically. The house's credibility, and its single biggest growth lever.",
    description: "Becoming a premium catering name and the place great hospitality people want to work — the house behind Capiche, Aiko, Beshak and Ghaslet.",
    handle: "@bookendshospitality", followerLabel: "~727",
    personality: "The polished, warm host who runs the whole operation — gracious, ambitious, understated-luxury, genuinely people-first.",
    moodFeel: "Cinematic, celebratory, prestige — warm-tungsten evenings, big rooms, real emotion.",
    promise: "We believe in unreasonable hospitality — and then we go further.",
    voiceWords: ["Refined", "Warm", "Editorial", "Aspirational", "Sincere"],
    sampleLines: [
      "We believe in unreasonable hospitality — and then we go further.",
      "Every detail, considered. Every guest, remembered. The Bookends way.",
      "From prep to last pour — a celebration, catered end to end.",
      "A team of a soon-to-be million. This is what building together looks like.",
      "We hire for heart first. Skill we can teach.",
      "Behind four brands is one obsession: how it feels to be hosted well.",
      "Hospitality is the product. Everything else is detail.",
    ],
  };

  await db.brand.upsert({
    where: { slug: "bookends" },
    create: {
      slug: "bookends", name: "Bookends Hospitality", number: 0,
      ...bookendsData,
      status: "HIDDEN", // it's the portal itself, not a brand page — see homepage
      theme: {
        bg: "#0A2399", fg: "#FFFFFF", numeral: "#2A44AE", accent: "#C6E86B", accentSoft: "#F2A9C8",
        cardBg: "#0A2399", cardFg: "#FFFFFF", muted: "#8EA2FF",
        fontDisplay: "heavy", fontBody: "serif-italic", motion: "calm",
      } as object,
      sortOrder: -1,
    },
    update: bookendsData,
  });

  console.log("Seeding categories...");
  const categorySeed: Record<string, string[]> = {
    capiche: ["Pizzas", "Sides", "Sauces"],
    aiko: ["Noodles", "Rice Bowls", "Small Plates"],
    beshak: ["Signature", "Classics"],
    ghaslet: ["Hot Sauces", "Marinades"],
  };
  const categoryRecords: Record<string, { id: string }> = {};
  for (const [brandSlug, names] of Object.entries(categorySeed)) {
    for (const [i, name] of names.entries()) {
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      const cat = await db.category.upsert({
        where: { brandId_slug: { brandId: brandRecords[brandSlug].id, slug } },
        create: { brandId: brandRecords[brandSlug].id, slug, name, sortOrder: i },
        update: {},
      });
      categoryRecords[`${brandSlug}:${slug}`] = cat;
    }
  }

  console.log("Seeding owner admin...");
  const ownerEmail = process.env.SEED_OWNER_EMAIL || "reservation.bookends@gmail.com";
  const existingOwner = await db.admin.findUnique({ where: { email: ownerEmail } });
  if (!existingOwner) {
    const tempPassword = `Bookends-${Math.random().toString(36).slice(2, 10)}!`;
    await db.admin.create({
      data: {
        email: ownerEmail,
        name: "Bookends Owner",
        passwordHash: await hash(tempPassword, { memoryCost: 19456, timeCost: 2, parallelism: 1 }),
        role: "OWNER",
      },
    });
    console.log("─".repeat(60));
    console.log(`Owner admin created: ${ownerEmail}`);
    console.log(`Temporary password:  ${tempPassword}`);
    console.log("Change this after your first login.");
    console.log("─".repeat(60));
  }

  console.log("Seeding one sample recipe per brand...");
  const sampleRecipes: Record<string, { title: string; categorySlug: string; excerpt: string }> = {
    capiche: { title: "Hot Honey Pepperoni", categorySlug: "pizzas", excerpt: "Sweet heat, big crunch, extra napkins." },
    aiko: { title: "Miso Butter Udon", categorySlug: "noodles", excerpt: "Slow-melted miso butter, slurp-worthy noodles." },
    beshak: { title: "Butter Chicken", categorySlug: "signature", excerpt: "The classic, done beshak — without a doubt." },
    ghaslet: { title: "Ghaslet Original Hot Sauce", categorySlug: "hot-sauces", excerpt: "Dangerously addictive, handcrafted heat." },
  };

  for (const [brandSlug, r] of Object.entries(sampleRecipes)) {
    const brand = brandRecords[brandSlug];
    const category = categoryRecords[`${brandSlug}:${r.categorySlug}`];
    const slug = r.title.toLowerCase().replace(/\s+/g, "-");
    const existing = await db.recipe.findFirst({ where: { brandId: brand.id, slug } });
    if (existing) continue;

    await db.recipe.create({
      data: {
        brandId: brand.id,
        categoryId: category?.id ?? null,
        slug,
        title: r.title,
        excerpt: r.excerpt,
        description: `${r.title} — a placeholder recipe seeded for development. Replace with real content from the admin panel.`,
        prepMinutes: 20,
        cookMinutes: 25,
        totalMinutes: 45,
        servings: 4,
        difficulty: "MEDIUM",
        status: "PUBLISHED",
        publishedAt: new Date(),
        featured: true,
        ingredientText: "placeholder ingredients",
        createdById: existingOwner?.id,
        ingredients: {
          create: [
            { position: 0, name: "Main ingredient", raw: "500 g main ingredient" },
            { position: 1, name: "Seasoning", raw: "1 tsp seasoning" },
          ],
        },
        steps: {
          create: [
            { phase: "PREP", position: 0, body: "Prep all ingredients." },
            { phase: "COOK", position: 0, body: "Cook until done." },
          ],
        },
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
