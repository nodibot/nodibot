import * as XLSX from "xlsx";
import { parseLeadRows, parseLeadsCsv, type LeadImportResult } from "./csv";

export function isExcelFile(filename: string): boolean {
  const name = filename.toLowerCase();
  return name.endsWith(".xlsx") || name.endsWith(".xls");
}

export function parseLeadsXlsx(buffer: ArrayBuffer): LeadImportResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { rows: [], errors: ["Workbook has no sheets"] };

  const raw = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    defval: "",
  }) as unknown[][];

  return parseLeadRows(raw);
}

export async function parseLeadsFile(file: File): Promise<LeadImportResult> {
  if (isExcelFile(file.name)) {
    return parseLeadsXlsx(await file.arrayBuffer());
  }
  return parseLeadsCsv(await file.text());
}
