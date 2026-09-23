import "dotenv/config";
import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const sampleData = {
  capiche: [
    { title: "Classic Margherita", dishCode: "CP-01", prep: 10, cook: 5 },
    { title: "Pepperoni Passion", dishCode: "CP-02", prep: 10, cook: 6 },
    { title: "Truffle Mushroom", dishCode: "CP-03", prep: 15, cook: 7 },
    { title: "Spicy Diavola", dishCode: "CP-04", prep: 12, cook: 6 },
    { title: "Garlic Knots", dishCode: "CP-05", prep: 20, cook: 10 },
    { title: "Caprese Salad", dishCode: "CP-06", prep: 10, cook: 0 },
    { title: "Tiramisu Slice", dishCode: "CP-07", prep: 30, cook: 0 },
    { title: "Pesto Pasta", dishCode: "CP-08", prep: 15, cook: 12 },
    { title: "Burrata Plate", dishCode: "CP-09", prep: 5, cook: 0 },
    { title: "NYC Cheese Slice", dishCode: "CP-10", prep: 10, cook: 5 }
  ],
  aiko: [
    { title: "Spicy Ramen", dishCode: "AK-01", prep: 20, cook: 15 },
    { title: "Pork Bao", dishCode: "AK-02", prep: 30, cook: 10 },
    { title: "Matcha Cheesecake", dishCode: "AK-03", prep: 40, cook: 0 },
    { title: "Gyoza Platter", dishCode: "AK-04", prep: 25, cook: 8 },
    { title: "Chicken Katsu", dishCode: "AK-05", prep: 20, cook: 15 },
    { title: "Miso Soup", dishCode: "AK-06", prep: 5, cook: 10 },
    { title: "Tempura Udon", dishCode: "AK-07", prep: 15, cook: 12 },
    { title: "Salmon Nigiri", dishCode: "AK-08", prep: 15, cook: 0 },
    { title: "Yakitori Skewers", dishCode: "AK-09", prep: 20, cook: 10 },
    { title: "Dan Dan Noodles", dishCode: "AK-10", prep: 15, cook: 15 }
  ],
  beshak: [
    { title: "Dal Makhani", dishCode: "BS-01", prep: 20, cook: 120 },
    { title: "Garlic Naan", dishCode: "BS-02", prep: 15, cook: 5 },
    { title: "Chicken Tikka", dishCode: "BS-03", prep: 30, cook: 15 },
    { title: "Palak Paneer", dishCode: "BS-04", prep: 20, cook: 25 },
    { title: "Biryani Bowl", dishCode: "BS-05", prep: 40, cook: 45 },
    { title: "Samosa Chaat", dishCode: "BS-06", prep: 20, cook: 10 },
    { title: "Gulab Jamun", dishCode: "BS-07", prep: 15, cook: 20 },
    { title: "Mango Lassi", dishCode: "BS-08", prep: 5, cook: 0 },
    { title: "Lamb Rogan Josh", dishCode: "BS-09", prep: 30, cook: 90 },
    { title: "Tandoori Roti", dishCode: "BS-10", prep: 10, cook: 5 }
  ],
  ghaslet: [
    { title: "Ghost Pepper Sauce", dishCode: "GH-01", prep: 15, cook: 30 },
    { title: "Smoked Jalapeno", dishCode: "GH-02", prep: 10, cook: 20 },
    { title: "Garlic Habanero", dishCode: "GH-03", prep: 10, cook: 25 },
    { title: "Spicy Mayo", dishCode: "GH-04", prep: 5, cook: 0 },
    { title: "Chili Crisp Oil", dishCode: "GH-05", prep: 10, cook: 45 },
    { title: "Mango Reaper", dishCode: "GH-06", prep: 15, cook: 25 },
    { title: "Fermented Sriracha", dishCode: "GH-07", prep: 20, cook: 120 },
    { title: "Green Chili Chutney", dishCode: "GH-08", prep: 10, cook: 0 },
    { title: "Sichuan Pepper Rub", dishCode: "GH-09", prep: 5, cook: 0 },
    { title: "Extra Hot Ketchup", dishCode: "GH-10", prep: 5, cook: 15 }
  ]
};

async function main() {
  const brands = await db.brand.findMany();
  const firstMedia = await db.media.findFirst();
  const mediaId = firstMedia?.id;

  for (const brand of brands) {
    if (brand.slug === "bookends") continue;
    
    const recipes = sampleData[brand.slug as keyof typeof sampleData];
    if (!recipes) continue;

    const mainMenuCat = await db.category.findUnique({
      where: { brandId_slug: { brandId: brand.id, slug: "main-menu" } }
    });
    
    console.log(`Seeding 10 recipes for ${brand.name}...`);

    for (const r of recipes) {
      const slug = r.title.toLowerCase().replace(/\s+/g, "-");
      
      const exists = await db.recipe.findFirst({ where: { brandId: brand.id, slug } });
      if (exists) continue;

      await db.recipe.create({
        data: {
          brandId: brand.id,
          categoryId: mainMenuCat?.id ?? null,
          slug,
          title: r.title,
          excerpt: `Delicious ${r.title} made fresh.`,
          dishCode: r.dishCode,
          author: "Bookends Culinary",
          approvedBy: "Husen Khan",
          version: 1,
          effectiveDate: new Date(),
          nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          yieldText: "1 portion (~250g)",
          prepMinutes: r.prep,
          cookMinutes: r.cook,
          totalMinutes: r.prep + r.cook,
          dietary: r.cook % 2 === 0 ? ["Vegetarian"] : [],
          miseEnPlace: ["Prepare ingredients", "Sanitize station", "Gather tools"],
          equipment: ["Chef knife", "Cutting board", "Pan"],
          plating: "Serve in standard bowl.\nGarnish with fresh herbs.",
          holding: "Serve immediately.\nDo not hold.",
          allergens: "Contains: Gluten, Dairy",
          status: "PUBLISHED",
          publishedAt: new Date(),
          heroImageId: mediaId,
          ingredients: {
            create: [
              { name: "Primary Ingredient", quantity: 100, unit: "g", position: 0, raw: "100g Primary Ingredient" },
              { name: "Secondary Ingredient", quantity: 50, unit: "g", position: 1, raw: "50g Secondary Ingredient" },
              { name: "Salt", quantity: 5, unit: "g", position: 2, raw: "5g Salt" },
            ]
          },
          steps: {
            create: [
              { phase: "PREP", body: "Chop all ingredients finely.", position: 0 },
              { phase: "COOK", body: "Cook on medium heat until golden.", position: 1 },
              { phase: "FINISH", body: "Plate and serve hot.", position: 2 }
            ]
          }
        }
      });
    }
  }
  console.log("Finished seeding 40 recipes!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
