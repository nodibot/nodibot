# nodibot — B2B Industrial Automation RFQ Platform

A high-intent, SEO-first catalog for secondary-market industrial automation parts. Visitors search
by exact part number and submit a Request-for-Quote (RFQ); there is no cart or payment.

**Stack:** Next.js 16 (App Router, React 19) · Supabase (Postgres) · deployed on Vercel.

## Setup

### 1. Create a Supabase project

At [supabase.com](https://supabase.com), create a project. From **Project Settings → API**, copy:

- Project URL
- `anon` public key
- `service_role` secret key (server-only)

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

### 3. Apply the schema

In the Supabase **SQL Editor**, run the contents of
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). This creates the `parts`
and `inquiries` tables, the trigram search index, Row-Level Security policies, and the
`increment_part_view` function.

### 4. Apply the admin policies (Phase 2)

In the SQL Editor, also run [`supabase/migrations/0002_admin.sql`](supabase/migrations/0002_admin.sql).
This grants the authenticated admin full CRUD on parts and read/update on inquiries.

### 5. Create the admin user

In Supabase: **Authentication → Users → Add user**. Enter an email + password and enable
**Auto Confirm User** (so you can sign in immediately). This single user is your admin —
sign in at `/admin-portal/login`.

### 6. Seed the catalog

```bash
npm run seed
```

Loads the 28 sample parts into the `parts` table (uses the service-role key from `.env.local`).

### 7. Run it

```bash
npm run dev        # http://localhost:3000   ·   admin at /admin-portal/login
```

## Scripts

| Command         | What it does                                  |
|-----------------|-----------------------------------------------|
| `npm run dev`   | Start the dev server                          |
| `npm run build` | Production build                              |
| `npm run start` | Serve the production build                    |
| `npm test`      | Run unit tests (Vitest)                       |
| `npm run seed`  | Seed the `parts` table from the prototype data |
| `npm run lint`  | ESLint                                        |

## Deploy (Vercel)

Import the repo into Vercel and set the same env vars (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally
`NEXT_PUBLIC_WHATSAPP_URL`, `NEXT_PUBLIC_SITE_URL`) in the project settings. No other configuration
is required.

## Cold email outreach (Phase 3)

### 1. Apply the migration

In the Supabase **SQL Editor**, run
[`supabase/migrations/0004_outreach.sql`](supabase/migrations/0004_outreach.sql) — the same manual
workflow used for migrations 0001–0003.

### 2. Configure Gmail OAuth credentials

Add the following env vars to `.env.local` (development) and to the Vercel project environment
(production):

| Variable | Description |
|---|---|
| `GMAIL_CLIENT_ID` | OAuth2 client ID from Google Cloud Console |
| `GMAIL_CLIENT_SECRET` | OAuth2 client secret |
| `GMAIL_REFRESH_TOKEN` | Refresh token obtained from a one-time OAuth2 consent flow for the `hello-nodibot` sending mailbox. Required Gmail API scope: `https://www.googleapis.com/auth/gmail.modify` (or `gmail.send` + `gmail.readonly`). |
| `GMAIL_SENDER` | The sending address, e.g. `hello@hello-nodibot.example` |

### 3. Configure cron and compliance env vars

Also set these in the Vercel project environment:

| Variable | Description |
|---|---|
| `CRON_SECRET` | A random secret. Vercel Cron automatically passes it as `Authorization: Bearer <CRON_SECRET>` when invoking the job endpoint. |
| `OUTREACH_MAILING_ADDRESS` | Physical mailing address displayed in the CAN-SPAM footer of every outreach email. |

### 4. Create email templates

In the admin portal at `/admin-portal/outreach/templates`, create at least one active template of
type `initial` and one active template of type `reminder`. Templates support the variables
`{{company}}`, `{{contact_name}}`, and `{{part_number}}`.

### 5. How the cron job works

The daily cron runs at **14:00 UTC** (`0 14 * * *`). It is configured in `vercel.json` and hits the
route `/api/cron/outreach`. On each run it:

1. Syncs reply detection for previously sent emails.
2. Sends due outreach emails up to the configured `daily_cap`.
3. If a lead has not replied within the reminder window (default 7 days), sends one reminder email,
   then stops further follow-up for that lead.

### 6. Deliverability and sending settings

To avoid spam filters during warm-up:

- Start with a low `daily_cap` (~20 emails/day) and set a `warmup_start_date` so the volume ramps
  up gradually each week.
- Adjust these values under `/admin-portal/outreach/settings`.
- Use the **paused** toggle on the settings page to halt all sending immediately if needed.
