import "server-only";
import { hash, verify } from "@node-rs/argon2";

// OWASP-recommended argon2id parameters for an interactive login.
const OPTS = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, OPTS);
}

export async function verifyPassword(hashValue: string, password: string): Promise<boolean> {
  try {
    return await verify(hashValue, password, OPTS);
  } catch {
    return false;
  }
}

export function isPasswordStrongEnough(password: string): { ok: boolean; reason?: string } {
  if (password.length < 12) return { ok: false, reason: "Password must be at least 12 characters." };
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { ok: false, reason: "Use a mix of upper, lower case letters and numbers." };
  }
  return { ok: true };
}
