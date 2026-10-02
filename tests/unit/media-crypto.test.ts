import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
process.env.IMAGE_ENCRYPTION_KEY = "ab".repeat(32);

describe("media crypto (AES-256-GCM)", () => {
  it("round-trips and never stores plaintext", async () => {
    const { encryptBytes, decryptBytes } = await import("@/server/media/crypto");
    const plain = Buffer.from("secret image bytes");
    const sealed = encryptBytes(plain, "media/x/1.webp");
    expect(sealed.data.equals(plain)).toBe(false);
    expect(sealed.iv.length).toBe(12);
    expect(sealed.authTag.length).toBe(16);
    expect(decryptBytes(sealed, "media/x/1.webp").equals(plain)).toBe(true);
  });
  it("rejects tampering and wrong AAD", async () => {
    const { encryptBytes, decryptBytes } = await import("@/server/media/crypto");
    const sealed = encryptBytes(Buffer.from("hello"), "media/a/1.webp");
    expect(() => decryptBytes(sealed, "media/b/1.webp")).toThrow();
    sealed.data[0] ^= 1;
    expect(() => decryptBytes(sealed, "media/a/1.webp")).toThrow();
  });
});
