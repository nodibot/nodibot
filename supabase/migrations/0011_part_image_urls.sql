-- nodibot — extra product photos for the detail gallery.
-- Catalog cards keep using image_url (primary). image_urls is primary-first.

alter table public.parts
  add column if not exists image_urls text[] not null default '{}';

update public.parts
  set image_urls = array[image_url]
  where image_url is not null
    and image_url <> ''
    and cardinality(image_urls) = 0;
