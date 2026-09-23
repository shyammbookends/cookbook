import "server-only";
import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma 7 uses driver adapters instead of the bundled Rust engine. This is
 * the ONLY place `@prisma/client` may be imported from — `server/public/*`
 * and `server/services/*` import this module, and everything else (pages,
 * API routes, components) imports from those, never from here directly.
 * (Enforced by an ESLint `no-restricted-imports` rule — see eslint.config.mjs.)
 */

declare global {
  var __prisma: PrismaClient | undefined;
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Reuse the client across hot reloads in dev so we don't exhaust connections.
export const db = process.env.NODE_ENV === "production" ? (globalThis.__prisma ?? createClient()) : createClient();
if (process.env.NODE_ENV === "production") {
  globalThis.__prisma = db;
}
