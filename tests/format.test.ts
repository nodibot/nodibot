import { describe, it, expect } from "vitest";
import { fmt, priceRange, savePct } from "../app/_lib/format";

describe("fmt", () => {
  it("formats with a dollar sign and thousands separators", () => {
    expect(fmt(1200)).toBe("$1,200");
    expect(fmt(0)).toBe("$0");
    expect(fmt(14000)).toBe("$14,000");
  });
});

describe("priceRange", () => {
  it("renders a low–high range", () => {
    expect(priceRange([800, 1200])).toBe("$800 – $1,200");
  });
});

describe("savePct", () => {
  it("computes percentage saved off OEM using the refurb midpoint", () => {
    // midpoint 1000 vs oem 2800 => ~64%
    expect(savePct([800, 1200], 2800)).toBe(64);
    // midpoint 1450 vs oem 7500 => ~81%
    expect(savePct([1100, 1800], 7500)).toBe(81);
  });
});
