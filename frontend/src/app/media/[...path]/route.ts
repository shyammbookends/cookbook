import { NextRequest } from "next/server";
import { serveMedia } from "@/server/media/serve";

/**
 * Serves stored images (encrypted in PostgreSQL, decrypted server-side) after an
 * authorization check — see server/media/serve.ts. Nothing here is a static file.
 */
export async function GET(_req: NextRequest, ctx: RouteContext<"/media/[...path]">) {
  const { path: segments } = await ctx.params;
  return serveMedia(segments);
}
