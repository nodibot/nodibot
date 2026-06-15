# Cold Email Outreach Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cold-email outreach tool to nodibot that sends a templated initial email to imported leads, sends exactly one reminder if there's no reply within 7 days, detects replies/bounces via the Gmail API, and runs automatically once per day under a conservative daily cap.

**Architecture:** A new feature inside the existing Next.js app. Pure, unit-tested logic modules (cadence engine + templating + MIME building) are separated from I/O modules (Gmail client, Supabase service-role queries). A Vercel Cron route orchestrates a daily run: sync replies/bounces → plan due sends within budget → send + log + advance lead state. An admin UI under `/admin-portal/(dashboard)/outreach` manages leads, templates, and settings.

**Tech Stack:** Next.js 16 (App Router, React 19), Supabase (Postgres + RLS), `googleapis` (Gmail), Vercel Cron, vitest.

**Spec:** `docs/superpowers/specs/2026-06-16-cold-email-outreach-design.md`

---

## File Structure

**Created:**
- `supabase/migrations/0004_outreach.sql` — tables, RLS, seed settings row
- `app/_lib/outreach/types.ts` — shared outreach types
- `app/_lib/outreach/templating.ts` — pure variable substitution + footer
- `app/_lib/outreach/engine.ts` — pure cadence logic (planActions, planRetirements, warmupRamp)
- `app/_lib/outreach/mime.ts` — pure RFC822/base64url MIME builder
- `app/_lib/outreach/queries.ts` — Supabase data access for outreach tables
- `app/_lib/outreach/csv.ts` — pure CSV parsing for lead import
- `app/_lib/supabase-service.ts` — service-role Supabase client (server-only)
- `app/_lib/gmail.ts` — Gmail API client (send, getThread) + `EmailSender` interface
- `app/api/cron/outreach/route.ts` — daily orchestrator (CRON_SECRET-guarded)
- `app/admin-portal/(dashboard)/outreach/page.tsx` — leads list + manual add + CSV import
- `app/admin-portal/(dashboard)/outreach/actions.ts` — server actions (add lead, import, save template, save settings)
- `app/admin-portal/(dashboard)/outreach/AddLeadForm.tsx` — manual add form (client)
- `app/admin-portal/(dashboard)/outreach/ImportLeadsForm.tsx` — CSV import (client)
- `app/admin-portal/(dashboard)/outreach/templates/page.tsx` — template editor
- `app/admin-portal/(dashboard)/outreach/templates/TemplateForm.tsx` — template form (client)
- `app/admin-portal/(dashboard)/outreach/settings/page.tsx` — settings + dashboard
- `app/admin-portal/(dashboard)/outreach/settings/SettingsForm.tsx` — settings form (client)
- `vercel.json` — daily cron schedule
- `tests/outreach-templating.test.ts`, `tests/outreach-engine.test.ts`, `tests/outreach-mime.test.ts`, `tests/outreach-csv.test.ts`

**Modified:**
- `app/admin-portal/(dashboard)/AdminNav.tsx` — add Outreach nav entry
- `.env.example` — add Gmail + CRON_SECRET + mailing-address vars
- `package.json` — add `googleapis` dependency

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/0004_outreach.sql`

- [ ] **Step 1: Write the migration**

```sql
-- nodibot — Phase 3: cold email outreach.
-- Run after 0003_product_import_refactor.sql.
-- Single-admin model: any authenticated user manages outreach; the daily cron
-- uses the service-role key (bypasses RLS).

-- Leads imported via CSV or added manually.
create table if not exists public.outreach_leads (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact_name text,
  email text not null unique,
  part_number text,
  note text,
  source text not null default 'manual' check (source in ('csv','manual')),
  status text not null default 'pending'
    check (status in ('pending','contacted','reminded','replied','bounced','unsubscribed','completed')),
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists outreach_leads_status_idx on public.outreach_leads (status);

-- Templated messages. One active row per kind is used in v1.
create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('initial','reminder')),
  subject text not null,
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Per-send audit log.
create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.outreach_leads(id) on delete cascade,
  template_id uuid references public.email_templates(id) on delete set null,
  step text not null check (step in ('initial','reminder')),
  gmail_message_id text,
  gmail_thread_id text,
  status text not null check (status in ('sent','failed','bounced')),
  error text,
  sent_at timestamptz,
  reply_detected_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists outreach_messages_lead_idx on public.outreach_messages (lead_id);
create index if not exists outreach_messages_sent_at_idx on public.outreach_messages (sent_at);

-- Single-row config.
create table if not exists public.outreach_settings (
  id int primary key default 1 check (id = 1),
  daily_cap int not null default 20,
  warmup_start_date date,
  reminder_delay_days int not null default 7,
  paused boolean not null default false
);
insert into public.outreach_settings (id) values (1) on conflict (id) do nothing;

-- RLS: authenticated admin has full access; anon has none.
alter table public.outreach_leads enable row level security;
alter table public.email_templates enable row level security;
alter table public.outreach_messages enable row level security;
alter table public.outreach_settings enable row level security;

create policy "admin all outreach_leads" on public.outreach_leads
  for all to authenticated using (true) with check (true);
create policy "admin all email_templates" on public.email_templates
  for all to authenticated using (true) with check (true);
