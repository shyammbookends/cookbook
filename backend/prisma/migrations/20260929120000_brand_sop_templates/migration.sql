-- Fields for brand-specific SOP card designs (Aiko: TYPE / SERVICE stats and
-- extra sub-recipe / reference panels).
ALTER TABLE "Recipe" ADD COLUMN "dishType" TEXT,
ADD COLUMN "service" TEXT,
ADD COLUMN "sopSections" TEXT;
