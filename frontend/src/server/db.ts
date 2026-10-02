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
  // Small pool: on serverless every warm instance holds its own connections.
  const adapter = new PrismaPg({ connectionString, max: Number(process.env.DATABASE_POOL_MAX ?? 5) });
  return new PrismaClient({ adapter });
}

function getClient(): PrismaClient {
  // One client per server instance (also survives dev hot reloads).
  return (globalThis.__prisma ??= createClient());
}

/**
 * Connects lazily on first use, NOT at import time. `next build` imports every
 * route module to collect its config, and that must not require (or open) a
 * database connection — a missing DATABASE_URL still fails loudly, but only when
 * a query actually runs.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop);
  },
  has(_target, prop) {
    return Reflect.has(getClient(), prop);
  },
});
