"use client";

export type AnalyticsEventName =
  | "catalog_item_click"
  | "catalog_search"
  | "catalog_filter_change"
  | "catalog_sort_change"
  | "rfq_submitted"
  | "whatsapp_click";

export interface AnalyticsEventPayload {
  event_name: AnalyticsEventName;
  page_path?: string;
  part_pn?: string;
  query?: string;
  channel?: string;
  metadata?: Record<string, unknown>;
}

export function trackEvent(payload: AnalyticsEventPayload): void {
  const body = JSON.stringify({
    ...payload,
    page_path: payload.page_path ?? window.location.pathname,
  });

  // Use fetch+keepalive for consistent DevTools visibility and better behavior
  // around Next.js navigation clicks.
  try {
    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      cache: "no-store",
    }).catch(() => {});
  } catch {
    // Best-effort analytics only.
  }
}
