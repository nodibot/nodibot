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
