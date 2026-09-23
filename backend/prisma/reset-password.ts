import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const ownerEmail = "reservation.bookends@gmail.com";
  const newPassword = "Bookends-Admin123!";
  
  const hashedPassword = await hash(newPassword, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
  
  await db.admin.update({
    where: { email: ownerEmail },
    data: { passwordHash: hashedPassword },
  });
  
  console.log(`Password reset for ${ownerEmail} to: ${newPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
