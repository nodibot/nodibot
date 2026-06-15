import { describe, it, expect } from "vitest";
import { threadHasReply } from "../app/_lib/gmail";

describe("threadHasReply", () => {
  const me = "hello@hello-nodibot.com";
  it("detects an inbound message after our last send", () => {
    const msgs = [
      { fromHeader: `Me <${me}>`, internalDate: 1000 },
      { fromHeader: "Client <c@acme.com>", internalDate: 2000 },
    ];
    expect(threadHasReply(msgs, me, 1500)).toBe(true);
  });
  it("ignores our own later messages", () => {
    const msgs = [{ fromHeader: `Me <${me}>`, internalDate: 3000 }];
    expect(threadHasReply(msgs, me, 1500)).toBe(false);
  });
  it("ignores inbound messages before our last send", () => {
    const msgs = [{ fromHeader: "Client <c@acme.com>", internalDate: 1000 }];
    expect(threadHasReply(msgs, me, 1500)).toBe(false);
  });
});
