"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { verifyPassword, hashPassword, isPasswordStrongEnough } from "@/server/auth/password";
import { createSession, destroySession, destroyAllSessionsFor, getCurrentAdmin } from "@/server/auth/session";
import { isLoginLocked, recordLoginAttempt } from "@/server/auth/rateLimit";
import { requireAdmin } from "@/server/auth/guard";
import { toSafeError } from "@/lib/errors";

export interface ActionState {
  error?: string;
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!email || !password) return { error: "Enter your email and password." };

  if (await isLoginLocked(email, ip)) {
    return { error: "Too many failed attempts. Try again in a few minutes." };
  }

  const admin = await db.admin.findUnique({ where: { email } });
  const ok = admin?.isActive ? await verifyPassword(admin.passwordHash, password) : false;

  await recordLoginAttempt({ email, adminId: admin?.id, ipAddress: ip, success: ok });

  if (!ok || !admin) {
    return { error: "Incorrect email or password." };
  }

  await db.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await createSession(admin.id);
  // Same-site paths only ("//host" and "/\host" would be open redirects).
  redirect(/^\/(?![/\\])/.test(next) ? next : "/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

// Admin panel access (checked on the server only; the browser never sees these).
const ADMIN_ID = "BookendsAdmin";
const ADMIN_PASSWORD = "Bookendscab";

export async function secretLoginAction(id: string, password: string, next = "/admin"): Promise<ActionState> {
  if (id.trim() !== ADMIN_ID || password !== ADMIN_PASSWORD) {
    return { error: "Incorrect ID or password." };
  }

  // Find the seeded owner admin
  const admin = await db.admin.findFirst({
    where: { role: "OWNER", isActive: true },
  });

  if (!admin) {
    return { error: "Owner account not found." };
  }

  await db.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await createSession(admin.id);
  redirect(/^\/(?![/\\])/.test(next) ? next : "/admin");
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  try {
    const record = await db.admin.findUniqueOrThrow({ where: { id: admin.id } });
    if (!(await verifyPassword(record.passwordHash, current))) {
      return { error: "Current password is incorrect." };
    }
    if (next !== confirm) return { error: "New passwords don't match." };
    const strength = isPasswordStrongEnough(next);
    if (!strength.ok) return { error: strength.reason };

    await db.admin.update({ where: { id: admin.id }, data: { passwordHash: await hashPassword(next) } });
    await destroyAllSessionsFor(admin.id);
    await createSession(admin.id);
    return {};
  } catch (err) {
    return { error: toSafeError(err).body.error.message };
  }
}

export async function requireAdminOrRedirect(next?: string) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect(next ? `/admin/login?next=${encodeURIComponent(next)}` : "/admin/login");
  return admin;
}
