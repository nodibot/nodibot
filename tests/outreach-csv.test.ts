import * as XLSX from "xlsx";
import { describe, it, expect } from "vitest";
import { parseLeadsCsv } from "../app/_lib/outreach/csv";
import { parseLeadsXlsx } from "../app/_lib/outreach/import-leads";

function makeXlsx(rows: unknown[][]): ArrayBuffer {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Leads");
  return XLSX.write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

describe("parseLeadsCsv", () => {
  it("parses rows with a header line", () => {
    const csv = "company,contact_name,email,part_number,note\nAcme,Sam,sam@acme.com,ABC-1,hot\nBeta,,ops@beta.io,,";
    const { rows, errors } = parseLeadsCsv(csv);
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      { company: "Acme", contact_name: "Sam", email: "sam@acme.com", part_number: "ABC-1", note: "hot" },
      { company: "Beta", contact_name: null, email: "ops@beta.io", part_number: null, note: null },
    ]);
  });

  it("reports rows missing company or a valid email and skips them", () => {
    const csv = "company,contact_name,email\n,Sam,sam@acme.com\nAcme,Sue,not-an-email\nGood,Lee,lee@good.com";
    const { rows, errors } = parseLeadsCsv(csv);
    expect(rows).toEqual([{ company: "Good", contact_name: "Lee", email: "lee@good.com", part_number: null, note: null }]);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain("2");
    expect(errors[1]).toContain("3");
  });

  it("lowercases and trims the email", () => {
    const { rows } = parseLeadsCsv("company,email\nAcme,  Sam@Acme.COM ");
    expect(rows[0].email).toBe("sam@acme.com");
  });
});

describe("parseLeadsXlsx", () => {
  it("parses the first sheet with company and email columns", () => {
    const buffer = makeXlsx([
      ["company", "email"],
      ["testcompy", "test@test.com"],
    ]);
    const { rows, errors } = parseLeadsXlsx(buffer);
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      {
        company: "testcompy",
        contact_name: null,
        email: "test@test.com",
        part_number: null,
        note: null,
      },
    ]);
  });
});