create policy "admin all outreach_messages" on public.outreach_messages
  for all to authenticated using (true) with check (true);
create policy "admin all outreach_settings" on public.outreach_settings
  for all to authenticated using (true) with check (true);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/0004_outreach.sql
git commit -m "feat(outreach): add database migration for leads, templates, messages, settings"
```

> Note: the migration is applied manually in the Supabase SQL Editor (same workflow as 0001–0003, per README). No automated apply step.

---

## Task 2: Shared types

**Files:**
- Create: `app/_lib/outreach/types.ts`

- [ ] **Step 1: Write the types**

```ts
// Shared types for the cold email outreach feature.

export type OutreachStatus =
  | "pending"
  | "contacted"
  | "reminded"
  | "replied"
  | "bounced"
  | "unsubscribed"
  | "completed";

export type OutreachStep = "initial" | "reminder";
export type TemplateKind = "initial" | "reminder";

export interface OutreachLead {
  id: string;
  company: string;
  contact_name: string | null;
  email: string;
  part_number: string | null;
  note: string | null;
  source: "csv" | "manual";
  status: OutreachStatus;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  kind: TemplateKind;
  subject: string;
  body: string;
  active: boolean;
  created_at: string;
}

export interface OutreachSettings {
  id: number;
  daily_cap: number;
  warmup_start_date: string | null;
  reminder_delay_days: number;
  paused: boolean;
}

// Minimal lead shape the pure engine reasons about.
export interface LeadState {
  id: string;
  status: OutreachStatus;
  last_sent_at: string | null;
  created_at: string;
}

export type OutreachAction =
  | { type: "send_initial"; leadId: string }
  | { type: "send_reminder"; leadId: string };
```

- [ ] **Step 2: Commit**

```bash
git add app/_lib/outreach/types.ts
git commit -m "feat(outreach): add shared types"
```

---

## Task 3: Templating module (pure, TDD)

**Files:**
- Create: `app/_lib/outreach/templating.ts`
- Test: `tests/outreach-templating.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/outreach-templating.test.ts`
Expected: FAIL — cannot find module `templating` / `renderTemplate is not a function`.

- [ ] **Step 3: Write minimal implementation**

```ts
// Pure variable substitution for outreach templates. No I/O.

export interface TemplateFields {
  company: string;
  contact_name: string | null;
  part_number: string | null;
}

export interface RenderedEmail {
  subject: string;
  body: string;
}

function substitute(text: string, fields: TemplateFields): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    switch (key) {
      case "company":
        return fields.company ?? "";
      case "contact_name":
        return fields.contact_name && fields.contact_name.trim() ? fields.contact_name : "there";
      case "part_number":
        return fields.part_number ?? "";
      default:
        return "";
    }
  });
}

