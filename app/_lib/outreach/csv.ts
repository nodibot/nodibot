// Lead import parsing from tabular data (CSV text or spreadsheet rows).
// Header row must include `company` and `email`; optional `contact_name`, `part_number`, `note`.

export interface ParsedLead {
  company: string;
  contact_name: string | null;
  email: string;
  part_number: string | null;
  note: string | null;
}

export interface LeadImportResult {
  rows: ParsedLead[];
  errors: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEADER_ERROR = "Header row must include 'company' and 'email'";

function splitLine(line: string): string[] {
  return line.split(",").map((c) => c.trim());
}

function emptyToNull(v: string | undefined): string | null {
  return v && v.trim() ? v.trim() : null;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function normalizeTableRows(raw: unknown[][]): string[][] {
  return raw
    .map((row) => (Array.isArray(row) ? row : []).map((cell) => String(cell ?? "").trim()))
    .filter((row) => row.some((cell) => cell.length > 0));
}

export function parseLeadRows(raw: unknown[][]): LeadImportResult {
  const table = normalizeTableRows(raw);
  const rows: ParsedLead[] = [];
  const errors: string[] = [];

  if (table.length === 0) return { rows, errors: ["File is empty"] };

  const header = table[0].map((h) => h.toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const ci = {
    company: idx("company"),
    contact: idx("contact_name"),
    email: idx("email"),
    part: idx("part_number"),
    note: idx("note"),
  };

  if (ci.company === -1 || ci.email === -1) {
    return { rows, errors: [HEADER_ERROR] };
  }

  for (let i = 1; i < table.length; i++) {
    const cells = table[i];
    const company = emptyToNull(cells[ci.company]);
    const email = (cells[ci.email] ?? "").trim().toLowerCase();
    if (!company) {
      errors.push(`Row ${i + 1}: missing company — skipped`);
      continue;
    }
    if (!EMAIL_RE.test(email)) {
      errors.push(`Row ${i + 1}: invalid email '${cells[ci.email] ?? ""}' — skipped`);
      continue;
    }
    rows.push({
      company,
      contact_name: ci.contact === -1 ? null : emptyToNull(cells[ci.contact]),
      email,
      part_number: ci.part === -1 ? null : emptyToNull(cells[ci.part]),
      note: ci.note === -1 ? null : emptyToNull(cells[ci.note]),
    });
  }

  return { rows, errors };
}

export function parseLeadsCsv(text: string): LeadImportResult {
  const normalized = stripBom(text);
  const lines = normalized.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], errors: ["File is empty"] };
  return parseLeadRows(lines.map(splitLine));
}

/** @deprecated use LeadImportResult */
export type CsvParseResult = LeadImportResult;
