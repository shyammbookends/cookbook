import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Publishing all draft recipes...");
  
  const result = await db.recipe.updateMany({
    where: { status: "DRAFT" },
    data: { status: "PUBLISHED" },
  });
  
  console.log(`Successfully published ${result.count} recipes!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
