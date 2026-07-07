"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/app/_lib/analytics-client";
import {
  computeScrollDepth,
  newlyReachedMilestones,
  type ScrollDepthMilestone,
} from "@/app/_lib/catalog-scroll-depth";

export function CatalogScrollDepthTracker({
  viewKey,
  query,
  currentPage,
  resultsCount,
}: {
  viewKey: string;
  query: string;
  currentPage: number;
  resultsCount: number;
}) {
  const firedRef = useRef<Set<ScrollDepthMilestone>>(new Set());
  const tickingRef = useRef(false);

  useEffect(() => {
    firedRef.current = new Set();

    const checkDepth = () => {
      tickingRef.current = false;
      const depth = computeScrollDepth(
        window.scrollY,
        window.innerHeight,
        document.documentElement.scrollHeight,
      );
      const pending = newlyReachedMilestones(depth, firedRef.current);
      for (const milestone of pending) {
        firedRef.current.add(milestone);
        trackEvent({
          event_name: "catalog_scroll_depth",
          query: query || undefined,
          metadata: {
            depth: milestone,
            page: currentPage,
            results: resultsCount,
          },
        });
      }
    };

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(checkDepth);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    requestAnimationFrame(checkDepth);

    return () => window.removeEventListener("scroll", onScroll);
  }, [viewKey, query, currentPage, resultsCount]);

  return null;
}
