import { describe, it, expect } from "vitest";
import {
  isScrollBeyondBaseline,
  SCROLL_PX_THRESHOLD,
} from "../app/_lib/catalog-scroll-depth";

describe("isScrollBeyondBaseline", () => {
  it("returns false when scroll has not moved enough from baseline", () => {
    expect(isScrollBeyondBaseline(100, 100)).toBe(false);
    expect(isScrollBeyondBaseline(100 + SCROLL_PX_THRESHOLD - 1, 100)).toBe(false);
  });

  it("returns true when scroll moved enough below baseline", () => {
    expect(isScrollBeyondBaseline(100 + SCROLL_PX_THRESHOLD, 100)).toBe(true);
  });

  it("returns true when scroll moved enough above baseline", () => {
    expect(isScrollBeyondBaseline(100 - SCROLL_PX_THRESHOLD, 100)).toBe(true);
  });
});
