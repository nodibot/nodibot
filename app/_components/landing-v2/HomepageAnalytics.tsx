"use client";

import { useEffect } from "react";
import { trackEvent } from "@/app/_lib/analytics-client";

export function HomepageAnalytics() {
  useEffect(() => {
    trackEvent({ event_name: "homepage_view" });
  }, []);

  return null;
}
