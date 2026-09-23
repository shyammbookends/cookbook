import "server-only";
import { getCurrentAdmin } from "@/server/auth/session";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import type { Admin, AdminRole } from "@/generated/prisma/client";

const ROLE_RANK: Record<AdminRole, number> = { EDITOR: 0, ADMIN: 1, OWNER: 2 };

/**
 * Call at the start of every admin server action and admin API route.
 * Throws (never returns null) so callers can't accidentally skip the check.
 */
export async function requireAdmin(minRole: AdminRole = "EDITOR"): Promise<Admin> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new UnauthorizedError();
  if (ROLE_RANK[admin.role] < ROLE_RANK[minRole]) {
    throw new ForbiddenError(`This action requires the ${minRole} role or higher.`);
  }
  return admin;
}
