import "server-only";
import { revalidateTag as nextRevalidateTag } from "next/cache";

/**
 * Thin wrapper so every call site doesn't have to remember Next 16's new
 * required second argument. `{ expire: 0 }` means "never serve stale" —
 * correct for admin-triggered content changes, where the next visitor
 * should immediately see the update rather than a cached-for-a-year page.
 */
export function revalidateTag(tag: string): void {
  nextRevalidateTag(tag, { expire: 0 });
}