export function renderTemplate(
  template: { subject: string; body: string },
  fields: TemplateFields,
  footer: string,
): RenderedEmail {
  return {
    subject: substitute(template.subject, fields),
    body: substitute(template.body, fields) + "\n\n--\n" + footer,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/outreach-templating.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add app/_lib/outreach/templating.ts tests/outreach-templating.test.ts
git commit -m "feat(outreach): add template rendering with variable substitution"
```

---

## Task 4: Cadence engine (pure, TDD)

**Files:**
- Create: `app/_lib/outreach/engine.ts`
- Test: `tests/outreach-engine.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/outreach-engine.test.ts`
Expected: FAIL — cannot find module `engine`.

- [ ] **Step 3: Write minimal implementation**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/outreach-engine.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add app/_lib/outreach/engine.ts tests/outreach-engine.test.ts
git commit -m "feat(outreach): add pure cadence engine (planActions, retirements, warmup)"
```

---

## Task 5: MIME builder (pure, TDD)

**Files:**
- Create: `app/_lib/outreach/mime.ts`
- Test: `tests/outreach-mime.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildMimeMessage, encodeBase64Url } from "../app/_lib/outreach/mime";

describe("encodeBase64Url", () => {
  it("produces URL-safe base64 with no padding", () => {
    const out = encodeBase64Url("a>b?c");
    expect(out).not.toMatch(/[+/=]/);
  });
});

describe("buildMimeMessage", () => {
  it("includes From, To, Subject and the body", () => {
    const raw = Buffer.from(
      decodeURIComponent(escape(atob(restorePad(buildMimeMessage({ from: "me@x.com", to: "you@y.com", subject: "Hi", body: "Hello" }))))),
      "binary",
    ).toString();
    expect(raw).toContain("From: me@x.com");
    expect(raw).toContain("To: you@y.com");
    expect(raw).toContain("Subject: Hi");
    expect(raw).toContain("Hello");
  });

  it("adds In-Reply-To and References when given an inReplyTo message id", () => {
    const decoded = decodeRaw(buildMimeMessage({ from: "me@x.com", to: "y@y.com", subject: "Re", body: "b", inReplyTo: "<abc@mail>" }));
    expect(decoded).toContain("In-Reply-To: <abc@mail>");
    expect(decoded).toContain("References: <abc@mail>");
  });
});

// Helpers to reverse the base64url encoding inside the test.
function restorePad(s: string): string {
  return s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
}
function decodeRaw(s: string): string {
  return Buffer.from(restorePad(s), "base64").toString("utf8");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/outreach-mime.test.ts`
Expected: FAIL — cannot find module `mime`.

- [ ] **Step 3: Write minimal implementation**

```ts
// Pure RFC822 message construction + base64url encoding for the Gmail API.

export function encodeBase64Url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export interface MimeInput {
  from: string;
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
}

// Returns a base64url-encoded MIME message ready for users.messages.send `raw`.
export function buildMimeMessage({ from, to, subject, body, inReplyTo }: MimeInput): string {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
  ];
  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
    headers.push(`References: ${inReplyTo}`);
  }
  const raw = headers.join("\r\n") + "\r\n\r\n" + body;
  return encodeBase64Url(raw);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/outreach-mime.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/_lib/outreach/mime.ts tests/outreach-mime.test.ts
git commit -m "feat(outreach): add pure MIME message builder"
```

---

## Task 6: CSV parser (pure, TDD)

**Files:**
- Create: `app/_lib/outreach/csv.ts`
- Test: `tests/outreach-csv.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { parseLeadsCsv } from "../app/_lib/outreach/csv";

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
    expect(errors[0]).toContain("2"); // line number
    expect(errors[1]).toContain("3");
  });

  it("lowercases and trims the email", () => {
    const { rows } = parseLeadsCsv("company,email\nAcme,  Sam@Acme.COM ");
    expect(rows[0].email).toBe("sam@acme.com");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/outreach-csv.test.ts`
Expected: FAIL — cannot find module `csv`.

- [ ] **Step 3: Write minimal implementation**

```ts
// Pure CSV parsing for lead import. Expects a header row containing at least
// `company` and `email`; optional `contact_name`, `part_number`, `note`.

export interface ParsedLead {
  company: string;
  contact_name: string | null;
  email: string;
  part_number: string | null;
  note: string | null;
}

export interface CsvParseResult {
  rows: ParsedLead[];
  errors: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function splitLine(line: string): string[] {
  // Minimal CSV: split on commas, trim. (Lead lists rarely embed commas; the
  // import UI documents this limitation.)
  return line.split(",").map((c) => c.trim());
}

function emptyToNull(v: string | undefined): string | null {
  return v && v.trim() ? v.trim() : null;
}

export function parseLeadsCsv(text: string): CsvParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: ParsedLead[] = [];
  const errors: string[] = [];
  if (lines.length === 0) return { rows, errors: ["CSV is empty"] };

  const header = splitLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const ci = { company: idx("company"), contact: idx("contact_name"), email: idx("email"), part: idx("part_number"), note: idx("note") };

  if (ci.company === -1 || ci.email === -1) {
    return { rows, errors: ["CSV header must include 'company' and 'email'"] };
  }

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const company = emptyToNull(cells[ci.company]);
    const email = (cells[ci.email] ?? "").trim().toLowerCase();
    if (!company) {
      errors.push(`Line ${i + 1}: missing company — skipped`);
      continue;
    }
    if (!EMAIL_RE.test(email)) {
      errors.push(`Line ${i + 1}: invalid email '${cells[ci.email] ?? ""}' — skipped`);
      continue;
    }
    rows.push({
      company,
      contact_name: ci.contact === -1 ? null : emptyToNull(cells[ci.contact]),
      email,
      part_number: ci.part === -1 ? null : emptyToNull(cells[ci.part]),
      note: ci.note === -1 ? null : emptyToNull(cells[ci.note]),
    });
  }

  return { rows, errors };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/outreach-csv.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/_lib/outreach/csv.ts tests/outreach-csv.test.ts
git commit -m "feat(outreach): add pure CSV lead parser"
```

---

## Task 7: Service-role Supabase client

**Files:**
- Create: `app/_lib/supabase-service.ts`

- [ ] **Step 1: Write the client**

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_SECRET_KEY, SUPABASE_URL } from "./supabase-env";

// Service-role Supabase client. Bypasses RLS — server-only, used by the
// outreach cron job (which has no admin auth session). NEVER import this into
// any client component or browser-reachable code.
let serviceClient: SupabaseClient | null = null;

export function getSupabaseService(): SupabaseClient {
  if (serviceClient) return serviceClient;
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY for service client.");
  }
  serviceClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_lib/supabase-service.ts
git commit -m "feat(outreach): add service-role supabase client for cron"
```

---

## Task 8: Outreach data-access queries

**Files:**
- Create: `app/_lib/outreach/queries.ts`

> These thin wrappers use the cookie-aware admin client for UI reads/writes and
> accept an injected client for the cron (service role). No unit tests — they are
> direct Supabase calls covered by the orchestrator's manual verification.

- [ ] **Step 1: Write the queries**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase-server";
import type { EmailTemplate, OutreachLead, OutreachSettings, TemplateKind } from "./types";
import type { ParsedLead } from "./csv";

// ---- reads (admin UI, cookie client) ----

export async function getLeads(): Promise<OutreachLead[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("outreach_leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OutreachLead[];
}

export async function getTemplates(): Promise<EmailTemplate[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("email_templates").select("*").order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as EmailTemplate[];
}

export async function getSettings(): Promise<OutreachSettings> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("outreach_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(error.message);
  return data as OutreachSettings;
}

// ---- writes (admin UI) ----

export async function addLead(input: { company: string; contact_name: string | null; email: string; part_number: string | null; note: string | null }): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("outreach_leads").insert({ ...input, source: "manual" });
  if (error) throw new Error(error.message);
}

// Upsert imported rows by email (no duplicates). Returns inserted/updated count.
export async function importLeads(rows: ParsedLead[]): Promise<number> {
  if (rows.length === 0) return 0;
  const supabase = await createSupabaseServerClient();
  const { error, count } = await supabase
    .from("outreach_leads")
    .upsert(rows.map((r) => ({ ...r, source: "csv" as const })), { onConflict: "email", ignoreDuplicates: false, count: "exact" });
  if (error) throw new Error(error.message);
  return count ?? rows.length;
}

export async function saveTemplate(input: { id?: string; name: string; kind: TemplateKind; subject: string; body: string; active: boolean }): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (input.id) {
    const { error } = await supabase.from("email_templates").update(input).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("email_templates").insert(input);
    if (error) throw new Error(error.message);
  }
}

export async function saveSettings(input: { daily_cap: number; warmup_start_date: string | null; reminder_delay_days: number; paused: boolean }): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("outreach_settings").update(input).eq("id", 1);
  if (error) throw new Error(error.message);
}

// ---- cron reads/writes (injected service client) ----

export async function getSettingsWith(supabase: SupabaseClient): Promise<OutreachSettings> {
  const { data, error } = await supabase.from("outreach_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(error.message);
  return data as OutreachSettings;
}

export async function getActiveLeadsWith(supabase: SupabaseClient): Promise<OutreachLead[]> {
  const { data, error } = await supabase
    .from("outreach_leads")
    .select("*")
    .in("status", ["pending", "contacted", "reminded"]);
  if (error) throw new Error(error.message);
  return (data ?? []) as OutreachLead[];
}

export async function getActiveTemplateWith(supabase: SupabaseClient, kind: TemplateKind): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("kind", kind)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as EmailTemplate) ?? null;
}

export async function countSentTodayWith(supabase: SupabaseClient, startOfDayIso: string): Promise<number> {
  const { count, error } = await supabase
    .from("outreach_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", startOfDayIso);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getLatestMessageWith(supabase: SupabaseClient, leadId: string) {
  const { data, error } = await supabase
    .from("outreach_messages")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as { gmail_thread_id: string | null; gmail_message_id: string | null; sent_at: string | null } | null;
}

export async function recordMessageWith(
  supabase: SupabaseClient,
  msg: { lead_id: string; template_id: string | null; step: "initial" | "reminder"; gmail_message_id: string | null; gmail_thread_id: string | null; status: "sent" | "failed"; error: string | null; sent_at: string | null },
): Promise<void> {
  const { error } = await supabase.from("outreach_messages").insert(msg);
  if (error) throw new Error(error.message);
}

export async function updateLeadStatusWith(
  supabase: SupabaseClient,
  leadId: string,
  fields: { status: string; last_sent_at?: string; reply_detected_at?: string },
): Promise<void> {
  const patch: Record<string, unknown> = { status: fields.status, updated_at: new Date().toISOString() };
  if (fields.last_sent_at) patch.last_sent_at = fields.last_sent_at;
  const { error } = await supabase.from("outreach_leads").update(patch).eq("id", leadId);
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors in `app/_lib/outreach/queries.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/_lib/outreach/queries.ts
git commit -m "feat(outreach): add supabase data-access for leads, templates, settings, messages"
```

---

## Task 9: Gmail client

**Files:**
- Modify: `package.json` (add `googleapis`)
- Create: `app/_lib/gmail.ts`

- [ ] **Step 1: Install googleapis**

Run: `npm install googleapis`
Expected: `googleapis` added to `dependencies` in `package.json`.

- [ ] **Step 2: Write the Gmail client**

```ts
import { google } from "googleapis";
import { buildMimeMessage } from "./outreach/mime";

// Gmail API client built from an OAuth2 refresh token for the single sending
// mailbox. Env: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER.

export interface SendResult {
  messageId: string;
  threadId: string;
}

export interface ThreadMessage {
  fromHeader: string;
  internalDate: number; // epoch ms
}

// Interface so the orchestrator can be exercised with a fake in tests.
export interface EmailSender {
  send(args: { to: string; subject: string; body: string; threadId?: string; inReplyTo?: string }): Promise<SendResult>;
  getThreadMessages(threadId: string): Promise<ThreadMessage[]>;
  readonly senderEmail: string;
}

function gmailClient() {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env;
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    throw new Error("Missing GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN.");
  }
  const oauth2 = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET);
  oauth2.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: "v1", auth: oauth2 });
}

