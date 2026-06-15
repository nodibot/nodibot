-- nodibot — RFQ-first product catalog + staged Excel imports.
-- Run after 0001_init.sql and 0002_admin.sql.

-- ============================================================
-- parts: remove public price model, add import/image metadata
-- ============================================================
alter table public.parts
  drop column if exists refurb_low,
  drop column if exists refurb_high,
  drop column if exists oem,
  drop column if exists resale_ref,
  drop column if exists supplier_notes;

alter table public.parts
  add column if not exists alternative_pns text[] not null default '{}',
  add column if not exists category_l1 text,
  add column if not exists category_l2 text,
  add column if not exists series text,
  add column if not exists equipment_type text,
  add column if not exists compatible_controllers text[] not null default '{}',
  add column if not exists compatible_robot_models text[] not null default '{}',
  add column if not exists controller_generation text,
  add column if not exists availability_label text,
  add column if not exists description_kr text,
  add column if not exists failure_keywords text[] not null default '{}',
  add column if not exists image_url text,
  add column if not exists image_storage_path text,
  add column if not exists image_status text not null default 'missing'
    check (image_status in ('missing', 'pending_review', 'approved', 'rejected')),
  add column if not exists demand_score integer,
  add column if not exists scarcity_score integer,
  add column if not exists sales_priority_grade text,
  add column if not exists sales_priority_score integer,
  add column if not exists source_urls text[] not null default '{}',
  add column if not exists admin_notes text;

create index if not exists parts_alt_pns_gin on public.parts using gin (alternative_pns);
create index if not exists parts_compatible_controllers_gin on public.parts using gin (compatible_controllers);
create index if not exists parts_compatible_robot_models_gin on public.parts using gin (compatible_robot_models);
create index if not exists parts_failure_keywords_gin on public.parts using gin (failure_keywords);
create index if not exists parts_demand_score_idx on public.parts (demand_score desc nulls last);

-- ============================================================
-- staged import batches / rows
-- ============================================================
create table if not exists public.part_import_batches (
  id              uuid primary key default gen_random_uuid(),
  file_name       text not null,
  source          text not null default 'xlsx',
  status          text not null default 'staged'
                  check (status in ('staged', 'published', 'failed')),
  total_rows      integer not null default 0,
  valid_rows      integer not null default 0,
  invalid_rows    integer not null default 0,
  created_at      timestamptz not null default now()
);

create table if not exists public.part_import_rows (
  id              uuid primary key default gen_random_uuid(),
  batch_id        uuid not null references public.part_import_batches(id) on delete cascade,
  row_number      integer not null,
  status          text not null default 'valid'
                  check (status in ('valid', 'invalid', 'published', 'skipped')),
  errors          text[] not null default '{}',
  normalized      jsonb not null,
  raw             jsonb not null,
  part_id         text references public.parts(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (batch_id, row_number)
);

create index if not exists part_import_rows_batch_idx on public.part_import_rows (batch_id, row_number);
create index if not exists part_import_rows_status_idx on public.part_import_rows (status);
create index if not exists part_import_rows_normalized_gin on public.part_import_rows using gin (normalized);

alter table public.part_import_batches enable row level security;
alter table public.part_import_rows enable row level security;

drop policy if exists "admin manage import batches" on public.part_import_batches;
create policy "admin manage import batches"
  on public.part_import_batches for all to authenticated
  using (true)
  with check (true);

drop policy if exists "admin manage import rows" on public.part_import_rows;
create policy "admin manage import rows"
  on public.part_import_rows for all to authenticated
  using (true)
  with check (true);
