"use client";

export type AnalyticsEventName =
  | "session_entry"
  | "homepage_view"
  | "homepage_search"
  | "homepage_brand_click"
  | "homepage_category_click"
  | "homepage_ready_product_click"
  | "homepage_bulk_rfq_open"
  | "catalog_view"
  | "catalog_item_click"
  | "catalog_search"
  | "catalog_no_results"
  | "catalog_filter_change"
  | "catalog_sort_change"
  | "catalog_scroll_depth"
  | "rfq_submitted"
  | "bulk_rfq_submitted"
  | "whatsapp_click"
  | "email_click";

export interface AnalyticsEventPayload {
  event_name: AnalyticsEventName;
  page_path?: string;
  part_pn?: string;
  query?: string;
  channel?: string;
  metadata?: Record<string, unknown>;
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin-portal" || pathname.startsWith("/admin-portal/");
}

export function trackEvent(payload: AnalyticsEventPayload): void {
  const pathname = payload.page_path ?? (typeof window !== "undefined" ? window.location.pathname : "");
  if (pathname && isAdminPath(pathname)) return;

  let entryPage: string | undefined;
  try {
    entryPage = sessionStorage.getItem("nodibot-entry-page") ?? undefined;
    if (!entryPage) {
      entryPage = window.location.pathname;
      if (isAdminPath(entryPage)) {
        entryPage = undefined;
      } else {
        sessionStorage.setItem("nodibot-entry-page", entryPage);
      }
    } else if (isAdminPath(entryPage)) {
      entryPage = undefined;
    }
  } catch {
    // Storage can be unavailable in privacy modes; analytics still proceeds.
  }

  const body = JSON.stringify({
    ...payload,
    page_path: payload.page_path ?? window.location.pathname,
    metadata: {
      ...(entryPage ? { entry_page: entryPage } : {}),
      ...payload.metadata,
    },
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
