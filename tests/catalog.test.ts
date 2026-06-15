import { describe, it, expect } from "vitest";
import { filterParts, sortParts, matchesQuery, computeCounts } from "../app/_lib/catalog";
import type { Part } from "../app/_lib/types";

function part(over: Partial<Part>): Part {
  return {
    id: "x",
    cat: "controllers",
    brand: "Siemens",
    pn: "6ES7315-2AH14-0AB0",
    name: "CPU 315-2 DP",
    life: "Active",
    cond: "refurb",
    stock: "request",
    qty: null,
    lead: "3-6 days",
    hosts: ["siemens"],
    views: 100,
    alternativePns: [],
    categoryL1: null,
    categoryL2: null,
    series: null,
    equipmentType: null,
    compatibleControllers: [],
    compatibleRobotModels: [],
    controllerGeneration: null,
    availabilityLabel: null,
    descriptionKr: null,
    failureKeywords: [],
    imageUrl: null,
    imageStoragePath: null,
    imageStatus: "missing",
    ...over,
  };
}

describe("matchesQuery", () => {
  const p = part({});
  it("matches a partial part number (the core search case)", () => {
    expect(matchesQuery(p, "6ES7315")).toBe(true);
  });
  it("matches brand and name case-insensitively", () => {
    expect(matchesQuery(p, "siemens")).toBe(true);
    expect(matchesQuery(p, "cpu")).toBe(true);
  });
  it("returns true for an empty query", () => {
    expect(matchesQuery(p, "  ")).toBe(true);
  });
  it("returns false for a non-match", () => {
    expect(matchesQuery(p, "fanuc")).toBe(false);
  });
});

describe("filterParts", () => {
  const parts = [
    part({ id: "a", cat: "controllers", hosts: ["siemens"], stock: "request" }),
    part({ id: "b", cat: "motion", hosts: ["fanuc"], stock: "in" }),
    part({ id: "c", cat: "motion", hosts: ["fanuc", "abb"], stock: "request" }),
  ];

  it("filters by category", () => {
    const r = filterParts(parts, { cats: ["motion"], hosts: [], stock: [], query: "" });
    expect(r.map((p) => p.id)).toEqual(["b", "c"]);
  });
  it("filters by host (array overlap)", () => {
    const r = filterParts(parts, { cats: [], hosts: ["abb"], stock: [], query: "" });
    expect(r.map((p) => p.id)).toEqual(["c"]);
  });
  it("filters by stock", () => {
    const r = filterParts(parts, { cats: [], hosts: [], stock: ["in"], query: "" });
    expect(r.map((p) => p.id)).toEqual(["b"]);
  });
  it("combines filters (AND across groups)", () => {
    const r = filterParts(parts, { cats: ["motion"], hosts: ["fanuc"], stock: ["request"], query: "" });
    expect(r.map((p) => p.id)).toEqual(["c"]);
  });
});

describe("sortParts", () => {
  const parts = [
    part({ id: "lo", brand: "ABB", cat: "motion", views: 10 }),
    part({ id: "hi", brand: "Fanuc", cat: "controllers", views: 900 }),
  ];
  it("sorts by demand (views desc)", () => {
    expect(sortParts(parts, "demand").map((p) => p.id)).toEqual(["hi", "lo"]);
  });
  it("sorts by brand alphabetically", () => {
    expect(sortParts(parts, "brand").map((p) => p.id)).toEqual(["lo", "hi"]);
  });
  it("sorts by category alphabetically", () => {
    expect(sortParts(parts, "category").map((p) => p.id)).toEqual(["hi", "lo"]);
  });
});

describe("computeCounts", () => {
  it("counts parts per category and per host", () => {
    const parts = [
      part({ cat: "controllers", hosts: ["siemens", "abb"] }),
      part({ cat: "controllers", hosts: ["siemens"] }),
      part({ cat: "motion", hosts: ["fanuc"] }),
    ];
    const { cat, host } = computeCounts(parts);
    expect(cat).toEqual({ controllers: 2, motion: 1 });
    expect(host).toEqual({ siemens: 2, abb: 1, fanuc: 1 });
  });
});
