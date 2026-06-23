-- nodibot — Phase 5b: geo fields for analytics events.
-- Run after 0006_analytics.sql.

alter table public.website_events
  add column if not exists country_code text,
  add column if not exists region text,
  add column if not exists city text,
  add column if not exists ip_hash text;

create index if not exists website_events_country_idx
  on public.website_events (country_code)
  where country_code is not null;

create index if not exists website_events_region_idx
  on public.website_events (region)
  where region is not null;
