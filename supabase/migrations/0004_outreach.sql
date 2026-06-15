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
  reply_detected_at timestamptz,
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