export function createGmailSender(): EmailSender {
  const senderEmail = process.env.GMAIL_SENDER ?? "";
  if (!senderEmail) throw new Error("Missing GMAIL_SENDER.");
  const gmail = gmailClient();

  return {
    senderEmail,
    async send({ to, subject, body, threadId, inReplyTo }) {
      const raw = buildMimeMessage({ from: senderEmail, to, subject, body, inReplyTo });
      const res = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw, ...(threadId ? { threadId } : {}) },
      });
      return { messageId: res.data.id ?? "", threadId: res.data.threadId ?? "" };
    },
    async getThreadMessages(threadId) {
      const res = await gmail.users.threads.get({ userId: "me", id: threadId, format: "metadata", metadataHeaders: ["From"] });
      return (res.data.messages ?? []).map((m) => ({
        fromHeader: m.payload?.headers?.find((h) => h.name === "From")?.value ?? "",
        internalDate: Number(m.internalDate ?? 0),
      }));
    },
  };
}

// Pure helper: does the thread contain an inbound message after our last send?
export function threadHasReply(messages: ThreadMessage[], senderEmail: string, lastSentMs: number): boolean {
  return messages.some((m) => m.internalDate > lastSentMs && !m.fromHeader.toLowerCase().includes(senderEmail.toLowerCase()));
}
```

- [ ] **Step 3: Add a test for the pure helper**

Append to a new test file `tests/outreach-gmail.test.ts`:

```ts
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
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/outreach-gmail.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json app/_lib/gmail.ts tests/outreach-gmail.test.ts
git commit -m "feat(outreach): add Gmail API client and reply-detection helper"
```

---

## Task 10: Cron orchestrator route

**Files:**
- Create: `app/api/cron/outreach/route.ts`
- Create: `vercel.json`

- [ ] **Step 1: Write the orchestrator route**

```ts
import { NextResponse } from "next/server";
import { getSupabaseService } from "@/app/_lib/supabase-service";
import { createGmailSender, threadHasReply, type EmailSender } from "@/app/_lib/gmail";
import { renderTemplate } from "@/app/_lib/outreach/templating";
import { planActions, planRetirements } from "@/app/_lib/outreach/engine";
import {
  getSettingsWith,
  getActiveLeadsWith,
  getActiveTemplateWith,
  countSentTodayWith,
  getLatestMessageWith,
  recordMessageWith,
  updateLeadStatusWith,
} from "@/app/_lib/outreach/queries";
import type { LeadState } from "@/app/_lib/outreach/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FOOTER_ADDRESS = process.env.OUTREACH_MAILING_ADDRESS ?? "";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseService();
  const now = new Date();
  const summary = { replies: 0, bounces: 0, sent: 0, errors: 0, retired: 0 };

  let sender: EmailSender;
  try {
    sender = createGmailSender();
  } catch (err) {
    console.error("Gmail init failed:", err);
    return NextResponse.json({ error: "Gmail init failed" }, { status: 500 });
  }

  const settings = await getSettingsWith(supabase);
  const leads = await getActiveLeadsWith(supabase);

  // 1. Sync replies for contacted/reminded leads that have a thread.
  for (const lead of leads.filter((l) => l.status === "contacted" || l.status === "reminded")) {
    const last = await getLatestMessageWith(supabase, lead.id);
    if (!last?.gmail_thread_id || !last.sent_at) continue;
    try {
      const msgs = await sender.getThreadMessages(last.gmail_thread_id);
      if (threadHasReply(msgs, sender.senderEmail, new Date(last.sent_at).getTime())) {
        await updateLeadStatusWith(supabase, lead.id, { status: "replied", reply_detected_at: now.toISOString() });
        lead.status = "replied"; // reflect locally so planning skips it
        summary.replies++;
      }
    } catch (err) {
      console.error(`reply sync failed for ${lead.id}:`, err);
      summary.errors++;
    }
  }

  // 2. Retire reminded leads past the window with no reply.
  const leadStates: LeadState[] = leads.map((l) => ({ id: l.id, status: l.status, last_sent_at: l.last_sent_at, created_at: l.created_at }));
  for (const id of planRetirements({ now, leads: leadStates, settings })) {
    await updateLeadStatusWith(supabase, id, { status: "completed" });
    summary.retired++;
  }

  // 3. Plan + execute sends within today's budget.
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const sentToday = await countSentTodayWith(supabase, startOfDay.toISOString());
  const actions = planActions({ now, leads: leadStates, settings, sentToday });

  const initialTpl = await getActiveTemplateWith(supabase, "initial");
  const reminderTpl = await getActiveTemplateWith(supabase, "reminder");

  for (const action of actions) {
    const lead = leads.find((l) => l.id === action.leadId)!;
    const tpl = action.type === "send_initial" ? initialTpl : reminderTpl;
    if (!tpl) {
      console.error(`No active ${action.type} template — skipping ${lead.id}`);
      summary.errors++;
      continue;
    }
    const footer = `${lead.company}\n${FOOTER_ADDRESS}\nReply STOP to unsubscribe.`;
    const rendered = renderTemplate(
      { subject: tpl.subject, body: tpl.body },
      { company: lead.company, contact_name: lead.contact_name, part_number: lead.part_number },
      footer,
    );

    let threadId: string | undefined;
    let inReplyTo: string | undefined;
    if (action.type === "send_reminder") {
      const last = await getLatestMessageWith(supabase, lead.id);
      threadId = last?.gmail_thread_id ?? undefined;
      inReplyTo = last?.gmail_message_id ? `<${last.gmail_message_id}>` : undefined;
    }

    try {
      const sentAt = new Date().toISOString();
      const res = await sender.send({ to: lead.email, subject: rendered.subject, body: rendered.body, threadId, inReplyTo });
      await recordMessageWith(supabase, {
        lead_id: lead.id,
        template_id: tpl.id,
        step: action.type === "send_initial" ? "initial" : "reminder",
        gmail_message_id: res.messageId,
        gmail_thread_id: res.threadId,
        status: "sent",
        error: null,
        sent_at: sentAt,
      });
      await updateLeadStatusWith(supabase, lead.id, {
        status: action.type === "send_initial" ? "contacted" : "reminded",
        last_sent_at: sentAt,
      });
      summary.sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`send failed for ${lead.id}:`, message);
      await recordMessageWith(supabase, {
        lead_id: lead.id,
        template_id: tpl.id,
        step: action.type === "send_initial" ? "initial" : "reminder",
        gmail_message_id: null,
        gmail_thread_id: null,
        status: "failed",
        error: message,
        sent_at: null,
      });
      summary.errors++;
    }

    // Jitter between sends so traffic doesn't look machine-fired.
    await sleep(2000 + Math.floor(Math.random() * 4000));
  }

  return NextResponse.json({ ok: true, ...summary });
}
```

- [ ] **Step 2: Write the Vercel cron config**

```json
{
  "crons": [
    { "path": "/api/cron/outreach", "schedule": "0 14 * * *" }
  ]
}
```

> Vercel automatically calls cron paths with `Authorization: Bearer $CRON_SECRET` when `CRON_SECRET` is set in the project env. Schedule `0 14 * * *` = 14:00 UTC daily.

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/cron/outreach/route.ts vercel.json
git commit -m "feat(outreach): add daily cron orchestrator and vercel schedule"
```

