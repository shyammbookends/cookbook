import "server-only";
import * as XLSX from "xlsx";
import { fileTypeFromBuffer } from "file-type";
import { UploadError } from "@/server/media/errors";

export const MAX_IMPORT_ROWS = 2000;
export const MAX_IMPORT_COLUMNS = 200;
export const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;
const MAX_CELL_CHARS = 20_000;

/**
 * Confirms the file is really a spreadsheet (by magic bytes, not by
 * extension), rejects macro-enabled workbooks and caps size before SheetJS
 * ever touches it.
 */
export async function validateImportFile(buffer: Buffer, originalName: string): Promise<void> {
  if (buffer.byteLength === 0) throw new UploadError("The file is empty.");
  if (buffer.byteLength > MAX_IMPORT_FILE_BYTES) {
    throw new UploadError(`File is too large (max ${MAX_IMPORT_FILE_BYTES / 1024 / 1024} MB).`);
  }

  const lower = originalName.toLowerCase();
  if (lower.endsWith(".xlsm") || lower.endsWith(".xlsb")) {
    throw new UploadError("Macro-enabled workbooks (.xlsm/.xlsb) are not accepted. Please save as .xlsx.");
  }

  const type = await fileTypeFromBuffer(buffer);
  const isZipBased = type?.mime === "application/zip" || buffer.subarray(0, 2).toString() === "PK";
  const isOle = buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])); // legacy .xls
  const isCsvLike = lower.endsWith(".csv") && !type; // plain text, file-type returns undefined

  if (!isZipBased && !isOle && !isCsvLike) {
    throw new UploadError("This doesn't look like a valid Excel or CSV file.");
  }
}

export interface ParsedSheet {
  headers: string[];
  rows: { rowNumber: number; cells: unknown[] }[]; // rowNumber = actual Excel row number (1-based)
}

/**
 * Parses with SheetJS reading VALUES ONLY — formulas are never evaluated
 * (cellFormula/bookVBA are off), which closes off Excel formula-injection
 * and macro attack surface entirely.
 */
export function parseWorkbook(buffer: Buffer): ParsedSheet {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    cellFormula: false,
    bookVBA: false,
    WTF: false,
  });

  const sheetName = workbook.SheetNames.find((n) => !/^instructions$|^example$|^lists$/i.test(n)) ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new UploadError("No usable sheet found in the workbook.");

  const grid: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });

  if (grid.length === 0) throw new UploadError("The sheet is empty.");
  if (grid[0].length > MAX_IMPORT_COLUMNS) {
    throw new UploadError(`Too many columns (max ${MAX_IMPORT_COLUMNS}).`);
  }

  // Header row = first row with at least 2 non-empty cells.
  const headerRowIdx = grid.findIndex((row) => row.filter((c) => String(c ?? "").trim() !== "").length >= 2);
  if (headerRowIdx === -1) throw new UploadError("Could not find a header row.");

  const headers = grid[headerRowIdx].map((h) => String(h ?? "").trim());

  const dataRows = grid.slice(headerRowIdx + 1);
  if (dataRows.length > MAX_IMPORT_ROWS) {
    throw new UploadError(`Too many rows (max ${MAX_IMPORT_ROWS}). Split the file and import in batches.`);
  }

  const rows = dataRows
    .map((cells, i) => ({ rowNumber: headerRowIdx + i + 2, cells })) // +2: 1-based, plus header row itself
    .filter(({ cells }) => cells.some((c) => String(c ?? "").trim() !== ""));

  for (const row of rows) {
    for (const cell of row.cells) {
      if (typeof cell === "string" && cell.length > MAX_CELL_CHARS) {
        throw new UploadError(`Row ${row.rowNumber} has a cell over ${MAX_CELL_CHARS} characters.`);
      }
    }
  }

  return { headers, rows };
}

/** Turns a mapped row into { columnKey: rawValue } using the saved header->key mapping. */
export function rowToRecord(headers: string[], cells: unknown[], mapping: Record<number, string | null>): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  headers.forEach((_h, idx) => {
    const key = mapping[idx];
    if (key) record[key] = cells[idx];
  });
  return record;
}
