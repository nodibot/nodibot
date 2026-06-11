// Pure catalog filter/sort/search logic — shared by the client CatalogView and
// unit-testable in isolation.
import type { Part } from "./types";

export type SortKey = "demand" | "price-lo" | "price-hi";

export interface CatalogFilters {
  cats: string[];
  hosts: string[];
  stock: string[];
  query: string;
}

const mid = (p: Part) => (p.refurb[0] + p.refurb[1]) / 2;

export function matchesQuery(part: Part, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    part.pn.toLowerCase().includes(q) ||
    part.name.toLowerCase().includes(q) ||
    part.brand.toLowerCase().includes(q)
  );
}

export function filterParts(parts: Part[], f: CatalogFilters): Part[] {
  return parts.filter((p) => {
    if (f.cats.length && !f.cats.includes(p.cat)) return false;
    if (f.hosts.length && !p.hosts.some((h) => f.hosts.includes(h))) return false;
    if (f.stock.length && !f.stock.includes(p.stock)) return false;
    if (!matchesQuery(p, f.query)) return false;
    return true;
  });
}

export function sortParts(parts: Part[], sort: SortKey): Part[] {
  const r = [...parts];
  r.sort((a, b) => {
    if (sort === "demand") return b.views - a.views;
    if (sort === "price-lo") return mid(a) - mid(b);
    if (sort === "price-hi") return mid(b) - mid(a);
    return 0;
  });
  return r;
}

export interface CatalogCounts {
  cat: Record<string, number>;
  host: Record<string, number>;
}

export function computeCounts(parts: Part[]): CatalogCounts {
  const cat: Record<string, number> = {};
  const host: Record<string, number> = {};
  for (const p of parts) {
    cat[p.cat] = (cat[p.cat] || 0) + 1;
    for (const h of p.hosts) host[h] = (host[h] || 0) + 1;
  }
  return { cat, host };
}
