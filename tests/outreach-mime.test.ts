import { describe, it, expect } from "vitest";
import { buildMimeMessage, encodeBase64Url } from "../app/_lib/outreach/mime";

// Reverse the base64url encoding so we can assert on the decoded MIME.
function restorePad(s: string): string {
  return s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
}
function decodeRaw(s: string): string {
  return Buffer.from(restorePad(s), "base64").toString("utf8");
}

describe("encodeBase64Url", () => {
  it("produces URL-safe base64 with no padding", () => {
    const out = encodeBase64Url("a>b?c~~~~");
    expect(out).not.toMatch(/[+/=]/);
  });
});

describe("buildMimeMessage", () => {
  it("includes From, To, Subject and the body", () => {
    const decoded = decodeRaw(buildMimeMessage({ from: "me@x.com", to: "you@y.com", subject: "Hi", body: "Hello" }));
    expect(decoded).toContain("From: me@x.com");
    expect(decoded).toContain("To: you@y.com");
    expect(decoded).toContain("Subject: Hi");
    expect(decoded).toContain("Hello");
  });

  it("adds In-Reply-To and References when given an inReplyTo message id", () => {
    const decoded = decodeRaw(buildMimeMessage({ from: "me@x.com", to: "y@y.com", subject: "Re", body: "b", inReplyTo: "<abc@mail>" }));
    expect(decoded).toContain("In-Reply-To: <abc@mail>");
    expect(decoded).toContain("References: <abc@mail>");
  });

  it("omits threading headers when no inReplyTo", () => {
    const decoded = decodeRaw(buildMimeMessage({ from: "a@x.com", to: "b@y.com", subject: "s", body: "b" }));
    expect(decoded).not.toContain("In-Reply-To");
  });
});
