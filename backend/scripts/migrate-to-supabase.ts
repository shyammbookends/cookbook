/**
 * One-time copy of the local cookbook database rows into a freshly migrated
 * Supabase database. Image FILES are not handled here — they go, encrypted, to
 * the Supabase Storage bucket via backend/scripts/upload-media-to-supabase.ts.
 * (The `Media` rows that point at them ARE copied here, unchanged.)
 *
 * DRY RUN BY DEFAULT: it only reads both databases and prints what it would do.
 * Pass --execute to write. Everything is written in ONE transaction on the
 * target: either all rows land, or nothing does.
 *
 * It never deletes, truncates or updates anything, and it refuses to run if the
 * target already contains cookbook data or is missing any migration.
 *
 * Settings come from .env.supabase (git-ignored; override with MIGRATION_ENV_FILE):
 *   SOURCE_DATABASE_URL   local Postgres (only read)
 *   TARGET_DATABASE_URL   Supabase SESSION pooler or direct URL (port 5432, not 6543)
 *
 * Usage (from the repo root):
 *   npm run db:copy-to-supabase              # dry run
 *   npm run db:copy-to-supabase -- --execute # real copy
 */
import { config } from "dotenv";
import { readdirSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

config({ path: process.env.MIGRATION_ENV_FILE ?? ".env.supabase", quiet: true });

const EXECUTE = process.argv.includes("--execute");

// Parents before children (foreign keys). Session / LoginAttempt are throwaway
// login state and are NOT copied: admins simply sign in again on production.
// MediaBlob is not used: image files live in Supabase Storage.
const TABLES = [
  "Admin", "Media", "Brand", "Category", "Tag", "FieldDefinition", "ImportJob",
  "Recipe", "RecipeIngredient", "RecipeStep", "RecipeMedia", "RecipeTag",
  "ImportRow", "SlugRedirect", "Setting", "AuditLog",
];
const SKIPPED = ["Session", "LoginAttempt"];

function need(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} is not set (put it in .env.supabase).`);
  return v;
}

function describe(url: string): string {
  const u = new URL(url);
  return `${u.hostname}:${u.port || 5432}${u.pathname}`;
}

async function main() {
  const sourceUrl = need("SOURCE_DATABASE_URL");
  const targetUrl = need("TARGET_DATABASE_URL");
  if (describe(sourceUrl) === describe(targetUrl)) throw new Error("SOURCE and TARGET point at the same database.");
  if (new URL(targetUrl).port === "6543") {
    throw new Error("TARGET_DATABASE_URL uses the transaction pooler (6543). Use the session pooler / direct URL (5432).");
  }

  console.log(EXECUTE ? "\n*** EXECUTE MODE — will write to the target ***\n" : "\n--- DRY RUN (nothing is written; add --execute to copy) ---\n");
  console.log(`Source: ${describe(sourceUrl)}`);
  console.log(`Target: ${describe(targetUrl)}\n`);

  // Every value is read as Postgres' own text form and written back as text, so
  // timestamps, enums, arrays, JSON and bytea round-trip exactly.
  const source = new Client({ connectionString: sourceUrl, types: { getTypeParser: () => (v: string) => v } });
  const target = new Client({ connectionString: targetUrl });
  await source.connect();
  await target.connect();

  try {
    await source.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");

    // 1. Target must be fully migrated.
    const local = readdirSync(path.resolve("backend/prisma/migrations")).filter((d) => /^\d{14}_/.test(d));
    const applied = await target
      .query(`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`)
      .then((r) => new Set(r.rows.map((x) => x.migration_name as string)))
      .catch(() => new Set<string>());
    const missing = local.filter((m) => !applied.has(m));
    if (missing.length) throw new Error(`Target is missing migrations (run prisma migrate deploy first): ${missing.join(", ")}`);
    console.log(`✓ Target has all ${local.length} migrations applied.\n`);

    // 2. Plan the table copy.
    const columnsOf = async (c: Client, table: string, writableOnly: boolean) =>
      (await c.query(
        `SELECT column_name FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
            ${writableOnly ? "AND is_generated = 'NEVER'" : ""}
          ORDER BY ordinal_position`,
        [table],
      )).rows.map((r) => r.column_name as string);

    const plan: { table: string; cols: string[]; rows: number }[] = [];
    let blocked = false;
    console.log("Table                 source   target-now");
    for (const table of [...TABLES, ...SKIPPED]) {
      const s = Number((await source.query(`SELECT count(*) FROM "${table}"`)).rows[0].count);
      const t = Number((await target.query(`SELECT count(*) FROM "${table}"`)).rows[0].count);
      const note = SKIPPED.includes(table) ? "  (not copied: login state)" : "";
      console.log(`${table.padEnd(20)} ${String(s).padStart(7)} ${String(t).padStart(10)}${note}`);
      if (!TABLES.includes(table)) continue;
      if (t > 0) blocked = true;

      const srcCols = await columnsOf(source, table, false);
      const tgtCols = await columnsOf(target, table, true);
      const tgtAll = await columnsOf(target, table, false);
      const lost = srcCols.filter((c) => !tgtAll.includes(c));
      if (lost.length) throw new Error(`Target "${table}" has no column(s) ${lost.join(", ")} — schemas differ, aborting.`);
      // Generated columns (Recipe.search) are recomputed by Supabase itself.
      plan.push({ table, cols: srcCols.filter((c) => tgtCols.includes(c)), rows: s });
    }
    if (blocked) throw new Error("\nTarget already contains cookbook data. Refusing to copy on top of it (nothing was changed).");

    if (!EXECUTE) {
      console.log("\nDry run complete. Nothing was written. Re-run with --execute to copy.");
      return;
    }

    // 3. Copy — one transaction.
    await target.query("BEGIN");
    try {
      for (const { table, cols, rows } of plan) {
        if (!rows) continue;
        const { rows: data } = await source.query(`SELECT ${cols.map((c) => `"${c}"`).join(", ")} FROM "${table}"`);
        const per = Math.max(1, Math.floor(20000 / cols.length));
        for (let i = 0; i < data.length; i += per) {
          const chunk = data.slice(i, i + per);
          const params: unknown[] = [];
          const values = chunk.map((row) => `(${cols.map((c) => { params.push(row[c]); return `$${params.length}`; }).join(", ")})`);
          await target.query(`INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES ${values.join(", ")}`, params);
        }
        console.log(`  copied ${table}: ${data.length}`);
      }

      // 4. Verify before committing.
      for (const { table, rows } of plan) {
        const t = Number((await target.query(`SELECT count(*) FROM "${table}"`)).rows[0].count);
        if (t !== rows) throw new Error(`Verification failed for ${table}: expected ${rows}, found ${t}.`);
      }
      await target.query("COMMIT");
      console.log("\n✓ Copy committed and verified (row counts match).");
    } catch (err) {
      await target.query("ROLLBACK");
      console.error("\n✗ Rolled back — the target is unchanged.");
      throw err;
    }
  } finally {
    await source.query("ROLLBACK").catch(() => {});
    await source.end();
    await target.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
