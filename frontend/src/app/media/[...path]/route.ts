import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Serves locally stored media (STORAGE_DRIVER=local) in dev/small deployments.
 * In production with STORAGE_DRIVER=r2, media is served directly from the
 * CDN in front of the R2 bucket and this route isn't used.
 */
const EXT_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export async function GET(_req: NextRequest, ctx: RouteContext<"/media/[...path]">) {
  const { path: segments } = await ctx.params;

  // Reject any traversal attempt outright.
  if (segments.some((s) => s.includes("..") || s.includes("\\"))) {
    return new NextResponse("Not found", { status: 404 });
  }

  // turbopackIgnore: this is a fixed local dev/small-deployment media
  // directory, not arbitrary project files — see server/media/storage.ts.
  const root = path.resolve(process.cwd(), /* turbopackIgnore: true */ process.env.STORAGE_LOCAL_DIR ?? "./.media");
  const filePath = path.join(/* turbopackIgnore: true */ root, ...segments);
  if (!filePath.startsWith(root)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": EXT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
