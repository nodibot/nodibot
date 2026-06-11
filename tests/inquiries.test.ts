import { describe, it, expect } from "vitest";
import { validateInquiry, generateTicket } from "../app/_lib/inquiries";

describe("validateInquiry", () => {
  it("requires name and contact", () => {
    expect(validateInquiry({}).ok).toBe(false);
    expect(validateInquiry({ name: "Jane" }).errors).toContain("contact");
    expect(validateInquiry({ contact: "jane@x.com" }).errors).toContain("name");
  });
  it("passes with name + contact", () => {
    expect(validateInquiry({ name: "Jane", contact: "jane@x.com" }).ok).toBe(true);
  });
  it("rejects an invalid channel", () => {
    const r = validateInquiry({ name: "J", contact: "c", channel: "Carrier Pigeon" as never });
    expect(r.ok).toBe(false);
    expect(r.errors).toContain("channel");
  });
  it("rejects an invalid urgency", () => {
    const r = validateInquiry({ name: "J", contact: "c", urgency: "whenever" as never });
    expect(r.errors).toContain("urgency");
  });
});

describe("generateTicket", () => {
  it("matches the RFQ-XXXX-NNNN format", () => {
    expect(generateTicket()).toMatch(/^RFQ-[A-Z0-9]{4}-\d{4}$/);
  });
});