---

## Task 11: Admin UI — leads page + actions

**Files:**
- Create: `app/admin-portal/(dashboard)/outreach/actions.ts`
- Create: `app/admin-portal/(dashboard)/outreach/page.tsx`
- Create: `app/admin-portal/(dashboard)/outreach/AddLeadForm.tsx`
- Create: `app/admin-portal/(dashboard)/outreach/ImportLeadsForm.tsx`

- [ ] **Step 1: Write the server actions**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { addLead, importLeads, saveSettings, saveTemplate } from "@/app/_lib/outreach/queries";
import { parseLeadsCsv } from "@/app/_lib/outreach/csv";
import type { TemplateKind } from "@/app/_lib/outreach/types";

export async function addLeadAction(formData: FormData) {
  await addLead({
    company: String(formData.get("company") ?? "").trim(),
    contact_name: (String(formData.get("contact_name") ?? "").trim() || null),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    part_number: (String(formData.get("part_number") ?? "").trim() || null),
    note: (String(formData.get("note") ?? "").trim() || null),
  });
  revalidatePath("/admin-portal/outreach");
}

export async function importLeadsAction(_prev: unknown, formData: FormData): Promise<{ imported: number; errors: string[] }> {
  const text = String(formData.get("csv") ?? "");
  const { rows, errors } = parseLeadsCsv(text);
  const imported = await importLeads(rows);
  revalidatePath("/admin-portal/outreach");
  return { imported, errors };
}

