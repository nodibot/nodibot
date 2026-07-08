"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/app/_lib/analytics-client";
import {
  isScrollBeyondBaseline,
  SCROLL_SETTLE_MS,
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
  const firedRef = useRef(false);
  const tickingRef = useRef(false);
  const prevViewKeyRef = useRef<string | null>(null);

  useEffect(() => {
    firedRef.current = false;
    let baseline = window.scrollY;
    let armed = false;

    const arm = () => {
      baseline = window.scrollY;
      armed = true;
    };

    const isFirstView = prevViewKeyRef.current === null;
    prevViewKeyRef.current = viewKey;

    let settleTimer: number | undefined;
    let onScrollEnd: (() => void) | undefined;

    if (isFirstView) {
      arm();
    } else {
      // Pagination/filter changes may call scrollToCatalogResults — wait until that settles.
      onScrollEnd = () => arm();
      window.addEventListener("scrollend", onScrollEnd, { once: true });
      settleTimer = window.setTimeout(arm, SCROLL_SETTLE_MS);
    }

    const maybeTrackScroll = () => {
      tickingRef.current = false;
      if (!armed || firedRef.current || !isScrollBeyondBaseline(window.scrollY, baseline)) return;

      firedRef.current = true;
      trackEvent({
        event_name: "catalog_scroll_depth",
        query: query || undefined,
        metadata: {
          page: currentPage,
          results: resultsCount,
        },
      });
    };

    const onScroll = () => {
      if (firedRef.current || tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(maybeTrackScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
      if (onScrollEnd) window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("scroll", onScroll);
    };
  }, [viewKey, query, currentPage, resultsCount]);

  return null;
}
