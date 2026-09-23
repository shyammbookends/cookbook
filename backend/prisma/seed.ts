import "dotenv/config";
import { PrismaClient } from "../../frontend/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
import type { BrandTheme } from "../../frontend/src/lib/schemas/theme";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

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
    slug: "beshak", name: "Beshak", number: 3, eyebrow: "UNQUESTIONABLY AUTHENTIC",
    tagline: "North Indian Delicacies · Fine Hospitality",
    quote: "Rich, aromatic North Indian recipes crafted with uncompromising heritage spices and slow-cooking techniques.",
    description: "Authentic culinary heritage meets refined modern dining — serving rich curries, kebabs, and aromatic biryanis.",
    handle: "@beshak.dining", followerLabel: "~8.9K",
    personality: "The noble, warm host passionate about rich flavours and traditional royal recipes.",
    moodFeel: "Rich, ambient, luxurious — warm lights, clay pots, fragrant spices.",
    promise: "Unquestionably authentic flavours, served with genuine warmth.",
    voiceWords: ["Heritage", "Rich", "Aromatic", "Royal", "Authentic"],
    sampleLines: [
      "cooked slow, served with pride.",
      "every spice has a story, every dish has a soul.",
      "authentic without compromise. beshak.",
    ],
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

async function createMedia(imageUrl: string, alt: string) {
  return db.media.create({
    data: {
      kind: "IMAGE",
      storageKey: imageUrl,
      originalName: `${alt.toLowerCase().replace(/\s+/g, "_")}.jpg`,
      mime: "image/jpeg",
      bytes: 204800,
      width: 1200,
      height: 800,
      variants: [
        { w: 1200, format: "webp", key: imageUrl },
        { w: 1200, format: "avif", key: imageUrl },
      ],
      status: "READY",
      sha256: Math.random().toString(36).substring(2) + Date.now().toString(36),
    },
  });
}

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
    quote: "The refined parent that sells trust — premium catering, venues and an employer brand, told cinematically.",
    description: "Becoming a premium catering name and the place great hospitality people want to work.",
    handle: "@bookendshospitality", followerLabel: "~727",
    personality: "The polished, warm host who runs the whole operation.",
    moodFeel: "Cinematic, celebratory, prestige.",
    promise: "We believe in unreasonable hospitality — and then we go further.",
    voiceWords: ["Refined", "Warm", "Editorial", "Aspirational", "Sincere"],
    sampleLines: ["We believe in unreasonable hospitality — and then we go further."],
  };

  await db.brand.upsert({
    where: { slug: "bookends" },
    create: {
      slug: "bookends", name: "Bookends Hospitality", number: 0,
      ...bookendsData,
      status: "HIDDEN",
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
  const categorySeed: Record<string, { name: string; image: string }[]> = {
    capiche: [
      { name: "Main Menu", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80" },
      { name: "Drinks", image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80" },
      { name: "Desserts", image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=800&q=80" }
    ],
    aiko: [
      { name: "Main Menu", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80" },
      { name: "Drinks", image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80" },
      { name: "Desserts", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80" }
    ],
    beshak: [
      { name: "Main Menu", image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80" },
      { name: "Drinks", image: "https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=800&q=80" },
      { name: "Desserts", image: "https://images.unsplash.com/photo-1605197586548-0de1b9ef08b5?auto=format&fit=crop&w=800&q=80" }
    ],
    ghaslet: [
      { name: "Main Menu", image: "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=800&q=80" },
      { name: "Drinks", image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80" },
      { name: "Desserts", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80" }
    ],
  };

  const categoryRecords: Record<string, { id: string }> = {};
  for (const [brandSlug, items] of Object.entries(categorySeed)) {
    for (const [i, catItem] of items.entries()) {
      const slug = catItem.name.toLowerCase().replace(/\s+/g, "-");
      const catMedia = await createMedia(catItem.image, catItem.name);
      const cat = await db.category.upsert({
        where: { brandId_slug: { brandId: brandRecords[brandSlug].id, slug } },
        create: { brandId: brandRecords[brandSlug].id, slug, name: catItem.name, imageId: catMedia.id, sortOrder: i },
        update: { imageId: catMedia.id },
      });
      categoryRecords[`${brandSlug}:${slug}`] = cat;
    }
  }

  console.log("Seeding owner admin...");
  const ownerEmail = process.env.SEED_OWNER_EMAIL || "reservation.bookends@gmail.com";
  let existingOwner = await db.admin.findUnique({ where: { email: ownerEmail } });
  if (!existingOwner) {
    const tempPassword = `Bookends-${Math.random().toString(36).slice(2, 10)}!`;
    existingOwner = await db.admin.create({
      data: {
        email: ownerEmail,
        name: "Bookends Owner",
        passwordHash: await hash(tempPassword, { memoryCost: 19456, timeCost: 2, parallelism: 1 }),
        role: "OWNER",
      },
    });
  }

  console.log("Seeding recipes for main-menu, drinks, desserts...");

  interface RecipeSeedItem {
    brandSlug: string;
    categorySlug: string;
    title: string;
    excerpt: string;
    imageUrl: string;
    dishCode: string;
    prepMinutes: number;
    cookMinutes: number;
    servings: number;
    yieldText: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    ingredients: { name: string; quantity?: number; unit?: string; raw: string }[];
    steps: { phase: "PREP" | "COOK" | "FINISH"; body: string }[];
    miseEnPlace: string[];
    equipment: string[];
    plating: string;
    holding: string;
    allergens: string;
    dietary?: string[];
  }

  const RECIPES_DATA: RecipeSeedItem[] = [
    // === CAPICHE ===
    // Main Menu
    {
      brandSlug: "capiche", categorySlug: "main-menu",
      title: "Hot Honey Pepperoni Pizza",
      excerpt: "Sweet heat, crispy pepperoni cups, and 48-hour fermented sourdough.",
      imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1200&q=80",
      dishCode: "CAP-MM-01", prepMinutes: 25, cookMinutes: 15, servings: 4, yieldText: "8 slices", difficulty: "MEDIUM",
      ingredients: [
        { name: "Sourdough Pizza Dough", quantity: 300, unit: "g", raw: "300g 48-hour sourdough pizza dough" },
        { name: "San Marzano Tomato Sauce", quantity: 90, unit: "ml", raw: "90ml crushed San Marzano tomato sauce" },
        { name: "Fresh Mozzarella", quantity: 120, unit: "g", raw: "120g fresh mozzarella, torn" },
        { name: "Cupping Pepperoni", quantity: 80, unit: "g", raw: "80g thin slice cupping pepperoni" },
        { name: "Hot Chili Honey", quantity: 30, unit: "ml", raw: "30ml habanero infused hot honey drizzle" }
      ],
      steps: [
        { phase: "PREP", body: "Stretch sourdough ball into a 12-inch round on semolina-dusted counter." },
        { phase: "COOK", body: "Ladle sauce, spread mozzarella and pepperoni cups. Bake at 450°C for 4 minutes." },
        { phase: "FINISH", body: "Drizzle hot honey, scatter basil, slice into 8 pieces and serve hot." }
      ],
      miseEnPlace: ["Grind parmesan", "Warm hot honey drizzle"],
      equipment: ["Pizza Stone", "Pizza Peel"],
      plating: "Round wooden pizza board lined with parchment.",
      holding: "Serve fresh. Hold in hot box max 15 mins.",
      allergens: "Gluten, Dairy"
    },
    {
      brandSlug: "capiche", categorySlug: "main-menu",
      title: "Truffle Mushroom & Burrata Pizza",
      excerpt: "Wild roasted mushrooms, black truffle cream, and fresh creamy burrata.",
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
      dishCode: "CAP-MM-02", prepMinutes: 20, cookMinutes: 12, servings: 4, yieldText: "8 slices", difficulty: "MEDIUM",
      ingredients: [
        { name: "Sourdough Dough Ball", quantity: 300, unit: "g", raw: "300g sourdough dough" },
        { name: "Truffle Ricotta Cream", quantity: 80, unit: "g", raw: "80g black truffle cream" },
        { name: "Wild Mushrooms", quantity: 150, unit: "g", raw: "150g sauteed wild mushrooms" },
        { name: "Fresh Burrata", quantity: 125, unit: "g", raw: "1 ball fresh creamy burrata" }
      ],
      steps: [
        { phase: "PREP", body: "Saute wild mushrooms in garlic butter until golden." },
        { phase: "COOK", body: "Spread truffle base, top with mushrooms and bake for 4 minutes." },
        { phase: "FINISH", body: "Place burrata in center, tear open, drizzle with EVOO." }
      ],
      miseEnPlace: ["Saute wild mushrooms"],
      equipment: ["Pizza Oven"],
      plating: "Wooden board with shaved black truffle.",
      holding: "Serve immediately.",
      allergens: "Gluten, Dairy"
    },
    // Drinks
    {
      brandSlug: "capiche", categorySlug: "drinks",
      title: "Capiche Italian Blood Orange Soda",
      excerpt: "Sparkling Sicilian blood orange elixir infused with rosemary & crushed ice.",
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
      dishCode: "CAP-DR-01", prepMinutes: 5, cookMinutes: 0, servings: 1, yieldText: "350 ml", difficulty: "EASY",
      ingredients: [
        { name: "Sicilian Blood Orange Juice", quantity: 150, unit: "ml", raw: "150ml fresh Sicilian blood orange juice" },
        { name: "Sparkling Soda Water", quantity: 150, unit: "ml", raw: "150ml chilled sparkling water" },
        { name: "Rosemary Syrup", quantity: 20, unit: "ml", raw: "20ml house rosemary simple syrup" }
      ],
      steps: [
        { phase: "PREP", body: "Fill tall glass with crushed ice, pour blood orange juice and rosemary syrup." },
        { phase: "FINISH", body: "Top with sparkling soda, stir gently, garnish with charred rosemary sprig." }
      ],
      miseEnPlace: ["Squeeze fresh blood orange juice", "Make rosemary syrup"],
      equipment: ["Highball Glass", "Bar Spoon"],
      plating: "Tall highball glass with dehydated orange wheel.",
      holding: "Serve immediately with straw.",
      allergens: "None"
    },
    {
      brandSlug: "capiche", categorySlug: "drinks",
      title: "Iced Espresso Tonic",
      excerpt: "Double shot dark roast espresso over chilled citrus tonic water & ice.",
      imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=80",
      dishCode: "CAP-DR-02", prepMinutes: 5, cookMinutes: 0, servings: 1, yieldText: "300 ml", difficulty: "EASY",
      ingredients: [
        { name: "Double Shot Espresso", quantity: 60, unit: "ml", raw: "60ml fresh hot double espresso shot" },
        { name: "Premium Tonic Water", quantity: 180, unit: "ml", raw: "180ml chilled Indian tonic water" },
        { name: "Grapefruit Peel", quantity: 1, unit: "pc", raw: "1 slice grapefruit peel twist" }
      ],
      steps: [
        { phase: "PREP", body: "Fill tumbler glass with clear ice cubes, pour tonic water." },
        { phase: "FINISH", body: "Float double espresso shot over tonic water layer. Express grapefruit peel over glass." }
      ],
      miseEnPlace: ["Pull espresso shot"],
      equipment: ["Espresso Machine", "Tumbler Glass"],
      plating: "Layered glass showing dark espresso floating over tonic.",
      holding: "Serve immediately.",
      allergens: "None"
    },
    // Desserts
    {
      brandSlug: "capiche", categorySlug: "desserts",
      title: "Classico Tiramisu Pot",
      excerpt: "Espresso soaked ladyfingers layered with whipped mascarpone cream & cocoa.",
      imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=1200&q=80",
      dishCode: "CAP-DS-01", prepMinutes: 20, cookMinutes: 0, servings: 2, yieldText: "2 pots", difficulty: "EASY",
      ingredients: [
        { name: "Savoiardi Ladyfingers", quantity: 8, unit: "pcs", raw: "8 Italian ladyfingers" },
        { name: "Espresso & Kahlua Soak", quantity: 100, unit: "ml", raw: "100ml sweetened cold espresso" },
        { name: "Mascarpone Cream", quantity: 200, unit: "g", raw: "200g whipped vanilla mascarpone cream" },
        { name: "Dark Cocoa Powder", quantity: 10, unit: "g", raw: "10g Valrhona dark cocoa" }
      ],
      steps: [
        { phase: "PREP", body: "Dip ladyfingers into espresso soak for 2 seconds per side." },
        { phase: "FINISH", body: "Layer dipped cookies and mascarpone cream in glass jar, dust heavily with dark cocoa powder." }
      ],
      miseEnPlace: ["Whip mascarpone cream", "Brew strong espresso"],
      equipment: ["Glass Jars", "Sifter"],
      plating: "Individual glass dessert jar with mint leaf.",
      holding: "Chill in fridge up to 48 hours.",
      allergens: "Dairy, Eggs, Gluten"
    },
    {
      brandSlug: "capiche", categorySlug: "desserts",
      title: "Nutella Woodfired Calzone",
      excerpt: "Crispy pizza dough stuffed with warm Nutella, toasted hazelnut & mascarpone.",
      imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=80",
      dishCode: "CAP-DS-02", prepMinutes: 10, cookMinutes: 8, servings: 2, yieldText: "1 calzone", difficulty: "EASY",
      ingredients: [
        { name: "Pizza Dough", quantity: 200, unit: "g", raw: "200g pizza dough round" },
        { name: "Nutella Chocolate Hazelnut Spread", quantity: 100, unit: "g", raw: "100g creamy Nutella" },
        { name: "Crushed Roasted Hazelnuts", quantity: 30, unit: "g", raw: "30g toasted hazelnuts" },
        { name: "Powdered Sugar", quantity: 15, unit: "g", raw: "15g powdered sugar" }
      ],
      steps: [
        { phase: "PREP", body: "Fill half of dough with Nutella and roasted hazelnuts, fold over and crimp edges tightly." },
        { phase: "COOK", body: "Bake in pizza oven for 6-8 minutes until golden and puffed." },
        { phase: "FINISH", body: "Dust generously with powdered sugar and serve hot." }
      ],
      miseEnPlace: ["Roast and crush hazelnuts"],
      equipment: ["Pizza Oven"],
      plating: "Served hot on wooden paddle with vanilla ice cream scoop.",
      holding: "Serve fresh.",
      allergens: "Tree Nuts, Dairy, Gluten"
    },

    // === AIKO ===
    // Main Menu
    {
      brandSlug: "aiko", categorySlug: "main-menu",
      title: "Miso Butter Udon Noodles",
      excerpt: "Thick udon noodles tossed in rich miso butter, scallions, and a jammy soy egg.",
      imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
      dishCode: "AIK-MM-01", prepMinutes: 15, cookMinutes: 10, servings: 1, yieldText: "1 bowl", difficulty: "EASY",
      ingredients: [
        { name: "Sanuki Udon Noodles", quantity: 200, unit: "g", raw: "200g fresh udon noodles" },
        { name: "White Miso Butter", quantity: 40, unit: "g", raw: "40g white miso butter" },
        { name: "Soy Soft Egg", quantity: 1, unit: "pc", raw: "1 soy marinated soft egg" }
      ],
      steps: [
        { phase: "COOK", body: "Boil udon for 3 minutes, toss in warm pan with miso butter." },
        { phase: "FINISH", body: "Plate in stoneware bowl, top with halved soy egg and scallions." }
      ],
      miseEnPlace: ["Boil soy eggs", "Whisk miso butter"],
      equipment: ["Wok / Saute Pan"],
      plating: "Deep ceramic bowl with bamboo chopsticks.",
      holding: "Serve hot.",
      allergens: "Soy, Gluten, Eggs, Dairy"
    },
    {
      brandSlug: "aiko", categorySlug: "main-menu",
      title: "Chicken Katsu Curry Donburi",
      excerpt: "Golden panko chicken cutlet over Japanese rice with rich aromatic curry sauce.",
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80",
      dishCode: "AIK-MM-02", prepMinutes: 20, cookMinutes: 15, servings: 1, yieldText: "1 bowl", difficulty: "MEDIUM",
      ingredients: [
        { name: "Panko Chicken Cutlet", quantity: 180, unit: "g", raw: "180g panko breaded chicken cutlet" },
        { name: "Japanese Rice", quantity: 200, unit: "g", raw: "200g steamed short grain rice" },
        { name: "Japanese Curry Sauce", quantity: 150, unit: "ml", raw: "150ml Japanese curry sauce" }
      ],
      steps: [
        { phase: "COOK", body: "Fry chicken cutlet until golden crispy. Slice into strips." },
        { phase: "FINISH", body: "Pack rice into bowl, arrange katsu strips, ladle warm curry sauce." }
      ],
      miseEnPlace: ["Bread chicken cutlets", "Simmer Japanese curry"],
      equipment: ["Fryer"],
      plating: "Donburi bowl garnished with red pickles.",
      holding: "Serve immediately.",
      allergens: "Gluten, Eggs"
    },
    // Drinks
    {
      brandSlug: "aiko", categorySlug: "drinks",
      title: "Yuzu Matcha Sparkling Cold Brew",
      excerpt: "Ceremonial Uji matcha layered over fizzy Japanese yuzu juice & ice.",
      imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=1200&q=80",
      dishCode: "AIK-DR-01", prepMinutes: 5, cookMinutes: 0, servings: 1, yieldText: "350 ml", difficulty: "EASY",
      ingredients: [
        { name: "Uji Matcha Concentrate", quantity: 40, unit: "ml", raw: "40ml whisked Uji matcha" },
        { name: "Japanese Yuzu Juice", quantity: 40, unit: "ml", raw: "40ml fresh yuzu citrus juice" },
        { name: "Sparkling Soda", quantity: 180, unit: "ml", raw: "180ml chilled soda water" }
      ],
      steps: [
        { phase: "PREP", body: "Whisk matcha powder with warm water until frothy." },
        { phase: "FINISH", body: "Fill glass with ice and yuzu soda. Layer whisked green matcha on top." }
      ],
      miseEnPlace: ["Whisk fresh matcha"],
      equipment: ["Matcha Bamboo Whisk", "Tall Glass"],
      plating: "Layered two-tone green and yellow sparkling glass.",
      holding: "Serve cold.",
      allergens: "None"
    },
    {
      brandSlug: "aiko", categorySlug: "drinks",
      title: "Lychee Hibiscus Boba Iced Tea",
      excerpt: "Chilled hibiscus herbal tea infused with sweet lychee syrup & chewy tapioca boba.",
      imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1200&q=80",
      dishCode: "AIK-DR-02", prepMinutes: 10, cookMinutes: 0, servings: 1, yieldText: "400 ml", difficulty: "EASY",
      ingredients: [
        { name: "Brewed Hibiscus Tea", quantity: 200, unit: "ml", raw: "200ml cold brewed ruby hibiscus tea" },
        { name: "Sweet Lychee Nectar", quantity: 60, unit: "ml", raw: "60ml lychee nectar" },
        { name: "Tapioca Boba Pearls", quantity: 50, unit: "g", raw: "50g cooked brown sugar boba pearls" }
      ],
      steps: [
        { phase: "PREP", body: "Spoon warm boba pearls into bottom of cup." },
        { phase: "FINISH", body: "Add ice, shake hibiscus tea with lychee nectar, pour into cup." }
      ],
      miseEnPlace: ["Cook boba pearls in brown sugar"],
      equipment: ["Cocktail Shaker", "Boba Straw"],
      plating: "Clear tall boba cup with wide straw.",
      holding: "Serve cold.",
      allergens: "None"
    },
    // Desserts
    {
      brandSlug: "aiko", categorySlug: "desserts",
      title: "Matcha Green Tea Souffle Pancake",
      excerpt: "Ultra-fluffy Japanese soufflé pancakes dusted with Uji matcha & maple syrup.",
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
      dishCode: "AIK-DS-01", prepMinutes: 20, cookMinutes: 15, servings: 2, yieldText: "2 tall pancakes", difficulty: "MEDIUM",
      ingredients: [
        { name: "Souffle Batter Base", quantity: 150, unit: "g", raw: "150g egg yolk and flour pancake batter" },
        { name: "Whipped Meringue", quantity: 3, unit: "pcs", raw: "3 stiff egg whites meringue" },
        { name: "Uji Matcha Powder", quantity: 10, unit: "g", raw: "10g green tea powder dusting" }
      ],
      steps: [
        { phase: "PREP", body: "Fold whipped egg whites into batter gently to retain air pockets." },
        { phase: "COOK", body: "Scoop tall mounds onto griddle, steam with water drop under lid for 7 mins per side." },
        { phase: "FINISH", body: "Stack pancakes, top with butter ball, dust with matcha and pour maple syrup." }
      ],
      miseEnPlace: ["Whip egg whites to stiff peaks"],
      equipment: ["Covered Griddle Pan"],
      plating: "Served high on ceramic plate.",
      holding: "Serve immediately before soufflé deflates.",
      allergens: "Eggs, Dairy, Gluten"
    },
    {
      brandSlug: "aiko", categorySlug: "desserts",
      title: "Black Sesame Mochi Ice Cream",
      excerpt: "Chewy sweet rice mochi dough wrapped around roasted black sesame ice cream.",
      imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80",
      dishCode: "AIK-DS-02", prepMinutes: 30, cookMinutes: 5, servings: 3, yieldText: "3 mochi balls", difficulty: "MEDIUM",
      ingredients: [
        { name: "Sweet Rice Flour (Mochiko)", quantity: 100, unit: "g", raw: "100g glutinous rice flour" },
        { name: "Roasted Black Sesame Ice Cream", quantity: 3, unit: "scoops", raw: "3 scoops black sesame ice cream" }
      ],
      steps: [
        { phase: "PREP", body: "Steam rice flour dough until translucent, roll flat and cut circles." },
        { phase: "FINISH", body: "Wrap frozen ice cream scoops in mochi dough, freeze until set." }
      ],
      miseEnPlace: ["Pre-scoop ice cream balls"],
      equipment: ["Steamer", "Rolling Pin"],
      plating: "Arranged on wooden sushi plate.",
      holding: "Keep deep frozen.",
      allergens: "Sesame, Dairy"
    },

    // === BESHAK ===
    // Main Menu
    {
      brandSlug: "beshak", categorySlug: "main-menu",
      title: "Beshak Velvet Butter Chicken",
      excerpt: "Smoked tandoori chicken tikka simmered in creamy makhani gravy with butter.",
      imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=1200&q=80",
      dishCode: "BES-MM-01", prepMinutes: 30, cookMinutes: 25, servings: 3, yieldText: "1 handi bowl", difficulty: "MEDIUM",
      ingredients: [
        { name: "Tandoori Chicken Tikka", quantity: 350, unit: "g", raw: "350g clay oven charred chicken tikka" },
        { name: "Tomato Makhani Gravy", quantity: 250, unit: "ml", raw: "250ml slow-cooked tomato cashew gravy" },
        { name: "White Butter", quantity: 40, unit: "g", raw: "40g fresh white butter" }
      ],
      steps: [
        { phase: "PREP", body: "Char marinated chicken tikka in tandoor." },
        { phase: "COOK", body: "Simmer tikka in rich makhani gravy with cream and butter for 12 minutes." }
      ],
      miseEnPlace: ["Marinate chicken tikka"],
      equipment: ["Tandoor", "Copper Handi"],
      plating: "Copper handi with cream swirl.",
      holding: "Keep hot.",
      allergens: "Dairy, Tree Nuts"
    },
    {
      brandSlug: "beshak", categorySlug: "main-menu",
      title: "Awadhi Heritage Dum Biryani",
      excerpt: "Fragrant long-grain basmati layered with spiced meat, saffron & caramelized onions.",
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80",
      dishCode: "BES-MM-02", prepMinutes: 40, cookMinutes: 45, servings: 3, yieldText: "1 clay pot", difficulty: "HARD",
      ingredients: [
        { name: "Aged Basmati Rice", quantity: 300, unit: "g", raw: "300g 2-year aged Basmati rice" },
        { name: "Marinated Meat", quantity: 400, unit: "g", raw: "400g spiced marinated meat" },
        { name: "Saffron & Ghee", quantity: 50, unit: "ml", raw: "50ml saffron milk and desi ghee" }
      ],
      steps: [
        { phase: "COOK", body: "Layer par-boiled rice over marinated meat in clay pot, seal dough lid, cook on dum 35 mins." }
      ],
      miseEnPlace: ["Soak basmati rice"],
      equipment: ["Sealed Clay Handi"],
      plating: "Unsealed at table side with raita.",
      holding: "Keep sealed until service.",
      allergens: "Dairy"
    },
    // Drinks
    {
      brandSlug: "beshak", categorySlug: "drinks",
      title: "Kesar Saffron Badam Thandai",
      excerpt: "Chilled royal milk elixir blended with saffron, almonds, cardamom & rose petals.",
      imageUrl: "https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=1200&q=80",
      dishCode: "BES-DR-01", prepMinutes: 15, cookMinutes: 0, servings: 2, yieldText: "2 glasses", difficulty: "EASY",
      ingredients: [
        { name: "Whole Milk", quantity: 400, unit: "ml", raw: "400ml full cream milk" },
        { name: "Soaked Almond & Melon Seed Paste", quantity: 50, unit: "g", raw: "50g almond and melon seed paste" },
        { name: "Kashmiri Saffron Strands", quantity: 10, unit: "pcs", raw: "10 saffron strands" },
        { name: "Green Cardamom Powder", quantity: 3, unit: "g", raw: "3g cardamom powder" }
      ],
      steps: [
        { phase: "PREP", body: "Blend soaked nuts paste with chilled milk, saffron, and cardamom until frothy." },
        { phase: "FINISH", body: "Pour into brass tumblers, garnish with silver leaf (varq) and pistachios." }
      ],
      miseEnPlace: ["Soak almonds overnight", "Steep saffron in warm milk"],
      equipment: ["Heavy Duty Blender"],
      plating: "Traditional engraved brass tumbler.",
      holding: "Keep refrigerated.",
      allergens: "Dairy, Tree Nuts"
    },
    {
      brandSlug: "beshak", categorySlug: "drinks",
      title: "Rooh Afza Rose Mango Lassi",
      excerpt: "Thick churned yogurt lassi layered with Alphonso mango pulp & rose syrup.",
      imageUrl: "https://images.unsplash.com/photo-1571006682858-a458b8a19284?auto=format&fit=crop&w=1200&q=80",
      dishCode: "BES-DR-02", prepMinutes: 5, cookMinutes: 0, servings: 1, yieldText: "350 ml", difficulty: "EASY",
      ingredients: [
        { name: "Fresh Churned Curd (Yogurt)", quantity: 200, unit: "g", raw: "200g thick creamy yogurt" },
        { name: "Alphonso Mango Puree", quantity: 80, unit: "ml", raw: "80ml ripe mango puree" },
        { name: "Rooh Afza Rose Syrup", quantity: 30, unit: "ml", raw: "30ml rose syrup" }
      ],
      steps: [
        { phase: "PREP", body: "Whisk yogurt with sugar and ice until thick and smooth." },
        { phase: "FINISH", body: "Drizzle rose syrup inside glass, pour mango lassi layer, top with crushed pistachio." }
      ],
      miseEnPlace: ["Churn fresh yogurt"],
      equipment: ["Wooden Mathani / Blender"],
      plating: "Tall clay kulhad glass.",
      holding: "Serve chilled.",
      allergens: "Dairy, Tree Nuts"
    },
    // Desserts
    {
      brandSlug: "beshak", categorySlug: "desserts",
      title: "Shahi Tukda with Creamy Rabri",
      excerpt: "Crispy ghee-fried brioche dipped in saffron syrup topped with slow-reduced rabri.",
      imageUrl: "https://images.unsplash.com/photo-1605197586548-0de1b9ef08b5?auto=format&fit=crop&w=1200&q=80",
      dishCode: "BES-DS-01", prepMinutes: 15, cookMinutes: 30, servings: 2, yieldText: "2 portions", difficulty: "MEDIUM",
      ingredients: [
        { name: "Brioche Bread Triangles", quantity: 4, unit: "pcs", raw: "4 crustless bread triangles" },
        { name: "Desi Ghee for Frying", quantity: 100, unit: "g", raw: "100g pure ghee" },
        { name: "Saffron Sugar Syrup", quantity: 100, unit: "ml", raw: "100ml warm saffron syrup" },
        { name: "Condensed Rabri", quantity: 150, unit: "ml", raw: "150ml cardamom milk rabri" }
      ],
      steps: [
        { phase: "COOK", body: "Fry bread triangles in golden ghee until deep golden crispy. Dip briefly in warm saffron syrup." },
        { phase: "FINISH", body: "Arrange on plate, pour thick rabri over top, garnish with silver foil and chopped nuts." }
      ],
      miseEnPlace: ["Reduce milk for rabri", "Make 1-string saffron syrup"],
      equipment: ["Frying Pan", "Slotted Spoon"],
      plating: "Served warm on royal silver dish.",
      holding: "Keep rabri warm.",
      allergens: "Dairy, Gluten, Tree Nuts"
    },
    {
      brandSlug: "beshak", categorySlug: "desserts",
      title: "Warm Gulab Jamun with Vanilla Ice Cream",
      excerpt: "Mawa gulab jamun soaked in cardamom syrup paired with artisanal vanilla bean ice cream.",
      imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1200&q=80",
      dishCode: "BES-DS-02", prepMinutes: 20, cookMinutes: 20, servings: 2, yieldText: "4 jamuns", difficulty: "EASY",
      ingredients: [
        { name: "Khoya Mawa Jamun Balls", quantity: 4, unit: "pcs", raw: "4 fried khoya mawa balls" },
        { name: "Cardamom Rose Syrup", quantity: 150, unit: "ml", raw: "150ml warm cardamom syrup" },
        { name: "Vanilla Bean Ice Cream", quantity: 2, unit: "scoops", raw: "2 scoops vanilla bean ice cream" }
      ],
      steps: [
        { phase: "COOK", body: "Fry mawa balls low and slow in ghee until dark golden. Soak in warm cardamom syrup 2 hours." },
        { phase: "FINISH", body: "Serve 2 hot gulab jamuns alongside a cold scoop of vanilla ice cream." }
      ],
      miseEnPlace: ["Fry and soak gulab jamuns"],
      equipment: ["Kadai"],
      plating: "Deep porcelain bowl.",
      holding: "Serve jamuns hot, ice cream cold.",
      allergens: "Dairy, Gluten"
    },

    // === GHASLET ===
    // Main Menu
    {
      brandSlug: "ghaslet", categorySlug: "main-menu",
      title: "Ghaslet Fermented Hot Wings",
      excerpt: "Crispy double-fried wings drenched in Ghaslet fermented hot sauce.",
      imageUrl: "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=1200&q=80",
      dishCode: "GHA-MM-01", prepMinutes: 20, cookMinutes: 15, servings: 2, yieldText: "10 wings", difficulty: "EASY",
      ingredients: [
        { name: "Chicken Wings", quantity: 500, unit: "g", raw: "500g jumbo chicken wings" },
        { name: "Ghaslet Hot Sauce", quantity: 100, unit: "ml", raw: "100ml Ghaslet fermented sauce" },
        { name: "Unsalted Butter", quantity: 40, unit: "g", raw: "40g melted butter" }
      ],
      steps: [
        { phase: "COOK", body: "Double fry chicken wings at 190°C until blistered and super crunchy." },
        { phase: "FINISH", body: "Toss wings in stainless bowl with warm Ghaslet hot sauce and butter emulsion." }
      ],
      miseEnPlace: ["Marinate wings in buttermilk"],
      equipment: ["Deep Fryer", "Tossing Bowl"],
      plating: "Wire basket lined with hazard warning wax paper.",
      holding: "Serve crispy hot.",
      allergens: "Dairy"
    },
    {
      brandSlug: "ghaslet", categorySlug: "main-menu",
      title: "Fiery Habanero Chicken Glaze",
      excerpt: "Habanero, brown sugar, and dark soy marinade glaze for meats & grills.",
      imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1200&q=80",
      dishCode: "GHA-MM-02", prepMinutes: 15, cookMinutes: 10, servings: 4, yieldText: "4 glazed thighs", difficulty: "EASY",
      ingredients: [
        { name: "Boneless Chicken Thighs", quantity: 600, unit: "g", raw: "600g chicken thighs" },
        { name: "Habanero Glaze Sauce", quantity: 120, unit: "ml", raw: "120ml habanero molasses glaze" }
      ],
      steps: [
        { phase: "COOK", body: "Grill chicken over high flame, basting liberally with habanero glaze until caramelized." }
      ],
      miseEnPlace: ["Prepare habanero glaze"],
      equipment: ["Charcoal Grill"],
      plating: "Black skillet with grilled lime half.",
      holding: "Serve hot.",
      allergens: "Soy"
    },
    // Drinks
    {
      brandSlug: "ghaslet", categorySlug: "drinks",
      title: "Spicy Ghost Pepper Paloma Mocktail",
      excerpt: "Fresh grapefruit juice, agave, sparkling water & a touch of Ghaslet chili rim.",
      imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80",
      dishCode: "GHA-DR-01", prepMinutes: 5, cookMinutes: 0, servings: 1, yieldText: "350 ml", difficulty: "EASY",
      ingredients: [
        { name: "Pink Grapefruit Juice", quantity: 120, unit: "ml", raw: "120ml fresh pink grapefruit juice" },
        { name: "Agave Nectar", quantity: 20, unit: "ml", raw: "20ml organic agave nectar" },
        { name: "Chili Salt Rim", quantity: 5, unit: "g", raw: "5g Ghaslet chili sea salt" }
      ],
      steps: [
        { phase: "PREP", body: "Rim highball glass with lime juice and Ghaslet chili salt." },
        { phase: "FINISH", body: "Shake grapefruit juice with agave and ice, top with soda water and jalapeño slice." }
      ],
      miseEnPlace: ["Mix chili salt rim"],
      equipment: ["Cocktail Shaker"],
      plating: "Chili-rimmed highball glass.",
      holding: "Serve iced.",
      allergens: "None"
    },
    {
      brandSlug: "ghaslet", categorySlug: "drinks",
      title: "Chili Lime Flaming Lemonade",
      excerpt: "Hand-squeezed citrus lemonade spiked with habanero reduction & mint.",
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
      dishCode: "GHA-DR-02", prepMinutes: 5, cookMinutes: 0, servings: 1, yieldText: "350 ml", difficulty: "EASY",
      ingredients: [
        { name: "Fresh Lemon Juice", quantity: 50, unit: "ml", raw: "50ml lemon juice" },
        { name: "Spicy Chili Syrup", quantity: 30, unit: "ml", raw: "30ml habanero simple syrup" },
        { name: "Chilled Water", quantity: 200, unit: "ml", raw: "200ml cold water" }
      ],
      steps: [
        { phase: "FINISH", body: "Stir lemon juice and chili syrup in glass with ice. Top with sprig of slapped mint." }
      ],
      miseEnPlace: ["Make habanero syrup"],
      equipment: ["Bar Spoon"],
      plating: "Mason jar with chili wedge.",
      holding: "Serve chilled.",
      allergens: "None"
    },
    // Desserts
    {
      brandSlug: "ghaslet", categorySlug: "desserts",
      title: "Spicy Ancho Chili Dark Chocolate Cake",
      excerpt: "Decadent 70% dark chocolate lava cake infused with smokey ancho chili.",
      imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
      dishCode: "GHA-DS-01", prepMinutes: 15, cookMinutes: 12, servings: 2, yieldText: "2 cakes", difficulty: "MEDIUM",
      ingredients: [
        { name: "70% Dark Chocolate", quantity: 150, unit: "g", raw: "150g dark couverture chocolate" },
        { name: "Ancho Chili Powder", quantity: 5, unit: "g", raw: "5g ground ancho chili" },
        { name: "Butter & Eggs", quantity: 100, unit: "g", raw: "100g butter and 2 eggs" }
      ],
      steps: [
        { phase: "COOK", body: "Bake chocolate ramekins at 200°C for 12 mins until edges are set but center is molten." },
        { phase: "FINISH", body: "Unmold onto plate, dust with chili cocoa powder, serve warm." }
      ],
      miseEnPlace: ["Melt chocolate and butter with chili"],
      equipment: ["Ramekins", "Oven"],
      plating: "Molten cake oozing spicy chocolate.",
      holding: "Serve hot out of oven.",
      allergens: "Dairy, Eggs, Gluten"
    },
    {
      brandSlug: "ghaslet", categorySlug: "desserts",
      title: "Chili Mango Sorbet Bowl",
      excerpt: "Refreshing Alphonso mango sorbet topped with Tajin chili lime seasoning.",
      imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80",
      dishCode: "GHA-DS-02", prepMinutes: 10, cookMinutes: 0, servings: 2, yieldText: "2 scoops", difficulty: "EASY",
      ingredients: [
        { name: "Alphonso Mango Sorbet", quantity: 2, unit: "scoops", raw: "2 scoops mango sorbet" },
        { name: "Tajin Chili Lime Seasoning", quantity: 5, unit: "g", raw: "5g Tajin chili salt" },
        { name: "Chamoy Sauce Drizzle", quantity: 15, unit: "ml", raw: "15ml tangy chamoy sauce" }
      ],
      steps: [
        { phase: "FINISH", body: "Scoop mango sorbet into chilled bowl, drizzle chamoy and sprinkle Tajin seasoning." }
      ],
      miseEnPlace: ["Chill dessert bowls"],
      equipment: ["Ice Cream Scoop"],
      plating: "Frosted glass bowl with lime wheel.",
      holding: "Serve frozen.",
      allergens: "None"
    }
  ];

  for (const r of RECIPES_DATA) {
    const brand = brandRecords[r.brandSlug];
    const category = categoryRecords[`${r.brandSlug}:${r.categorySlug}`];
    if (!brand || !category) continue;

    const slug = r.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    
    // Create hero media image for recipe
    const heroMedia = await createMedia(r.imageUrl, r.title);

    const recipeData = {
      brandId: brand.id,
      categoryId: category.id,
      slug,
      title: r.title,
      excerpt: r.excerpt,
      description: `${r.title} — handcrafted recipe from ${brand.name}. Made with premium ingredients and precise technique.`,
      heroImageId: heroMedia.id,
      prepMinutes: r.prepMinutes,
      cookMinutes: r.cookMinutes,
      totalMinutes: r.prepMinutes + r.cookMinutes,
      servings: r.servings,
      yieldText: r.yieldText,
      difficulty: r.difficulty,
      status: "PUBLISHED" as const,
      publishedAt: new Date(),
      featured: true,
      dishCode: r.dishCode,
      author: `${brand.name} Kitchen`,
      approvedBy: "Head Chef",
      effectiveDate: new Date(),
      nextReviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      miseEnPlace: r.miseEnPlace,
      equipment: r.equipment,
      plating: r.plating,
      holding: r.holding,
      allergens: r.allergens,
      dietary: r.dietary || ["Vegetarian"],
      ingredientText: r.ingredients.map(i => i.raw).join("\n"),
      createdById: existingOwner?.id,
    };

    const existing = await db.recipe.findFirst({ where: { brandId: brand.id, slug } });
    let recipeId: string;
    if (existing) {
      await db.recipe.update({ where: { id: existing.id }, data: recipeData });
      recipeId = existing.id;
      await db.recipeIngredient.deleteMany({ where: { recipeId } });
      await db.recipeStep.deleteMany({ where: { recipeId } });
    } else {
      const created = await db.recipe.create({ data: recipeData });
      recipeId = created.id;
    }

    // Add ingredients
    for (const [idx, ing] of r.ingredients.entries()) {
      await db.recipeIngredient.create({
        data: {
          recipeId,
          position: idx,
          name: ing.name,
          quantity: ing.quantity ? ing.quantity : null,
          unit: ing.unit || null,
          raw: ing.raw
        }
      });
    }

    // Add steps
    for (const [idx, stp] of r.steps.entries()) {
      await db.recipeStep.create({
        data: {
          recipeId,
          phase: stp.phase,
          position: idx,
          body: stp.body
        }
      });
    }
  }

  console.log("Seed complete — all categories (main-menu, drinks, desserts) across all brands seeded with recipes & images!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
