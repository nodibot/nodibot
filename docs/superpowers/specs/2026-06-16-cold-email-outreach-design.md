# Cold Email Outreach Engine — Design

**Date:** 2026-06-16
**Project:** nodibot (Next.js 16 App Router · Supabase · Vercel)
**Status:** Approved design, pending implementation plan

## Goal

Add a cold-email outreach tool to nodibot so the operator can reach potential B2B
clients for secondary-market industrial automation parts and drive them to the RFQ
flow. The system sends an initial email to each lead, and — if the lead does not
reply within a configurable window (default 7 days) — sends exactly **one** reminder,
then stops. It runs automatically once per day, sending as many due emails as a
conservative, configurable daily cap allows.

## Sending infrastructure (decided)

- Sending mailbox: a single Google Workspace mailbox on the `hello-nodibot` domain.
- DNS: SPF and DKIM already configured by the operator. DMARC should be added if not
  already present (recommended for deliverability).
- Auth: **Gmail API via OAuth2 refresh token** (Option A). A one-time consent for the
  sending mailbox produces a refresh token stored as a server secret. The cron job uses
  it to both send mail and read the mailbox for replies/bounces. No Workspace
  domain-wide delegation required.

## Non-goals

- No multi-mailbox / multi-sender rotation (single mailbox only).
- No open/click tracking pixels (deliverability + privacy risk; out of scope).
- No AI-generated per-contact copy (templates with variables only).
- No A/B testing UI in v1 (schema supports multiple templates so it can be added later).
- No external scraper integration (leads come from CSV import or manual entry only).

## Data model (Supabase, new migration)

New migration file `supabase/migrations/0004_outreach.sql`, following the existing RLS
conventions (admin-authenticated full access; service role used by the cron job).

### `outreach_leads`
| column | type | notes |
| --- | --- | --- |
| `id` | uuid pk | |
| `company` | text | |
| `contact_name` | text null | |
| `email` | text unique not null | dedupe key |
| `part_number` | text null | optional context for templating |
| `note` | text null | |
| `source` | text | `csv` \| `manual` |
| `status` | text | state machine (below), default `pending` |
| `last_sent_at` | timestamptz null | drives reminder timing |
| `created_at` | timestamptz default now() | |
| `updated_at` | timestamptz default now() | |

**Status state machine:**
`pending → contacted → reminded → completed`
with terminal branches `replied`, `bounced`, `unsubscribed` reachable from
`contacted`/`reminded`.

- `pending` — imported, not yet emailed.
- `contacted` — initial email sent; awaiting reply or reminder window.
- `reminded` — reminder sent; awaiting reply or retirement.
- `replied` — inbound reply detected; cadence stops (terminal).
- `bounced` — hard bounce detected; cadence stops (terminal).
- `unsubscribed` — opt-out detected; suppressed (terminal).
- `completed` — reminder window elapsed with no reply; cadence finished (terminal).

### `email_templates`
| column | type | notes |
| --- | --- | --- |
| `id` | uuid pk | |
| `name` | text | |
| `kind` | text | `initial` \| `reminder` |
| `subject` | text | supports `{{variables}}` |
| `body` | text | supports `{{variables}}` |
| `active` | boolean default true | exactly one active per `kind` used in v1 |
| `created_at` | timestamptz default now() | |

Supported variables: `{{company}}`, `{{contact_name}}`, `{{part_number}}`. Unknown
variables render empty; missing `contact_name` falls back to a neutral greeting.

### `outreach_messages`
| column | type | notes |
| --- | --- | --- |
| `id` | uuid pk | |
| `lead_id` | uuid fk → outreach_leads | |
| `template_id` | uuid fk → email_templates null | |
| `step` | text | `initial` \| `reminder` |
| `gmail_message_id` | text null | |
| `gmail_thread_id` | text null | links reminder to initial thread |
| `status` | text | `sent` \| `failed` \| `bounced` |
| `error` | text null | failure detail |
| `sent_at` | timestamptz null | |
| `reply_detected_at` | timestamptz null | |
| `created_at` | timestamptz default now() | |

Audit log and history. The reminder is sent into the same `gmail_thread_id` as the
initial so it threads naturally in the recipient's inbox.

### `outreach_settings`
Single-row config table.
| column | type | default |
| --- | --- | --- |
| `id` | int pk (=1) | 1 |
| `daily_cap` | int | 20 |
| `warmup_start_date` | date null | |
| `reminder_delay_days` | int | 7 |
| `paused` | boolean | false |

## Components

Each unit has one clear purpose and a defined interface; the engine is pure logic and
fully unit-testable without network or DB.

### `app/_lib/gmail.ts` — Gmail client
- Builds an OAuth2 client from `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`,
  `GMAIL_REFRESH_TOKEN`, `GMAIL_SENDER` (env).
- `sendEmail({ to, subject, body, threadId? }) → { messageId, threadId }` — builds a
  MIME message, sends via `users.messages.send`. Includes the unsubscribe footer.
- `getThread(threadId) → { messages: [...] }` — used to detect inbound replies.
- `listBounceNotifications(since) → [...]` — scans for Mailer-Daemon messages.
- Token-refresh failure throws; the caller aborts the run and logs loudly.

