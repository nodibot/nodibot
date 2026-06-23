-- nodibot — Phase 4: manual sourcing findings.
-- Run after 0004_outreach.sql.

create table if not exists public.sourcing_quotes (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  platform text not null default '1688'
    check (platform in ('1688', 'alibaba', 'taobao', 'xianyu', 'wechat', 'other')),
  supplier_name text not null,
  listing_url text not null,
  contact_handle text,
  condition text,
  moq integer,
  lead_time_days integer,
  notes text,
  selected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sourcing_quotes_inquiry_idx on public.sourcing_quotes (inquiry_id, created_at desc);
create index if not exists sourcing_quotes_selected_idx on public.sourcing_quotes (inquiry_id) where selected = true;

alter table public.sourcing_quotes enable row level security;

create policy "admin all sourcing_quotes" on public.sourcing_quotes
  for all to authenticated using (true) with check (true);
