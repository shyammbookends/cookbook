import "server-only";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Storage adapter interface. `local` writes to disk under STORAGE_LOCAL_DIR
 * and is served by the /media route in dev. `r2` (S3-compatible) is the
 * production driver — swap STORAGE_DRIVER, no application code changes.
 */
export interface StorageAdapter {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  remove(key: string): Promise<void>;
  publicUrl(key: string): string;
}

class LocalStorageAdapter implements StorageAdapter {
  private root: string;
  private publicBase: string;

  constructor() {
    this.root = path.resolve(process.cwd(), /* turbopackIgnore: true */ process.env.STORAGE_LOCAL_DIR ?? "./.media");
    this.publicBase = process.env.STORAGE_PUBLIC_BASE ?? "/media";
  }

  async put(key: string, data: Buffer): Promise<void> {
    const filePath = path.join(this.root, key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
  }

  async remove(key: string): Promise<void> {
    const filePath = path.join(this.root, key);
    await unlink(filePath).catch(() => {});
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

export function getStorage(): StorageAdapter {
  if (!adapter) {
    adapter = process.env.STORAGE_DRIVER === "r2" ? new R2StorageAdapter() : new LocalStorageAdapter();
  }
  return adapter;
}
