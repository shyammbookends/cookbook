import "server-only";
import { cookies, headers } from "next/headers";
import { randomBytes, createHash } from "node:crypto";
import { db } from "@/server/db";
import type { Admin } from "@/generated/prisma/client";

const COOKIE_NAME = "bookends_admin_session";
const SESSION_DAYS = 7;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(adminId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const h = await headers();
  await db.session.create({
    data: {
      adminId,
      tokenHash,
      expiresAt,
      ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: h.get("user-agent") ?? null,
    },
  });

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.delete(COOKIE_NAME);
}

export async function destroyAllSessionsFor(adminId: string): Promise<void> {
  await db.session.deleteMany({ where: { adminId } });
}

export async function getCurrentAdmin(): Promise<Admin | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: true },
  });

  if (!session || session.expiresAt < new Date() || !session.admin.isActive) {
    return null;
  }

  return session.admin;
}
