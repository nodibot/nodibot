-- nodibot — session entry and homepage conversion funnel events.
-- Run after 0009_catalog_scroll_depth_event.sql.

alter table public.website_events
  drop constraint if exists website_events_event_name_check;

alter table public.website_events
  add constraint website_events_event_name_check check (
    event_name in (
      'session_entry',
      'homepage_view',
      'homepage_search',
      'homepage_brand_click',
      'homepage_category_click',
      'homepage_ready_product_click',
      'homepage_bulk_rfq_open',
      'catalog_view',
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
