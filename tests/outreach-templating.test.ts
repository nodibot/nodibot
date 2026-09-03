import { describe, it, expect } from "vitest";
import { renderTemplate } from "../app/_lib/outreach/templating";

describe("renderTemplate", () => {
  it("substitutes company, first name via contact_name, and part_number", () => {
    const r = renderTemplate(
      { subject: "Parts for {{company}}", body: "Hi {{contact_name}}, re {{part_number}}." },
      { company: "Acme", first_name: "Sam", last_name: "Lee", part_number: "ABC-1" },
    );
    expect(r.subject).toBe("Parts for Acme");
    expect(r.body).toBe("Hi Sam, re ABC-1.");
  });

  it("treats {{first_name}} the same as {{contact_name}}", () => {
    const r = renderTemplate(
      { subject: "s", body: "Hi {{first_name}} {{last_name}}." },
      { company: "Acme", first_name: "Sam", last_name: "Lee", part_number: null },
    );
    expect(r.body).toBe("Hi Sam Lee.");
  });

  it("tolerates whitespace inside braces", () => {
    const r = renderTemplate(
      { subject: "{{ company }}", body: "x" },
      { company: "Acme", first_name: null, last_name: null, part_number: null },
    );
    expect(r.subject).toBe("Acme");
  });

  it("falls back to 'there' for a missing first name", () => {
    const r = renderTemplate(
      { subject: "s", body: "Hi {{contact_name}}." },
      { company: "Acme", first_name: null, last_name: "Lee", part_number: null },
    );
    expect(r.body).toBe("Hi there.");
  });

  it("renders missing company/part_number as empty string", () => {
    const r = renderTemplate(
      { subject: "{{company}}", body: "[{{part_number}}]" },
      { company: "", first_name: null, last_name: null, part_number: null },
    );
    expect(r.subject).toBe("");
    expect(r.body).toBe("[]");
  });

  it("does not append a footer", () => {
    const r = renderTemplate(
      { subject: "s", body: "Body." },
      { company: "A", first_name: null, last_name: null, part_number: null },
    );
    expect(r.body).toBe("Body.");
  });
});
