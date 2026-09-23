import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/guard";
import { buildImportTemplate } from "@/server/import/template";
import { toSafeError } from "@/lib/errors";

export async function GET() {
  try {
    await requireAdmin("EDITOR");
    const buffer = await buildImportTemplate();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="bookends-recipe-import-template.xlsx"',
      },
    });
  } catch (err) {
    const safe = toSafeError(err);
    return NextResponse.json(safe.body, { status: safe.status });
  }
}