### `app/_lib/outreach/engine.ts` — cadence logic (pure)
- `planActions({ now, leads, messages, settings, sentToday }) → Action[]`
  where `Action = { type: 'send_initial' | 'send_reminder', leadId }`.
- Computes `budget = min(daily_cap, warmupRamp(now)) − sentToday`, then selects
  `pending` leads (initial) and `contacted` leads older than `reminder_delay_days`
  with no reply (reminder), up to budget. Deterministic ordering (oldest first).
- `warmupRamp(now)` — given `warmup_start_date`, returns the allowed ceiling for the
  day (e.g. week 1: 20/day, ramping weekly). Returns `daily_cap` when no warm-up set.
- `nextStatus(...)` helpers for state transitions, including retiring `reminded` →
  `completed` once the window has elapsed with no reply.
- No I/O; takes data in, returns decisions out.

### `app/_lib/outreach/templating.ts`
- `render(template, lead) → { subject, body }` — substitutes `{{variables}}`, applies
  greeting fallback, appends unsubscribe footer + physical mailing address.

### `app/api/cron/outreach/route.ts` — orchestrator
Guarded by `CRON_SECRET` (Bearer header check, matching Vercel Cron convention).
Uses the Supabase service-role client. On each run:
1. **Sync replies/bounces:** for each `contacted`/`reminded` lead with a thread, call
   `getThread`; an inbound message after our last send → `replied`. Mailer-Daemon
   bounce → `bounced`. Opt-out phrase / unsubscribe → `unsubscribed`.
2. **Retire:** `reminded` leads past the window with no reply → `completed`.
3. **Load state, count `sentToday`, call `engine.planActions`.**
4. **Execute actions** with jitter between sends: render template, `sendEmail`, insert
   `outreach_messages` row, then advance lead `status`/`last_sent_at`. State advances
   only after a successful, logged send (idempotency — a retried run never double-sends).
5. Return a JSON summary (sent, replies, bounces, errors).

Vercel Cron schedule: once daily (e.g. `0 14 * * *`) via `vercel.json`. Conservative
daily cap keeps each invocation well within the serverless function timeout.

### Admin UI — `app/admin-portal/(dashboard)/outreach/`
Follows existing dashboard conventions (`page.tsx` + `actions.ts` server actions,
linked from `AdminNav.tsx`).
- **Leads:** table with status; CSV import (paste/upload → parse → upsert by email);
  manual add form.
- **Templates:** list + editor for initial/reminder templates with a variable legend
  and a live preview.
- **Dashboard:** counts of sent today, awaiting reply, replied, bounced; current
  settings (daily cap, paused toggle).

## Data flow summary

```
CSV / manual add ──▶ outreach_leads (pending)
                          │
        ┌─────────────────┴───── daily cron ─────────────────┐
        ▼                                                     ▼
 1. sync replies/bounces        2. plan + send (within daily budget)
    contacted/reminded             pending      ─send initial─▶ contacted
    ├─ inbound reply → replied     contacted+7d  ─send reminder▶ reminded
    ├─ bounce       → bounced      (no reply)
    └─ opt-out      → unsubscribed
                                  3. reminded past window, no reply → completed
```

## Deliverability & safety

- **Warm-up ramp:** default start ~20/day, increasing weekly. Blasting a fresh domain
  risks blacklisting. Cap is configurable in `outreach_settings`.
- **Jitter** between sends within a run so traffic doesn't look machine-generated.
- **Idempotency:** lead state advances only after a logged successful send.
- **Suppression / opt-out:** `unsubscribed` status; unsubscribe line in every email.
  Reply detection also stops cadence immediately.
- **`paused` flag** to halt all sending without code changes.

## Compliance (operator responsibilities, surfaced in UI)

Cold email is legally regulated. The system builds in the mechanics, but the operator
must supply:
- A real physical mailing address (rendered in the footer) — CAN-SPAM requirement.
- A working opt-out mechanism (unsubscribe handling) — built in.
- Accurate `From`/subject (no deception) — enforced by templates.
- For EU recipients, GDPR/PECR impose stricter lawful-basis requirements — the operator
  is responsible for confirming legal basis before importing EU leads.

## Error handling

- Gmail send failure → logged to `outreach_messages` as `failed` with `error`; lead
  state unchanged so it's retried next run.
- Token-refresh failure → abort run, log loudly (and return non-200 so Vercel surfaces it).
- Malformed CSV rows → skipped with a per-row error report in the import UI; valid rows
  still imported.
- Duplicate email on import → upsert (no duplicate leads).

## Testing

- **Unit (vitest, already in project):** `engine.planActions` (budget math, warm-up
  ramp, due-date selection, state transitions), `templating.render` (variable
  substitution, greeting fallback, footer).
- **Mocked:** `gmail.ts` behind an interface so the orchestrator can be tested without
  network.

## New environment variables

```
GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET
GMAIL_REFRESH_TOKEN
GMAIL_SENDER            # e.g. hello@hello-nodibot...
CRON_SECRET
OUTREACH_MAILING_ADDRESS   # physical address for the CAN-SPAM footer
```

## Defaults (confirmed)

- `reminder_delay_days = 7`
- `daily_cap` starts ~20 with weekly warm-up ramp
- Single sending mailbox
- One reminder, then stop
