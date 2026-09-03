-- Split outreach contact_name into first_name + last_name.
-- {{contact_name}} in templates uses first_name.
-- Run after 0004_outreach.sql.

alter table public.outreach_leads
  add column if not exists first_name text,
  add column if not exists last_name text;

update public.outreach_leads
set
  first_name = coalesce(
    first_name,
    nullif(split_part(trim(contact_name), ' ', 1), '')
  ),
  last_name = coalesce(
    last_name,
    nullif(btrim(substr(trim(contact_name), strpos(trim(contact_name) || ' ', ' '))), '')
  )
where contact_name is not null
  and trim(contact_name) <> '';
