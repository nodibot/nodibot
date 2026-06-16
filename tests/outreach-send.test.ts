import { describe, expect, it } from "vitest";
import { sendStepForStatus } from "../app/_lib/outreach/send";

describe("sendStepForStatus", () => {
  it("maps pending to initial", () => {
    expect(sendStepForStatus("pending")).toBe("initial");
  });

  it("maps contacted to reminder", () => {
    expect(sendStepForStatus("contacted")).toBe("reminder");
  });

  it("returns null for non-sendable statuses", () => {
    expect(sendStepForStatus("replied")).toBeNull();
    expect(sendStepForStatus("reminded")).toBeNull();
    expect(sendStepForStatus("completed")).toBeNull();
  });
});
