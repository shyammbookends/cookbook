import "server-only";
import { db } from "@/server/db";

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 5;

export async function isLoginLocked(email: string, ipAddress: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  const [byEmail, byIp] = await Promise.all([
    db.loginAttempt.count({ where: { email, success: false, createdAt: { gte: since } } }),
    db.loginAttempt.count({ where: { ipAddress, success: false, createdAt: { gte: since } } }),
  ]);
  return byEmail >= MAX_ATTEMPTS || byIp >= MAX_ATTEMPTS * 4;
}

export async function recordLoginAttempt(opts: {
  email: string;
  adminId?: string | null;
  ipAddress: string;
  success: boolean;
}): Promise<void> {
  await db.loginAttempt.create({
    data: {
      email: opts.email,
      adminId: opts.adminId ?? null,
      ipAddress: opts.ipAddress,
      success: opts.success,
    },
  });
}
