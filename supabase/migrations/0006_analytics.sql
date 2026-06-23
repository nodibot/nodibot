-- nodibot — Phase 5: website analytics events.
-- Run after 0005_sourcing.sql.

create table if not exists public.website_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (
    event_name in (
      'catalog_item_click',
      'catalog_search',
      'catalog_filter_change',
      'catalog_sort_change',
      'rfq_submitted',
      'whatsapp_click'
    )
  ),
  page_path text,
  part_pn text,
  query text,
  channel text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists website_events_event_created_idx on public.website_events (event_name, created_at desc);
create index if not exists website_events_part_pn_idx on public.website_events (part_pn) where part_pn is not null;
create index if not exists website_events_query_idx on public.website_events (query) where query is not null;

alter table public.website_events enable row level security;

-- Public site visitors can write analytics events only.
create policy "public insert website_events" on public.website_events
  for insert to anon, authenticated with check (true);

-- Admin users can read all analytics events.
create policy "admin read website_events" on public.website_events
  for select to authenticated using (true);
