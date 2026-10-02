import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM envelope for stored files. The key comes ONLY from the
 * IMAGE_ENCRYPTION_KEY environment variable (64 hex chars or base64 of 32 bytes,
 * e.g. `openssl rand -hex 32`) — it is never stored in the database or in source,
 * and it is read lazily so builds without it still succeed.
 *
 * Each file gets a fresh random 12-byte IV, and the storage key is bound as AAD,
 * so a ciphertext copied onto another row fails authentication.
 */
export const KEY_VERSION = 1;

export interface Sealed {
  data: Buffer;
  iv: Buffer;
  authTag: Buffer;
  keyVersion: number;
}

function loadKey(): Buffer {
  const raw = process.env.IMAGE_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error("IMAGE_ENCRYPTION_KEY is not set.");
  const key = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("IMAGE_ENCRYPTION_KEY must be 32 bytes (64 hex characters or base64).");
  }
  return key;
}

export function encryptBytes(plain: Buffer, aad: string): Sealed {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", loadKey(), iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const data = Buffer.concat([cipher.update(plain), cipher.final()]);
  return { data, iv, authTag: cipher.getAuthTag(), keyVersion: KEY_VERSION };
}

export function decryptBytes(sealed: { data: Uint8Array; iv: Uint8Array; authTag: Uint8Array }, aad: string): Buffer {
  const decipher = createDecipheriv("aes-256-gcm", loadKey(), Buffer.from(sealed.iv));
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(Buffer.from(sealed.authTag));
  return Buffer.concat([decipher.update(Buffer.from(sealed.data)), decipher.final()]);
}
