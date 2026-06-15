import { describe, it, expect } from "vitest";
import { warmupRamp, planActions, planRetirements } from "../app/_lib/outreach/engine";
import type { LeadState, OutreachSettings } from "../app/_lib/outreach/types";

const DAY = 24 * 60 * 60 * 1000;
const baseSettings: OutreachSettings = {
  id: 1,
  daily_cap: 100,
  warmup_start_date: null,
  reminder_delay_days: 7,
  paused: false,
};

function lead(p: Partial<LeadState>): LeadState {
  return { id: "x", status: "pending", last_sent_at: null, created_at: "2026-01-01T00:00:00Z", ...p };
}

describe("warmupRamp", () => {
  it("returns daily_cap when no warmup start date", () => {
    expect(warmupRamp(new Date("2026-06-16"), baseSettings)).toBe(100);
  });
  it("ramps 20 per week from the start date, capped at daily_cap", () => {
    const s = { ...baseSettings, warmup_start_date: "2026-06-01" };
    expect(warmupRamp(new Date("2026-06-01"), s)).toBe(20); // week 0
    expect(warmupRamp(new Date("2026-06-08"), s)).toBe(40); // week 1
    expect(warmupRamp(new Date("2026-08-01"), s)).toBe(100); // capped
  });
});

describe("planActions", () => {
  it("returns nothing when paused", () => {
    const r = planActions({ now: new Date(), leads: [lead({})], settings: { ...baseSettings, paused: true }, sentToday: 0 });
    expect(r).toEqual([]);
  });

  it("sends initials to pending leads, oldest first, up to budget", () => {
    const leads = [
      lead({ id: "b", created_at: "2026-01-02T00:00:00Z" }),
      lead({ id: "a", created_at: "2026-01-01T00:00:00Z" }),
    ];
    const r = planActions({ now: new Date(), leads, settings: { ...baseSettings, daily_cap: 1 }, sentToday: 0 });
    expect(r).toEqual([{ type: "send_initial", leadId: "a" }]);
  });

  it("prioritises due reminders over new initials", () => {
    const now = new Date("2026-06-16T00:00:00Z");
    const leads = [
      lead({ id: "new", status: "pending" }),
      lead({ id: "due", status: "contacted", last_sent_at: new Date(now.getTime() - 8 * DAY).toISOString() }),
    ];
    const r = planActions({ now, leads, settings: { ...baseSettings, daily_cap: 1 }, sentToday: 0 });
    expect(r).toEqual([{ type: "send_reminder", leadId: "due" }]);
  });

  it("does not remind contacted leads still inside the delay window", () => {
    const now = new Date("2026-06-16T00:00:00Z");
    const leads = [lead({ id: "c", status: "contacted", last_sent_at: new Date(now.getTime() - 3 * DAY).toISOString() })];
    const r = planActions({ now, leads, settings: baseSettings, sentToday: 0 });
    expect(r).toEqual([]);
  });

  it("subtracts sentToday from the budget", () => {
    const leads = [lead({ id: "a" }), lead({ id: "b", created_at: "2026-01-02T00:00:00Z" })];
    const r = planActions({ now: new Date(), leads, settings: { ...baseSettings, daily_cap: 5 }, sentToday: 4 });
    expect(r.length).toBe(1);
  });

  it("ignores terminal-state leads", () => {
    const leads = [lead({ id: "a", status: "replied" }), lead({ id: "b", status: "completed" })];
    const r = planActions({ now: new Date(), leads, settings: baseSettings, sentToday: 0 });
    expect(r).toEqual([]);
  });
});

describe("planRetirements", () => {
  it("retires reminded leads past the window with no reply", () => {
    const now = new Date("2026-06-16T00:00:00Z");
    const leads = [
      lead({ id: "old", status: "reminded", last_sent_at: new Date(now.getTime() - 8 * DAY).toISOString() }),
      lead({ id: "fresh", status: "reminded", last_sent_at: new Date(now.getTime() - 2 * DAY).toISOString() }),
    ];
    expect(planRetirements({ now, leads, settings: baseSettings })).toEqual(["old"]);
  });
});
