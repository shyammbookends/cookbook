import "server-only";
import { localPut, localRemove } from "@/server/media/localfs";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/server/db";
import { encryptBytes, decryptBytes } from "@/server/media/crypto";
import { supabaseGet, supabasePut, supabaseRemove } from "@/server/media/supabaseStore";

/**
 * Storage adapter interface. `supabase` keeps AES-256-GCM encrypted objects in a
 * private Supabase Storage bucket (see supabaseStore.ts). `db` keeps the same
 * encrypted bytes in PostgreSQL. Both are served only through the authorizing
 * /media route. `local` writes to disk under STORAGE_LOCAL_DIR for dev. `r2`
 * (S3-compatible) is optional — swap STORAGE_DRIVER, no application code changes.
 */
export interface StorageAdapter {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  remove(key: string): Promise<void>;
  publicUrl(key: string): string;
}

class DbStorageAdapter implements StorageAdapter {
  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    const sealed = encryptBytes(data, key);
    const mediaId = /^media\/([^/]+)\//.exec(key)?.[1] ?? null;
    const row = { mediaId, contentType, data: new Uint8Array(sealed.data), iv: new Uint8Array(sealed.iv), authTag: new Uint8Array(sealed.authTag), keyVersion: sealed.keyVersion, plainBytes: data.byteLength };
    await db.mediaBlob.upsert({ where: { key }, create: { key, ...row }, update: row });
  }

  async remove(key: string): Promise<void> {
    await db.mediaBlob.deleteMany({ where: { key } });
  }

  publicUrl(key: string): string {
    return `/media/${key.replace(/^media\//, "")}`;
  }
}

class SupabaseStorageAdapter implements StorageAdapter {
  put(key: string, data: Buffer, contentType: string): Promise<void> {
    return supabasePut(key, data, contentType);
  }

  remove(key: string): Promise<void> {
    return supabaseRemove(key);
  }

  publicUrl(key: string): string {
    return `/media/${key.replace(/^media\//, "")}`;
  }
}

/**
 * Server-side read + decrypt of a stored file. With the `supabase` driver the
 * bucket is tried first; the `MediaBlob` table remains a fallback for any file
 * stored there by the `db` driver.
 */
export async function readStoredFile(key: string): Promise<{ data: Buffer; contentType: string } | null> {
  if (storageDriver() === "supabase") {
    const file = await supabaseGet(key);
    if (file) return file;
  }
  const row = await db.mediaBlob.findUnique({ where: { key } });
  if (!row) return null;
  return { data: decryptBytes(row, key), contentType: row.contentType };
}

class LocalStorageAdapter implements StorageAdapter {
  private publicBase = process.env.STORAGE_PUBLIC_BASE ?? "/media";

  async put(key: string, data: Buffer): Promise<void> {
    await localPut(key, data);
  }

  async remove(key: string): Promise<void> {
    await localRemove(key);
  }

  publicUrl(key: string): string {
    return `${this.publicBase}/${key}`;
  }
}

class R2StorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;
  private publicBase: string;

  constructor() {
    this.bucket = process.env.R2_BUCKET_MEDIA ?? "";
    this.publicBase = process.env.R2_PUBLIC_BASE_URL ?? "";
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
      },
    });
  }

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  }

  async remove(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  publicUrl(key: string): string {
    return `${this.publicBase}/${key}`;
  }
}

let adapter: StorageAdapter | null = null;

function storageDriver(): string {
  // Vercel/production has no persistent disk, so encrypted PostgreSQL storage is the default there.
  return process.env.STORAGE_DRIVER ?? (process.env.NODE_ENV === "production" ? "db" : "local");
}

export function getStorage(): StorageAdapter {
  if (!adapter) {
    const driver = storageDriver();
    adapter =
      driver === "supabase" ? new SupabaseStorageAdapter()
      : driver === "r2" ? new R2StorageAdapter()
      : driver === "local" ? new LocalStorageAdapter()
      : new DbStorageAdapter();
  }
  return adapter;
}
