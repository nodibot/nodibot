/** Minimum vertical scroll (px) before counting as a scroll interaction. */
export const SCROLL_PX_THRESHOLD = 48;

/** How long to wait for pagination scroll-to-results before arming the tracker. */
export const SCROLL_SETTLE_MS = 700;

export function isScrollBeyondBaseline(scrollY: number, baseline: number): boolean {
  return Math.abs(scrollY - baseline) >= SCROLL_PX_THRESHOLD;
}
