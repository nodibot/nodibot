import { describe, it, expect } from "vitest";
import {
  computeScrollDepth,
  newlyReachedMilestones,
  SCROLL_DEPTH_MILESTONES,
} from "../app/_lib/catalog-scroll-depth";

describe("computeScrollDepth", () => {
  it("returns 0 at the top of a tall page", () => {
    expect(computeScrollDepth(0, 800, 4000)).toBe(20);
  });

  it("returns 100 when the viewport bottom reaches the document end", () => {
    expect(computeScrollDepth(3200, 800, 4000)).toBe(100);
  });

  it("returns 50 at the midpoint of a scrollable page", () => {
    expect(computeScrollDepth(1000, 1000, 4000)).toBe(50);
  });

  it("clamps to 100 for short pages where content fits in the viewport", () => {
    expect(computeScrollDepth(0, 900, 600)).toBe(100);
  });

  it("returns 0 when scroll height is zero", () => {
    expect(computeScrollDepth(0, 800, 0)).toBe(0);
  });
});

describe("newlyReachedMilestones", () => {
  it("returns all milestones not yet fired when depth is 100", () => {
    expect(newlyReachedMilestones(100, new Set())).toEqual([...SCROLL_DEPTH_MILESTONES]);
  });

  it("returns only milestones at or below depth", () => {
    expect(newlyReachedMilestones(60, new Set())).toEqual([25, 50]);
  });

  it("skips already-fired milestones", () => {
    expect(newlyReachedMilestones(100, new Set([25, 50]))).toEqual([75, 100]);
  });

  it("returns empty when depth is below the first milestone", () => {
    expect(newlyReachedMilestones(10, new Set())).toEqual([]);
  });
});
