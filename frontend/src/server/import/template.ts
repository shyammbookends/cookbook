import "server-only";
import ExcelJS from "exceljs";
import { db } from "@/server/db";
import { IMPORT_COLUMNS } from "@/server/import/columns";

/**
 * Generated live on every download, so the Brand/Category dropdowns always
 * reflect what's actually in the database right now.
 */
export async function buildImportTemplate(): Promise<Buffer> {
  const [brands, categories, fields] = await Promise.all([
    db.brand.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } }),
    db.category.findMany({ include: { brand: true }, orderBy: [{ brand: { sortOrder: "asc" } }, { sortOrder: "asc" }] }),
    db.fieldDefinition.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Bookends Hospitality";
  wb.created = new Date();

  // ── Instructions ─────────────────────────────────────────────────────
  const instructions = wb.addWorksheet("Instructions");
  instructions.columns = [{ width: 28 }, { width: 90 }];
  instructions.addRow(["Bookends Hospitality — Recipe Import Template", ""]).font = { bold: true, size: 14 };
  instructions.addRow([]);
  instructions.addRow(["How to use this file", ""]).font = { bold: true };
  [
    "1. Fill in the 'Recipes' sheet. Do not rename or reorder the header row.",
    "2. Columns marked * are required. Everything else is optional.",
    "3. One ingredient per line in the 'ingredients' column. Start a line with ## for a group header, e.g. ## For the sauce.",
    "4. One step per line in 'prep_steps' / 'cook_steps'. At least one of the two is required.",
    "5. Times accept '20', '20 min', or '1h 20m'.",
    "6. 'brand' and 'category' must match an existing value — see the 'Lists' sheet for valid options.",
    "7. hero_image / gallery_images accept a direct https:// image URL.",
    "8. Leave 'status' blank to import as Draft. Set to 'Published' to publish immediately (still requires a hero image).",
    "9. Delete the 'Example' sheet's two sample rows before importing your real data — they are ignored automatically, but check anyway.",
    "10. Upload this file from Admin → Import Excel. You'll see a preview with any errors before anything is saved.",
  ].forEach((line) => instructions.addRow(["", line]));
  instructions.addRow([]);
  instructions.addRow(["Column reference", ""]).font = { bold: true };
  instructions.addRow(["Column", "What it means"]).font = { bold: true, italic: true };
  for (const col of IMPORT_COLUMNS) {
    instructions.addRow([col.required ? `${col.key} *` : col.key, col.help || col.label]);
  }
  for (const f of fields) {
    instructions.addRow([`custom:${f.key}`, `${f.label} (${f.type}${f.required ? ", required" : ""})`]);
  }

  // ── Lists (dropdown sources) ────────────────────────────────────────
  const lists = wb.addWorksheet("Lists");
  lists.getColumn(1).values = ["Brands", ...brands.map((b) => b.name)];
  lists.getColumn(2).values = ["Categories", ...categories.map((c) => `${c.brand.name}: ${c.name}`)];
  lists.getColumn(3).values = ["Difficulty", "Easy", "Medium", "Hard"];
  lists.getColumn(4).values = ["Status", "Draft", "Published"];
  lists.getColumn(5).values = ["Featured", "Yes", "No"];

  // ── Recipes (the actual data sheet) ─────────────────────────────────
  const sheet = wb.addWorksheet("Recipes", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = IMPORT_COLUMNS.map((c) => ({
    header: c.required ? `${c.key} *` : c.key,
    key: c.key,
    width: Math.min(Math.max(c.label.length, 16), 40),
  }));
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell, colNumber) => {
    const col = IMPORT_COLUMNS[colNumber - 1];
    if (col?.required) cell.font = { bold: true, color: { argb: "FFB00020" } };
  });

  const brandColIdx = IMPORT_COLUMNS.findIndex((c) => c.key === "brand") + 1;
  const difficultyColIdx = IMPORT_COLUMNS.findIndex((c) => c.key === "difficulty") + 1;
  const statusColIdx = IMPORT_COLUMNS.findIndex((c) => c.key === "status") + 1;
  const featuredColIdx = IMPORT_COLUMNS.findIndex((c) => c.key === "featured") + 1;

  const lastDataRow = 500;
  for (let r = 2; r <= lastDataRow; r++) {
    sheet.getCell(r, brandColIdx).dataValidation = {
      type: "list", allowBlank: true, formulae: [`Lists!$A$2:$A$${brands.length + 1}`],
    };
    sheet.getCell(r, difficultyColIdx).dataValidation = {
      type: "list", allowBlank: true, formulae: ["Lists!$C$2:$C$4"],
    };
    sheet.getCell(r, statusColIdx).dataValidation = {
      type: "list", allowBlank: true, formulae: ["Lists!$D$2:$D$3"],
    };
    sheet.getCell(r, featuredColIdx).dataValidation = {
      type: "list", allowBlank: true, formulae: ["Lists!$E$2:$E$3"],
    };
  }

  // ── Example ──────────────────────────────────────────────────────────
  const example = wb.addWorksheet("Example");
  example.columns = sheet.columns.map((c) => ({ ...c }));
  example.addRow({
    external_id: "CAP-001",
    title: "Hot Honey Pepperoni",
    brand: brands[0]?.name ?? "Capiche",
    category: "Pizzas",
    ingredients: "## Dough\n500g bread flour\n1 tsp salt\n## Topping\n200g mozzarella, shredded\n80g pepperoni, sliced",
    prep_steps: "Mix and knead the dough\nProof for 1 hour",
    cook_steps: "Top the base\nBake at 250C for 8 minutes\nDrizzle with hot honey",
    prep_time: "20 min",
    cook_time: "10 min",
    servings: "4",
    difficulty: "Medium",
    tags: "spicy, bestseller",
    hero_image: "https://example.com/hot-honey-pepperoni.jpg",
    status: "Draft",
    featured: "No",
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
