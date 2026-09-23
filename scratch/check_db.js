require('dotenv').config();
const { PrismaClient } = require('./frontend/src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function check() {
  const brands = await db.brand.findMany({ include: { categories: true, recipes: true } });
  for (const b of brands) {
    console.log('--- Brand:', b.slug, '(Status:', b.status, ') ---');
    console.log('Categories:', b.categories.map(c => c.slug));
    console.log('Recipes:', b.recipes.map(r => ({ slug: r.slug, status: r.status, categoryId: r.categoryId })));
  }
  await db.$disconnect();
}
check().catch(console.error);
