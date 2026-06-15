// Pure cadence logic. No I/O — takes state in, returns decisions out.
import type { LeadState, OutreachAction, OutreachSettings } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const WARMUP_WEEKLY_STEP = 20;

// Allowed ceiling for the given day, ramping WARMUP_WEEKLY_STEP per week from
// warmup_start_date up to daily_cap. Returns daily_cap when no warm-up is set.
export function warmupRamp(now: Date, settings: OutreachSettings): number {
  if (!settings.warmup_start_date) return settings.daily_cap;
  const start = new Date(settings.warmup_start_date + "T00:00:00Z").getTime();
  const weeks = Math.max(0, Math.floor((now.getTime() - start) / (7 * DAY_MS)));
  const ramped = WARMUP_WEEKLY_STEP * (weeks + 1);
  return Math.min(settings.daily_cap, ramped);
}

function dueForReminder(lead: LeadState, now: Date, delayDays: number): boolean {
  if (lead.status !== "contacted" || !lead.last_sent_at) return false;
  return now.getTime() - new Date(lead.last_sent_at).getTime() >= delayDays * DAY_MS;
}

export interface PlanInput {
  now: Date;
  leads: LeadState[];
  settings: OutreachSettings;
  sentToday: number;
}

export function planActions({ now, leads, settings, sentToday }: PlanInput): OutreachAction[] {
  if (settings.paused) return [];
  const ceiling = warmupRamp(now, settings);
  let budget = Math.max(0, Math.min(settings.daily_cap, ceiling) - sentToday);
  if (budget <= 0) return [];

  const actions: OutreachAction[] = [];

  // Reminders first: oldest last_sent_at first, so nobody stalls mid-cadence.
  const dueReminders = leads
    .filter((l) => dueForReminder(l, now, settings.reminder_delay_days))
    .sort((a, b) => (a.last_sent_at! < b.last_sent_at! ? -1 : 1));
  for (const l of dueReminders) {
    if (budget <= 0) break;
    actions.push({ type: "send_reminder", leadId: l.id });
    budget--;
  }

  // Then new initials: oldest created_at first.
  const pending = leads
    .filter((l) => l.status === "pending")
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  for (const l of pending) {
    if (budget <= 0) break;
    actions.push({ type: "send_initial", leadId: l.id });
    budget--;
  }

  return actions;
}

export interface RetireInput {
  now: Date;
  leads: LeadState[];
  settings: OutreachSettings;
}

// Reminded leads whose reminder window has elapsed with no reply → complete.
export function planRetirements({ now, leads, settings }: RetireInput): string[] {
  return leads
    .filter(
      (l) =>
        l.status === "reminded" &&
        l.last_sent_at !== null &&
        now.getTime() - new Date(l.last_sent_at).getTime() >= settings.reminder_delay_days * DAY_MS,
    )
    .map((l) => l.id);
}
