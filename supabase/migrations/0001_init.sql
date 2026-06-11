-- SourC — Phase 1 schema: parts + inquiries, search, RLS, view-count rpc.
-- Run this in the Supabase SQL editor (or via the Supabase CLI) before seeding.

-- Trigram search for partial part-number matching (e.g. "6ES7321").
create extension if not exists pg_trgm;

-- ============================================================
-- parts
-- ============================================================
create table if not exists public.parts (
  id             text primary key,
  cat            text not null,
  brand          text not null,
  pn             text not null unique,
  name           text not null,
  refurb_low     integer not null,
  refurb_high    integer not null,
  oem            integer not null,
  life           text not null,
  cond           text not null,
  stock          text not null check (stock in ('in', 'request')),
  qty            integer,
  lead           text not null,
  hosts          text[] not null default '{}',
  views          integer not null default 0,
  is_active      boolean not null default true,
  -- admin-only fields, created now, surfaced in Phase 2:
  supplier_notes text,
  resale_ref     integer,
  created_at     timestamptz not null default now()
);

create index if not exists parts_pn_trgm on public.parts using gin (pn gin_trgm_ops);
create index if not exists parts_name_trgm on public.parts using gin (name gin_trgm_ops);
create index if not exists parts_hosts_gin on public.parts using gin (hosts);
create index if not exists parts_cat_idx on public.parts (cat);
create index if not exists parts_active_views_idx on public.parts (is_active, views desc);

-- ============================================================
-- inquiries (RFQ submissions)
-- ============================================================
create table if not exists public.inquiries (
  id         uuid primary key default gen_random_uuid(),
  part_id    text references public.parts(id) on delete set null,
  part_pn    text,
  name       text not null,
  company    text,
  contact    text not null,
  channel    text not null check (channel in ('WhatsApp', 'Email', 'Phone')),
  urgency    text not null check (urgency in ('down', 'spare')),
  qty        integer,
  cond       text,
  notes      text,
  status     text not null default 'new'
             check (status in ('new', 'sourcing', 'found', 'quoted', 'closed')),
  ticket     text not null,
  created_at timestamptz not null default now()
);

create index if not exists inquiries_status_idx on public.inquiries (status, created_at desc);

-- ============================================================
-- Row-Level Security
-- ============================================================
alter table public.parts enable row level security;
alter table public.inquiries enable row level security;

-- Anyone may read ACTIVE parts only.
drop policy if exists "public read active parts" on public.parts;
create policy "public read active parts"
  on public.parts for select
  using (is_active = true);

-- Anyone may submit an inquiry; nobody (anon) may read them back.
drop policy if exists "public insert inquiries" on public.inquiries;
create policy "public insert inquiries"
  on public.inquiries for insert
  with check (true);

-- ============================================================
-- Atomic view-count increment (bypasses RLS via SECURITY DEFINER)
-- ============================================================
create or replace function public.increment_part_view(p_pn text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.parts set views = views + 1 where pn = p_pn and is_active = true;
$$;

grant execute on function public.increment_part_view(text) to anon, authenticated;
