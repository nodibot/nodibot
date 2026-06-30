export function clampPageForTotal(currentPage: number, totalItems: number, pageSize: number): number {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  return Math.min(Math.max(1, currentPage), totalPages);
}

type SearchParamValue = string | string[] | undefined;
type SearchParamsLike = Record<string, SearchParamValue>;

export function parsePageParam(
  searchParams: SearchParamsLike | undefined,
  pageParam = "page",
): number {
  const raw = searchParams?.[pageParam];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function paginateItems<T>(items: T[], currentPage: number, pageSize: number): T[] {
  const safePageSize = Math.max(1, pageSize);
  const safePage = clampPageForTotal(currentPage, items.length, safePageSize);
  const start = (safePage - 1) * safePageSize;
  return items.slice(start, start + safePageSize);
}

export function pageWindow(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: Array<number | "ellipsis"> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const page = sorted[i];
    const prev = sorted[i - 1];
    if (typeof prev === "number" && page - prev > 1) out.push("ellipsis");
    out.push(page);
  }
  return out;
}

export type PaginationLabels = {
  showing: (start: number, end: number, total: number) => string;
  prev: string;
  next: string;
  ariaLabel: string;
};

export const DEFAULT_LABELS: PaginationLabels = {
  showing: (start, end, total) => `Showing ${start}-${end} of ${total}`,
  prev: "Prev",
  next: "Next",
  ariaLabel: "Pagination",
};

export function buildPaginationHref(
  pathname: string,
  targetPage: number,
  searchParams: SearchParamsLike,
  pageParam = "page",
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (k === pageParam || v === undefined) continue;
    if (Array.isArray(v)) {
      for (const item of v) params.append(k, item);
    } else {
      params.set(k, v);
    }
  }
  if (targetPage > 1) params.set(pageParam, String(targetPage));
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getPaginationMeta(currentPage: number, totalItems: number, pageSize: number) {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(totalItems, safePage * safePageSize);
  return { safePage, totalPages, start, end };
}
