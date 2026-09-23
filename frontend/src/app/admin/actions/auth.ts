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
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

export async function secretLoginAction(secret: string): Promise<ActionState> {
  if (secret !== "bookends") {
    return { error: "Invalid secret." };
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
  redirect("/admin/recipes");
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

export async function requireAdminOrRedirect() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
