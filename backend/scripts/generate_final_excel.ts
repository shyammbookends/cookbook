import ExcelJS from "exceljs";

async function main() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Recipes");

  sheet.columns = [
    { header: "Brand", key: "brand" },
    { header: "Category", key: "category" },
    { header: "Title", key: "title" },
    { header: "Subtitle", key: "subtitle" },
    { header: "Excerpt", key: "excerpt" },
    { header: "Description", key: "description" },
    { header: "Hero image", key: "heroImage" },
    { header: "Prep (mins)", key: "prep" },
    { header: "Cook (mins)", key: "cook" },
    { header: "Servings", key: "servings" },
    { header: "Difficulty", key: "difficulty" },
    { header: "Ingredients", key: "ingredients" },
    { header: "Steps", key: "steps" },
    { header: "Tags", key: "tags" },
    { header: "Notes", key: "notes" },
    { header: "Tips", key: "tips" }
  ];

  const recipes = [
    { 
      brand: "Capiche", category: "Main Menu", title: "Classic Margherita", 
      excerpt: "The original classic pizza.", 
      description: "Experience the authentic taste of Italy with our Classic Margherita. Hand-stretched dough baked to perfection in a wood-fired oven, topped with crushed San Marzano tomatoes, fresh mozzarella, and aromatic basil leaves.",
      heroImage: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=1000",
      prep: 15, cook: 7, servings: 2, difficulty: "Medium",
      ingredients: "1 ball Pizza Dough\n1/2 cup Tomato Sauce\n200g Fresh Mozzarella\nHandful Fresh Basil\n1 tbsp Olive Oil",
      steps: "Preheat oven to maximum temperature.\nStretch dough into a 12-inch circle.\nSpread tomato sauce evenly.\nTear mozzarella and distribute.\nBake for 5-7 minutes until blistered.",
      tags: "Pizza, Vegetarian, Classic",
      notes: "Make sure your oven is fully preheated.",
      tips: "Tear the mozzarella instead of cutting it for better melting."
    },
    { 
      brand: "Capiche", category: "Drinks", title: "Lemon Spritz", 
      excerpt: "Refreshing summer drink.", 
      description: "Cool down with our signature Lemon Spritz. A vibrant and refreshing mocktail combining freshly squeezed lemons, sparkling soda water, and a hint of mint.",
      heroImage: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=1000",
      prep: 5, cook: 0, servings: 1, difficulty: "Easy",
      ingredients: "2 oz Lemon Juice\n1 oz Simple Syrup\nSoda water\nIce\nMint sprig",
      steps: "Fill a large glass with ice.\nPour in lemon juice and simple syrup.\nTop with soda water and stir gently.\nGarnish with a fresh mint sprig.",
      tags: "Beverage, Cold, Mocktail",
      notes: "Can be made ahead of time without the soda water.",
      tips: "Slap the mint leaves before garnishing."
    },
    { 
      brand: "Capiche", category: "Desserts", title: "Tiramisu", 
      excerpt: "Classic Italian dessert.", 
      description: "Our heavenly Tiramisu features delicate ladyfingers soaked in rich espresso, layered with a velvety mascarpone cream, and dusted with dark cocoa powder.",
      heroImage: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&q=80&w=1000",
      prep: 30, cook: 0, servings: 4, difficulty: "Medium",
      ingredients: "250g Mascarpone\n3 Eggs, separated\n1/2 cup Sugar\n1 cup Strong Espresso\n20 Ladyfingers\nCocoa powder",
      steps: "Whip egg yolks and sugar until pale.\nFold in mascarpone cheese.\nWhip egg whites to stiff peaks and fold into mascarpone.\nBriefly dip ladyfingers in espresso.\nLayer ladyfingers and cream in a dish.\nChill for at least 4 hours.",
      tags: "Dessert, Italian, Coffee",
      notes: "Best prepared a day in advance.",
      tips: "Dip the ladyfingers very quickly."
    },
    { 
      brand: "Capiche", category: "Main Menu", title: "Truffle Mushroom Risotto", 
      excerpt: "Creamy arborio rice with wild mushrooms.", 
      description: "A luxurious and earthy dish made with perfectly cooked arborio rice, a blend of wild mushrooms, and finished with a drizzle of premium white truffle oil and freshly grated parmesan.",
      heroImage: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&q=80&w=1000",
      prep: 10, cook: 25, servings: 2, difficulty: "Hard",
      ingredients: "1 cup Arborio Rice\n200g Mixed Mushrooms\n1/2 Onion, diced\n3 cups Vegetable Broth\n1/4 cup White Wine\n2 tbsp Butter\n1/4 cup Parmesan Cheese\n1 tsp Truffle Oil",
      steps: "Sauté onions in butter until translucent.\nAdd mushrooms and cook until browned.\nStir in rice and toast for 1 minute.\nDeglaze with white wine.\nGradually add warm broth, stirring continuously until absorbed.\nStir in parmesan and truffle oil before serving.",
      tags: "Risotto, Vegetarian, Dinner",
      notes: "Keep the broth warm on a separate burner.",
      tips: "Don't wash the arborio rice!"
    }
  ];

  for (const r of recipes) {
    sheet.addRow(r);
  }

  await workbook.xlsx.writeFile("1 res.xlsx");
  console.log("Excel generated successfully!");
}

main().catch(console.error);
