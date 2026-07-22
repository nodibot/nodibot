"use client";

import { useEffect } from "react";
import { trackEvent } from "@/app/_lib/analytics-client";

const ENTRY_RECORDED_KEY = "nodibot-entry-recorded";

export function AnalyticsSession() {
  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname === "/admin-portal" || pathname.startsWith("/admin-portal/")) {
      return;
    }

    try {
      if (sessionStorage.getItem(ENTRY_RECORDED_KEY)) return;
      sessionStorage.setItem(ENTRY_RECORDED_KEY, "1");
    } catch {
      // If storage is unavailable, record the entry for this mount.
    }

    trackEvent({
      event_name: "session_entry",
      metadata: {
        referrer: document.referrer || undefined,
      },
    });
  }, []);

  return null;
}
