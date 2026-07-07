-- nodibot — catalog scroll depth analytics event.
-- Run after 0008_growth_analytics_events.sql.

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
      'catalog_scroll_depth',
      'rfq_submitted',
      'bulk_rfq_submitted',
      'whatsapp_click',
      'email_click'
    )
  );
