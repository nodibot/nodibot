import { afterEach, describe, expect, it } from "vitest";
import { buildContactEmailHref, getContactEmailRecipients } from "../app/_lib/contact-email";

const originalRecipients = process.env.NEXT_PUBLIC_CONTACT_EMAILS;

afterEach(() => {
  if (originalRecipients === undefined) delete process.env.NEXT_PUBLIC_CONTACT_EMAILS;
  else process.env.NEXT_PUBLIC_CONTACT_EMAILS = originalRecipients;
});

describe("getContactEmailRecipients", () => {
  it("uses default recipient when env is missing", () => {
    delete process.env.NEXT_PUBLIC_CONTACT_EMAILS;
    expect(getContactEmailRecipients()).toEqual(["robert@hello-nodibot.com"]);
  });

  it("parses comma-separated recipients", () => {
    process.env.NEXT_PUBLIC_CONTACT_EMAILS = "a@nodibot.com, b@nodibot.com";
    expect(getContactEmailRecipients()).toEqual(["a@nodibot.com", "b@nodibot.com"]);
  });
});

describe("buildContactEmailHref", () => {
  it("builds a mailto link with recipients, subject, and body", () => {
    process.env.NEXT_PUBLIC_CONTACT_EMAILS = "sales@nodibot.com,ops@nodibot.com";
    const href = buildContactEmailHref({ partPn: "A06B-6240-H104" });
    expect(href).toContain("mailto:sales@nodibot.com,ops@nodibot.com?");
    expect(href).toContain("subject=RFQ+request+for+A06B-6240-H104");
    expect(href).toContain("I+need+a+quote+for+part+A06B-6240-H104");
  });
});
