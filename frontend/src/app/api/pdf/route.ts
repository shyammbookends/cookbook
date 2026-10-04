import { NextRequest, NextResponse } from "next/server";
import { loadPrintData, parsePrintQuery, printVersion } from "@/server/print/data";
import { printFileName, renderPrintPdf } from "@/server/print/pdf";

// Headless Chromium needs the Node.js runtime and some time for a full cookbook.
export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * GET /api/pdf?brand=<slug>&category=<slug> | &recipe=<slug> | &cookbook=1
 *
 * 1. Without `v` (or with an outdated one) it redirects to the same URL with the
 *    current content fingerprint `v` (see printVersion) — never cached.
 * 2. With the current `v` it renders the PDF on the server and returns it with
 *    long CDN caching. The URL is unique per content version, so the first
 *    download after an edit renders it once and everyone after that gets the
 *    cached file instantly. Nothing is written to storage.
 */
// Warm-instance memory cache (Vercel reuses instances), so a CDN miss in another
// region or after eviction doesn't re-launch Chromium. Bounded to ~80 MB.
const MEMORY_LIMIT = 80 * 1024 * 1024;
const memory = new Map<string, { pdf: Uint8Array; fileName: string }>();

function remember(key: string, entry: { pdf: Uint8Array; fileName: string }) {
  memory.delete(key);
  memory.set(key, entry);
  let total = 0;
  for (const e of memory.values()) total += e.pdf.byteLength;
  for (const [k, e] of memory) {
    if (total <= MEMORY_LIMIT) break;
    memory.delete(k); // oldest first (Map keeps insertion order)
    total -= e.pdf.byteLength;
  }
}

export async function GET(req: NextRequest) {
  const query = parsePrintQuery(req.nextUrl.searchParams);
  if (!query) return NextResponse.json({ error: "brand and category (or recipe, or cookbook=1) params required" }, { status: 400 });

  const version = await printVersion(query);
  if (!version) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (req.nextUrl.searchParams.get("v") !== version) {
    const url = req.nextUrl.clone();
    url.searchParams.set("v", version);
    return NextResponse.redirect(url, { status: 307, headers: { "Cache-Control": "no-store" } });
  }

  const cacheKey = req.nextUrl.search;
  let entry = memory.get(cacheKey);
  if (!entry) {
    const data = await loadPrintData(query);
    if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
    const empty = data.kind === "cookbook" ? data.categories.length === 0 : data.recipes.length === 0;
    if (empty) return NextResponse.json({ error: "no recipes" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    entry = { pdf: await renderPrintPdf(data), fileName: printFileName(data) };
    remember(cacheKey, entry);
  }
  const { pdf, fileName } = entry;

  // Streamed so large cookbooks aren't held to the 4.5 MB non-streaming response limit.
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const CHUNK = 256 * 1024;
      for (let i = 0; i < pdf.byteLength; i += CHUNK) controller.enqueue(pdf.subarray(i, i + CHUNK));
      controller.close();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      // ASCII fallback name for old clients + the exact UTF-8 name for everyone else.
      "Content-Disposition": `attachment; filename="${fileName.replace(/[^\x20-\x7E]|"/g, "")}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      // Browser: always re-check (cheap redirect); Vercel CDN: keep this exact version for a year.
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Vercel-CDN-Cache-Control": "public, s-maxage=31536000",
    },
  });
}
