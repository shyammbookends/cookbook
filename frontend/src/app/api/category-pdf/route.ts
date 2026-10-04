import { NextRequest, NextResponse } from "next/server";
import { loadPrintData, parsePrintQuery } from "@/server/print/data";

/**
 * GET /api/category-pdf?brand=<slug>&category=<slug>
 * GET /api/category-pdf?brand=<slug>&recipe=<slug>
 * GET /api/category-pdf?brand=<slug>&cookbook=1
 *
 * Returns published recipes as JSON in the shape the printable single-page SOP
 * cards need (see lib/recipe-print.ts). Used by the in-browser PDF fallback when
 * the server-rendered /api/pdf is unavailable. Read live on every request.
 */
export async function GET(req: NextRequest) {
  const query = parsePrintQuery(req.nextUrl.searchParams);
  if (!query) {
    return NextResponse.json({ error: "brand and category (or recipe, or cookbook=1) params required" }, { status: 400 });
  }

  const data = await loadPrintData(query);
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
