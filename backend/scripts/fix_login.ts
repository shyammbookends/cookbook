import "dotenv/config";
import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  // Clear rate limits
  await db.loginAttempt.deleteMany();
  console.log("Cleared login attempts");

  // Find owner and reset password
  const ownerEmail = "reservation.bookends@gmail.com";
  const knownPassword = "Bookends-60a9754f!";
  
  const passwordHash = await hash(knownPassword, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
  
  const owner = await db.admin.upsert({
    where: { email: ownerEmail },
    create: {
      email: ownerEmail,
      name: "Bookends Owner",
      passwordHash,
      role: "OWNER",
    },
    update: {
      passwordHash
    }
  });
  
  console.log(`Password for ${ownerEmail} has been reset to: ${knownPassword}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