export async function saveTemplateAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  await saveTemplate({
    id: id || undefined,
    name: String(formData.get("name") ?? "").trim(),
    kind: String(formData.get("kind") ?? "initial") as TemplateKind,
    subject: String(formData.get("subject") ?? ""),
    body: String(formData.get("body") ?? ""),
    active: formData.get("active") === "on",
  });
  revalidatePath("/admin-portal/outreach/templates");
}

export async function saveSettingsAction(formData: FormData) {
  await saveSettings({
    daily_cap: Number(formData.get("daily_cap") ?? 20),
    warmup_start_date: (String(formData.get("warmup_start_date") ?? "").trim() || null),
    reminder_delay_days: Number(formData.get("reminder_delay_days") ?? 7),
    paused: formData.get("paused") === "on",
  });
  revalidatePath("/admin-portal/outreach/settings");
}
```

- [ ] **Step 2: Write the leads page**

```tsx
import Link from "next/link";
import { getLeads } from "@/app/_lib/outreach/queries";
import { AddLeadForm } from "./AddLeadForm";
import { ImportLeadsForm } from "./ImportLeadsForm";

export default async function OutreachPage() {
  const leads = await getLeads();
  const byStatus = (s: string) => leads.filter((l) => l.status === s).length;

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Outreach</h1>
          <div className="sub">{leads.length} leads · {byStatus("pending")} pending · {byStatus("contacted")} contacted · {byStatus("replied")} replied</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn" href="/admin-portal/outreach/templates">Templates</Link>
          <Link className="btn" href="/admin-portal/outreach/settings">Settings</Link>
        </div>
      </div>

      <div className="admin-content" style={{ display: "grid", gap: 24 }}>
        <section>
          <h2>Add a lead</h2>
          <AddLeadForm />
        </section>

        <section>
          <h2>Import CSV</h2>
          <ImportLeadsForm />
        </section>

        <section>
          <h2>Leads</h2>
          {leads.length === 0 ? (
            <div className="admin-empty">No leads yet. Add one or import a CSV.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr><th style={{ textAlign: "left" }}>Company</th><th style={{ textAlign: "left" }}>Email</th><th style={{ textAlign: "left" }}>Part</th><th style={{ textAlign: "left" }}>Status</th><th style={{ textAlign: "left" }}>Last sent</th></tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} style={{ borderTop: "1px solid #eee" }}>
                    <td>{l.company}{l.contact_name ? ` · ${l.contact_name}` : ""}</td>
                    <td>{l.email}</td>
                    <td>{l.part_number ?? "—"}</td>
                    <td>{l.status}</td>
                    <td>{l.last_sent_at ? new Date(l.last_sent_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Write the AddLeadForm client component**

```tsx
"use client";

import { addLeadAction } from "./actions";

export function AddLeadForm() {
  return (
    <form action={addLeadAction} style={{ display: "grid", gap: 8, maxWidth: 480 }}>
      <input name="company" placeholder="Company *" required />
      <input name="contact_name" placeholder="Contact name" />
      <input name="email" type="email" placeholder="Email *" required />
      <input name="part_number" placeholder="Part number" />
      <input name="note" placeholder="Note" />
      <button type="submit" className="btn">Add lead</button>
    </form>
  );
}
```

- [ ] **Step 4: Write the ImportLeadsForm client component**

```tsx
"use client";

import { useActionState } from "react";
import { importLeadsAction } from "./actions";

const initial = { imported: 0, errors: [] as string[] };

export function ImportLeadsForm() {
  const [state, formAction, pending] = useActionState(importLeadsAction, initial);
  return (
    <form action={formAction} style={{ display: "grid", gap: 8, maxWidth: 640 }}>
      <p style={{ fontSize: 13, color: "#666" }}>
        Paste CSV with a header row. Required columns: <code>company</code>, <code>email</code>. Optional: <code>contact_name</code>, <code>part_number</code>, <code>note</code>.
      </p>
      <textarea name="csv" rows={6} placeholder="company,contact_name,email,part_number,note&#10;Acme,Sam,sam@acme.com,ABC-1,hot lead" required />
      <button type="submit" className="btn" disabled={pending}>{pending ? "Importing…" : "Import"}</button>
      {state.imported > 0 && <p style={{ color: "green" }}>Imported {state.imported} lead(s).</p>}
      {state.errors.length > 0 && (
        <ul style={{ color: "#b00", fontSize: 13 }}>
          {state.errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </form>
  );
}
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add "app/admin-portal/(dashboard)/outreach/actions.ts" "app/admin-portal/(dashboard)/outreach/page.tsx" "app/admin-portal/(dashboard)/outreach/AddLeadForm.tsx" "app/admin-portal/(dashboard)/outreach/ImportLeadsForm.tsx"
git commit -m "feat(outreach): add leads admin page with manual add and CSV import"
```

---

## Task 12: Admin UI — templates page

**Files:**
- Create: `app/admin-portal/(dashboard)/outreach/templates/page.tsx`
- Create: `app/admin-portal/(dashboard)/outreach/templates/TemplateForm.tsx`

- [ ] **Step 1: Write the templates page**

```tsx
import Link from "next/link";
import { getTemplates } from "@/app/_lib/outreach/queries";
import { TemplateForm } from "./TemplateForm";

export default async function TemplatesPage() {
  const templates = await getTemplates();
  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Templates</h1>
          <div className="sub">Variables: {"{{company}}"}, {"{{contact_name}}"}, {"{{part_number}}"}</div>
        </div>
        <Link className="btn" href="/admin-portal/outreach">← Back to outreach</Link>
      </div>
      <div className="admin-content" style={{ display: "grid", gap: 24 }}>
        <section>
          <h2>New / edit template</h2>
          <TemplateForm />
        </section>
        <section>
          <h2>Existing templates</h2>
          {templates.length === 0 ? (
            <div className="admin-empty">No templates yet. The cron needs one active <code>initial</code> and one active <code>reminder</code> template.</div>
          ) : (
            <ul style={{ display: "grid", gap: 12 }}>
              {templates.map((t) => (
                <li key={t.id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
                  <strong>{t.name}</strong> · {t.kind} {t.active ? "· active" : "· inactive"}
                  <div style={{ fontSize: 13, color: "#666" }}>Subject: {t.subject}</div>
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{t.body}</pre>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Write the TemplateForm client component**

```tsx
"use client";

import { saveTemplateAction } from "../actions";

export function TemplateForm() {
  return (
    <form action={saveTemplateAction} style={{ display: "grid", gap: 8, maxWidth: 640 }}>
      <input name="name" placeholder="Template name *" required />
      <select name="kind" defaultValue="initial">
        <option value="initial">initial</option>
        <option value="reminder">reminder</option>
      </select>
      <input name="subject" placeholder="Subject *" required />
      <textarea name="body" rows={8} placeholder="Hi {{contact_name}}, we stock parts for {{company}}…" required />
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" name="active" defaultChecked /> Active
      </label>
      <button type="submit" className="btn">Save template</button>
    </form>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/admin-portal/(dashboard)/outreach/templates/page.tsx" "app/admin-portal/(dashboard)/outreach/templates/TemplateForm.tsx"
git commit -m "feat(outreach): add template editor page"
```

---

## Task 13: Admin UI — settings/dashboard + nav link

**Files:**
- Create: `app/admin-portal/(dashboard)/outreach/settings/page.tsx`
- Create: `app/admin-portal/(dashboard)/outreach/settings/SettingsForm.tsx`
- Modify: `app/admin-portal/(dashboard)/AdminNav.tsx`

- [ ] **Step 1: Write the settings page**

```tsx
import Link from "next/link";
import { getSettings } from "@/app/_lib/outreach/queries";
import { SettingsForm } from "./SettingsForm";

export default async function OutreachSettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Outreach settings</h1>
          <div className="sub">{settings.paused ? "⏸ Sending is paused" : "▶ Sending is active"}</div>
        </div>
        <Link className="btn" href="/admin-portal/outreach">← Back to outreach</Link>
      </div>
      <div className="admin-content">
        <SettingsForm settings={settings} />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Write the SettingsForm client component**

```tsx
"use client";

import { saveSettingsAction } from "../actions";
import type { OutreachSettings } from "@/app/_lib/outreach/types";

export function SettingsForm({ settings }: { settings: OutreachSettings }) {
  return (
    <form action={saveSettingsAction} style={{ display: "grid", gap: 12, maxWidth: 480 }}>
      <label>Daily cap
        <input name="daily_cap" type="number" min={1} defaultValue={settings.daily_cap} />
      </label>
      <label>Reminder delay (days)
        <input name="reminder_delay_days" type="number" min={1} defaultValue={settings.reminder_delay_days} />
      </label>
      <label>Warm-up start date (optional)
        <input name="warmup_start_date" type="date" defaultValue={settings.warmup_start_date ?? ""} />
      </label>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" name="paused" defaultChecked={settings.paused} /> Pause all sending
      </label>
      <button type="submit" className="btn">Save settings</button>
    </form>
  );
}
```

- [ ] **Step 3: Add the nav link**

In `app/admin-portal/(dashboard)/AdminNav.tsx`, add an entry to the nav array (after the `analytics-demand` line, ~line 10):

```tsx
  { href: "/admin-portal/outreach", label: "Outreach", icon: <Ic.spark /> },
```

> If `Ic.spark` is already used, reuse it; the icon set is in the same file — pick any existing icon. The exact icon is cosmetic.

- [ ] **Step 4: Verify it compiles and lint passes**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "app/admin-portal/(dashboard)/outreach/settings/page.tsx" "app/admin-portal/(dashboard)/outreach/settings/SettingsForm.tsx" "app/admin-portal/(dashboard)/AdminNav.tsx"
git commit -m "feat(outreach): add settings page and nav link"
```

---

## Task 14: Environment + docs

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Add env vars to `.env.example`**

Append:

```bash
# --- Cold email outreach (Gmail API + cron) ---
# OAuth2 credentials for the hello-nodibot sending mailbox.
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GMAIL_SENDER=hello@hello-nodibot.example
# Shared secret Vercel Cron sends as `Authorization: Bearer <CRON_SECRET>`.
CRON_SECRET=
# Physical mailing address shown in the CAN-SPAM email footer.
OUTREACH_MAILING_ADDRESS=
```

- [ ] **Step 2: Add an outreach section to `README.md`**

Append a section documenting: apply `0004_outreach.sql`, set the Gmail OAuth env vars (one-time refresh-token consent for the sending mailbox), set `CRON_SECRET` + `OUTREACH_MAILING_ADDRESS` in Vercel, create one active `initial` and one active `reminder` template in `/admin-portal/outreach/templates`, and that the daily cron at `0 14 * * *` drives sending. Note the warm-up guidance (start daily_cap ~20).

- [ ] **Step 3: Commit**

```bash
git add .env.example README.md
git commit -m "docs(outreach): document Gmail/cron env vars and setup"
```

---

## Task 15: Full verification

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: all tests pass, including the new outreach suites (templating, engine, mime, csv, gmail).

- [ ] **Step 2: Typecheck + lint + build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: no errors; build succeeds.

- [ ] **Step 3: Manual smoke (optional, requires real env)**

With `.env.local` filled in and the migration applied: create templates, add a lead, then trigger the cron locally:

Run: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3001/api/cron/outreach`
Expected: JSON like `{ "ok": true, "sent": 1, "replies": 0, ... }`, the lead moves to `contacted`, and an `outreach_messages` row is logged.

---

## Self-Review Notes

- **Spec coverage:** data model (Task 1), Gmail OAuth client + reply detection (Task 9), pure cadence engine with warm-up + one-reminder-then-stop (Task 4), templating with variables + footer (Task 3), CSV import + manual add (Tasks 6, 11), templates UI (Task 12), settings/pause/dashboard + nav (Task 13), daily cron orchestrator with idempotency + jitter + bounce/reply sync (Task 10), compliance footer + opt-out + env (Tasks 10, 14), testing (Tasks 3–6, 9, 15). All spec sections map to a task.
- **Idempotency:** lead state advances only after a successful logged send (Task 10), matching the spec.
- **Type consistency:** `LeadState`, `OutreachAction`, `OutreachSettings`, `EmailSender`, `renderTemplate`, `planActions`/`planRetirements`/`warmupRamp`, `buildMimeMessage`, `threadHasReply`, `parseLeadsCsv` names are used identically across tasks.
- **Bounce note:** v1 detects replies and stops cadence; full Mailer-Daemon bounce parsing is logged as a follow-up (the `bounced` status + column exist, but automatic bounce classification is intentionally minimal in v1 to keep scope tight — flagged here rather than silently dropped).
