/**
 * One-time upload of the local image files (.media/, STORAGE_DRIVER=local) into
 * the private Supabase Storage bucket, ENCRYPTED with the same code the app uses
 * at runtime (frontend/src/server/media/supabaseStore.ts).
 *
 * Only files referenced by the local `Media` table are uploaded (the ones the
 * site actually shows). Object keys are the exact same relative paths as on
 * disk, e.g. .media/media/<id>/640.webp -> media/<id>/640.webp, so no database
 * record or URL changes.
 *
 * DRY RUN BY DEFAULT. Pass --execute to upload, --verify to only re-check.
 * Never deletes or overwrites anything: objects that already exist are skipped,
 * and local files are only read.
 *
 * Settings come from .env.supabase (override with MIGRATION_ENV_FILE):
 *   SOURCE_DATABASE_URL, IMAGE_ENCRYPTION_KEY, SUPABASE_STORAGE_BUCKET,
 *   SUPABASE_S3_ENDPOINT, SUPABASE_S3_REGION, SUPABASE_S3_ACCESS_KEY_ID,
 *   SUPABASE_S3_SECRET_ACCESS_KEY, STORAGE_LOCAL_DIR (optional, default ./.media)
 *
 *   npm run media:upload-to-supabase                 # dry run
 *   npm run media:upload-to-supabase -- --execute    # upload + verify
 *   npm run media:upload-to-supabase -- --verify     # verify only
 */
import { config } from "dotenv";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { supabaseBucket, supabaseClient, supabaseGet, supabasePut } from "../../frontend/src/server/media/supabaseStore";

config({ path: process.env.MIGRATION_ENV_FILE ?? ".env.supabase", quiet: true });

const EXECUTE = process.argv.includes("--execute");
const VERIFY_ONLY = process.argv.includes("--verify");
const CONTENT_TYPES: Record<string, string> = {
  ".avif": "image/avif", ".webp": "image/webp", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".png": "image/png",
};

const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");

async function listBucket(): Promise<Set<string>> {
  const keys = new Set<string>();
  let token: string | undefined;
  do {
    const res = await supabaseClient().send(
      new ListObjectsV2Command({ Bucket: supabaseBucket(), Prefix: "media/", ContinuationToken: token }),
    );
    for (const o of res.Contents ?? []) if (o.Key) keys.add(o.Key);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function inBatches<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) await Promise.all(items.slice(i, i + size).map(fn));
}

async function main() {
  const sourceUrl = process.env.SOURCE_DATABASE_URL?.trim();
  if (!sourceUrl) throw new Error("SOURCE_DATABASE_URL is not set (put it in .env.supabase).");
  const mediaDir = path.resolve(process.env.STORAGE_LOCAL_DIR ?? "./.media");

  // 1. Which files does the site use?
  const db = new Client({ connectionString: sourceUrl });
  await db.connect();
  const media = await db.query(`SELECT id, "storageKey", variants FROM "Media"`).finally(() => db.end());
  const files: { key: string; file: string; bytes: number }[] = [];
  const missing: string[] = [];
  const keys = new Set<string>();
  for (const m of media.rows) {
    for (const v of (Array.isArray(m.variants) ? m.variants : []) as { key?: string }[]) if (v.key) keys.add(v.key);
  }
  for (const key of keys) {
    if (/^https?:\/\//.test(key)) continue;
    const file = path.resolve(mediaDir, key);
    if (!file.startsWith(mediaDir + path.sep) || !existsSync(file) || !statSync(file).isFile()) { missing.push(key); continue; }
    files.push({ key, file, bytes: statSync(file).size });
  }

  console.log(EXECUTE ? "\n*** EXECUTE MODE — will upload ***\n" : VERIFY_ONLY ? "\n--- VERIFY ONLY ---\n" : "\n--- DRY RUN (nothing is uploaded; add --execute) ---\n");
  console.log(`Bucket:       "${supabaseBucket()}" (private)`);
  console.log(`Local folder: ${mediaDir}`);
  console.log(`Image files used by the site: ${files.length} (${(files.reduce((n, f) => n + f.bytes, 0) / 1e6).toFixed(1)} MB)`);
  if (missing.length) console.log(`⚠ ${missing.length} referenced files are missing on disk:`, missing.slice(0, 10));

  // 2. What is already in the bucket? (also proves the S3 keys work)
  const existing = await listBucket();
  const todo = files.filter((f) => !existing.has(f.key));
  console.log(`Already in bucket: ${files.length - todo.length}   To upload (encrypted): ${todo.length}`);

  if (!EXECUTE && !VERIFY_ONLY) {
    console.log("\nDry run complete. Nothing was uploaded. Re-run with --execute to upload.");
    return;
  }

  // 3. Upload (skip anything already there — never overwrite).
  if (EXECUTE) {
    let done = 0;
    await inBatches(todo, 8, async (f) => {
      await supabasePut(f.key, readFileSync(f.file), CONTENT_TYPES[path.extname(f.key).toLowerCase()] ?? "application/octet-stream");
      if (++done % 100 === 0) console.log(`  uploaded ${done}/${todo.length}`);
    });
    console.log(`  uploaded ${done}/${todo.length}`);
  }

  // 4. Verify: every file is in the bucket, decrypts, and is byte-identical to the local file.
  console.log("\nVerifying (download + decrypt + SHA-256 compare)...");
  const after = await listBucket();
  const bad: string[] = [];
  let ok = 0;
  await inBatches(files, 8, async (f) => {
    const got = await supabaseGet(f.key).catch(() => null);
    if (got && sha(got.data) === sha(readFileSync(f.file))) ok++;
    else bad.push(f.key);
  });
  const plain = [...after].length;
  console.log(`Objects in bucket under media/: ${plain}`);
  console.log(`Verified identical after decrypt: ${ok}/${files.length}`);
  if (bad.length) {
    console.log(`✗ ${bad.length} files failed verification:`, bad.slice(0, 10));
    process.exit(1);
  }
  console.log("✓ All images are in the bucket, encrypted, and decrypt to the exact original bytes.");
}

main().catch((err) => {
  console.error(err instanceof Error ? `${err.name}: ${err.message}` : err);
  process.exit(1);
});
