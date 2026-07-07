export const SCROLL_DEPTH_MILESTONES = [25, 50, 75, 100] as const;

export type ScrollDepthMilestone = (typeof SCROLL_DEPTH_MILESTONES)[number];

/** Percent of page scrolled (0–100), based on viewport bottom vs document height. */
export function computeScrollDepth(
  scrollY: number,
  innerHeight: number,
  scrollHeight: number,
): number {
  if (scrollHeight <= 0) return 0;
  const raw = ((scrollY + innerHeight) / scrollHeight) * 100;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

/** Milestones at or below the current depth that have not been fired yet. */
export function newlyReachedMilestones(
  depth: number,
  fired: ReadonlySet<number>,
): ScrollDepthMilestone[] {
  return SCROLL_DEPTH_MILESTONES.filter((m) => depth >= m && !fired.has(m));
}
