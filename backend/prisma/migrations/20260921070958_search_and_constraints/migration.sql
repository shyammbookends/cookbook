-- Extensions used for fuzzy/typo-tolerant search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ── Brand isolation: slugs and external ids are unique per brand, but only
--    while the recipe is live. Soft-deleted rows free up the slug again.
DROP INDEX IF EXISTS "Recipe_brandId_slug_key";
CREATE UNIQUE INDEX "recipe_brand_slug_live_key"
  ON "Recipe" ("brandId", "slug")
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "recipe_brand_external_id_live_key"
  ON "Recipe" ("brandId", "externalId")
  WHERE "deletedAt" IS NULL AND "externalId" IS NOT NULL;

-- unaccent() ships as STABLE, not IMMUTABLE (it depends on a text search
-- dictionary), so Postgres refuses it inside a generated column. Wrap it in a
-- function we assert is IMMUTABLE for our purposes (we never swap dictionaries).
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
  RETURNS text AS $$
    SELECT unaccent('unaccent', $1)
  $$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- ── Full-text search (title weighted highest, then excerpt, then ingredients).
--    "simple" config is used deliberately: recipe names are Hindi/Gujarati/
--    Italian and should not be English-stemmed.
ALTER TABLE "Recipe" ADD COLUMN "search" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(immutable_unaccent("title"), '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(immutable_unaccent("excerpt"), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(immutable_unaccent("ingredientText"), '')), 'C')
  ) STORED;

CREATE INDEX "recipe_search_gin_idx" ON "Recipe" USING GIN ("search");

-- Trigram index for typo-tolerant title matching ("panner" -> "paneer")
CREATE INDEX "recipe_title_trgm_idx" ON "Recipe" USING GIN ("title" gin_trgm_ops);

-- ── Sanity constraints. Excel import and forms are Zod-validated already;
--    these are the last line of defence at the database level.
ALTER TABLE "Recipe"
  ADD CONSTRAINT "recipe_prep_minutes_nonneg" CHECK ("prepMinutes" IS NULL OR "prepMinutes" >= 0),
  ADD CONSTRAINT "recipe_cook_minutes_nonneg" CHECK ("cookMinutes" IS NULL OR "cookMinutes" >= 0),
  ADD CONSTRAINT "recipe_rest_minutes_nonneg" CHECK ("restMinutes" IS NULL OR "restMinutes" >= 0),
  ADD CONSTRAINT "recipe_total_minutes_nonneg" CHECK ("totalMinutes" IS NULL OR "totalMinutes" >= 0),
  ADD CONSTRAINT "recipe_servings_positive" CHECK ("servings" IS NULL OR "servings" > 0),
  ADD CONSTRAINT "recipe_spice_level_range" CHECK ("spiceLevel" IS NULL OR ("spiceLevel" BETWEEN 0 AND 5));

ALTER TABLE "Brand"
  ADD CONSTRAINT "brand_number_positive" CHECK ("number" > 0);
