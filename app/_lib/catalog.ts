// Pure catalog filter/sort/search logic — shared by the client CatalogView and
// unit-testable in isolation.
import type { Part } from "./types";

export type SortKey = "demand" | "brand" | "category";

export interface CatalogFilters {
  cats: string[];
  hosts: string[];
  stock: string[];
  query: string;
}

export function matchesQuery(part: Part, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    part.pn.toLowerCase().includes(q) ||
    part.name.toLowerCase().includes(q) ||
    part.brand.toLowerCase().includes(q) ||
    part.alternativePns.some((pn) => pn.toLowerCase().includes(q)) ||
    part.compatibleControllers.some((controller) => controller.toLowerCase().includes(q)) ||
    part.compatibleRobotModels.some((model) => model.toLowerCase().includes(q)) ||
    part.failureKeywords.some((keyword) => keyword.toLowerCase().includes(q))
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
    if (sort === "brand") return a.brand.localeCompare(b.brand) || a.pn.localeCompare(b.pn);
    if (sort === "category") return a.cat.localeCompare(b.cat) || a.pn.localeCompare(b.pn);
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
