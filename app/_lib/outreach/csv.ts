// Pure CSV parsing for lead import. Expects a header row containing at least
// `company` and `email`; optional `contact_name`, `part_number`, `note`.

export interface ParsedLead {
  company: string;
  contact_name: string | null;
  email: string;
  part_number: string | null;
  note: string | null;
}

export interface CsvParseResult {
  rows: ParsedLead[];
  errors: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function splitLine(line: string): string[] {
  // Minimal CSV: split on commas, trim. (Lead lists rarely embed commas; the
  // import UI documents this limitation.)
  return line.split(",").map((c) => c.trim());
}

function emptyToNull(v: string | undefined): string | null {
  return v && v.trim() ? v.trim() : null;
}

export function parseLeadsCsv(text: string): CsvParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: ParsedLead[] = [];
  const errors: string[] = [];
  if (lines.length === 0) return { rows, errors: ["CSV is empty"] };

  const header = splitLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const ci = { company: idx("company"), contact: idx("contact_name"), email: idx("email"), part: idx("part_number"), note: idx("note") };

  if (ci.company === -1 || ci.email === -1) {
    return { rows, errors: ["CSV header must include 'company' and 'email'"] };
  }

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const company = emptyToNull(cells[ci.company]);
    const email = (cells[ci.email] ?? "").trim().toLowerCase();
    if (!company) {
      errors.push(`Line ${i + 1}: missing company — skipped`);
      continue;
    }
    if (!EMAIL_RE.test(email)) {
      errors.push(`Line ${i + 1}: invalid email '${cells[ci.email] ?? ""}' — skipped`);
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
