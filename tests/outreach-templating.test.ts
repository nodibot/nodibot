import { describe, it, expect } from "vitest";
import { renderTemplate } from "../app/_lib/outreach/templating";

const FOOTER = "Nodibot · 1 Test St\nUnsubscribe: reply STOP";

describe("renderTemplate", () => {
  it("substitutes company, contact_name and part_number", () => {
    const r = renderTemplate(
      { subject: "Parts for {{company}}", body: "Hi {{contact_name}}, re {{part_number}}." },
      { company: "Acme", contact_name: "Sam", part_number: "ABC-1" },
      FOOTER,
    );
    expect(r.subject).toBe("Parts for Acme");
    expect(r.body.startsWith("Hi Sam, re ABC-1.")).toBe(true);
  });

  it("tolerates whitespace inside braces", () => {
    const r = renderTemplate(
      { subject: "{{ company }}", body: "x" },
      { company: "Acme", contact_name: null, part_number: null },
      FOOTER,
    );
    expect(r.subject).toBe("Acme");
  });

  it("falls back to 'there' for a missing contact_name", () => {
    const r = renderTemplate(
      { subject: "s", body: "Hi {{contact_name}}." },
      { company: "Acme", contact_name: null, part_number: null },
      FOOTER,
    );
    expect(r.body.startsWith("Hi there.")).toBe(true);
  });

  it("renders missing company/part_number as empty string", () => {
    const r = renderTemplate(
      { subject: "{{company}}", body: "[{{part_number}}]" },
      { company: "", contact_name: null, part_number: null },
      FOOTER,
    );
    expect(r.subject).toBe("");
    expect(r.body.startsWith("[]")).toBe(true);
  });

  it("appends the footer to the body", () => {
    const r = renderTemplate({ subject: "s", body: "Body." }, { company: "A", contact_name: null, part_number: null }, FOOTER);
    expect(r.body).toBe("Body.\n\n--\n" + FOOTER);
  });
});
