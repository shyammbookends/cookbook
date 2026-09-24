const { PrismaClient } = require('./src/generated/prisma');
const p = new PrismaClient();

async function main() {
  const capiche = await p.brand.findUnique({
    where: { slug: 'capiche' },
    include: { categories: true }
  });
  console.log('CAPICHE ID:', capiche?.id);
  const recipes = await p.recipe.findMany({
    where: { brandId: capiche?.id },
    select: { id: true, title: true, deletedAt: true, status: true, categoryId: true }
  });
  console.log('RECIPES COUNT:', recipes.length);
  console.log('RECIPES FOR CAPICHE:', recipes);

  const categories = await p.category.findMany({
    where: { brandId: capiche?.id },
    include: {
      recipes: {
        select: { id: true, title: true, deletedAt: true }
      }
    }
  });
  console.log('CATEGORIES:', JSON.stringify(categories, null, 2));
}

main().catch(console.error).finally(() => p.$disconnect());
