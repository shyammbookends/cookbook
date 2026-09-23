# Prisma migrations — hybrid schema + raw SQL

Most of this schema is managed the normal Prisma way. A few Postgres features
Prisma can't express are added by hand in `migrations/20260921070958_search_and_constraints/migration.sql`:

- `pg_trgm` / `unaccent` extensions
- Partial unique indexes (`Recipe(brandId, slug) WHERE deletedAt IS NULL`, same for `externalId`)
- The generated `search` tsvector column + its GIN index
- A GIN trigram index on `Recipe.title`
- `CHECK` constraints (non-negative minutes, servings > 0, spice level 0–5, brand number > 0)

**When you add a new migration with `prisma migrate dev`:**

1. Run it with `--create-only` first and read the generated SQL before it touches the database.
2. If Prisma proposes `DROP INDEX` for `recipe_search_gin_idx`, `recipe_title_trgm_idx`,
   `recipe_brand_slug_live_key`, or `recipe_brand_external_id_live_key`, or a `DROP CONSTRAINT`
   for the `recipe_*_check`/`brand_number_positive` constraints — **delete those lines**. Prisma
   doesn't know about hand-written indexes/constraints and will try to "clean them up"; that's a
   false positive, not a real drift.
3. The `search` column itself is declared in `schema.prisma` as `Unsupported("tsvector")`
   specifically so Prisma never proposes dropping the column — only the extra indexes need the
   manual check above.

**Heads up:** this false-positive can also make `prisma migrate dev` fail outright (P3006/P3018,
`"search" of relation "Recipe" is a generated column`) even for a migration totally unrelated to
Recipe — e.g. adding columns to Brand. When that happens: delete the bad auto-generated migration
folder, hand-write a migration.sql containing only the change you actually intended, apply it
directly with `psql`, then run `prisma migrate resolve --applied <folder-name>` to record it in
Prisma's migration history without re-running the shadow-db diff. See
`migrations/20260921080200_brand_voice_content/` for a worked example.
