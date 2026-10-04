import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { encryptBytes, decryptBytes } from "./crypto";

/**
 * Encrypted file store on a PRIVATE Supabase Storage bucket, via its S3 API.
 *
 * Every object is sealed with AES-256-GCM (IMAGE_ENCRYPTION_KEY, see crypto.ts)
 * before it leaves the server, so the bucket only ever holds ciphertext. The
 * storage key is bound as AAD, exactly like the `db` driver. Object layout:
 *
 *   "BKE1" | keyVersion (1 byte) | contentType length (1 byte) | contentType
 *          | iv (12 bytes) | authTag (16 bytes) | ciphertext
 *
 * Files are served only through the authorizing /media route (server/media/serve.ts).
 * Kept free of `@/` imports so backend/scripts can use it too.
 */
const MAGIC = Buffer.from("BKE1");

let client: S3Client | null = null;

function env(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} is not set (required for STORAGE_DRIVER=supabase).`);
  return v;
}

export function supabaseBucket(): string {
  return env("SUPABASE_STORAGE_BUCKET");
}

export function supabaseClient(): S3Client {
  return (client ??= new S3Client({
    endpoint: env("SUPABASE_S3_ENDPOINT"),
    region: env("SUPABASE_S3_REGION"),
    forcePathStyle: true,
    credentials: {
      accessKeyId: env("SUPABASE_S3_ACCESS_KEY_ID"),
      secretAccessKey: env("SUPABASE_S3_SECRET_ACCESS_KEY"),
    },
  }));
}

export function sealObject(key: string, data: Buffer, contentType: string): Buffer {
  const ct = Buffer.from(contentType, "utf8");
  if (ct.length > 255) throw new Error("Content type too long.");
  const sealed = encryptBytes(data, key);
  return Buffer.concat([MAGIC, Buffer.from([sealed.keyVersion, ct.length]), ct, sealed.iv, sealed.authTag, sealed.data]);
}

export function openObject(key: string, body: Buffer): { data: Buffer; contentType: string } {
  if (body.length < 6 || !body.subarray(0, 4).equals(MAGIC)) throw new Error(`Stored object ${key} is not encrypted with this app's format.`);
  const ctLen = body[5];
  let at = 6;
  const contentType = body.subarray(at, (at += ctLen)).toString("utf8");
  const iv = body.subarray(at, (at += 12));
  const authTag = body.subarray(at, (at += 16));
  return { data: decryptBytes({ data: body.subarray(at), iv, authTag }, key), contentType };
}

export async function supabasePut(key: string, data: Buffer, contentType: string): Promise<void> {
  await supabaseClient().send(
    new PutObjectCommand({ Bucket: supabaseBucket(), Key: key, Body: sealObject(key, data, contentType), ContentType: "application/octet-stream" }),
  );
}

/** Returns null when the object does not exist. */
export async function supabaseGet(key: string): Promise<{ data: Buffer; contentType: string } | null> {
  try {
    const res = await supabaseClient().send(new GetObjectCommand({ Bucket: supabaseBucket(), Key: key }));
    const body = Buffer.from(await res.Body!.transformToByteArray());
    return openObject(key, body);
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export async function supabaseExists(key: string): Promise<boolean> {
  try {
    await supabaseClient().send(new HeadObjectCommand({ Bucket: supabaseBucket(), Key: key }));
    return true;
  } catch (err) {
    if (isNotFound(err)) return false;
    throw err;
  }
}

export async function supabaseRemove(key: string): Promise<void> {
  await supabaseClient().send(new DeleteObjectCommand({ Bucket: supabaseBucket(), Key: key }));
}

function isNotFound(err: unknown): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e?.name === "NoSuchKey" || e?.name === "NotFound" || e?.$metadata?.httpStatusCode === 404;
}
