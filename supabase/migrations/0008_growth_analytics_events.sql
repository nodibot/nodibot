-- nodibot — Phase 6: growth analytics event names.
-- Run after 0007_analytics_geo.sql.

alter table public.website_events
  drop constraint if exists website_events_event_name_check;

alter table public.website_events
  add constraint website_events_event_name_check check (
    event_name in (
      'catalog_item_click',
      'catalog_search',
      'catalog_no_results',
      'catalog_filter_change',
      'catalog_sort_change',
      'rfq_submitted',
      'bulk_rfq_submitted',
      'whatsapp_click',
      'email_click'
    )
  );
