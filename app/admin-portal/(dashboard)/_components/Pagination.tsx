import Link from "next/link";

type SearchParamValue = string | string[] | undefined;
type SearchParamsLike = Record<string, SearchParamValue>;

interface PaginationProps {
  pathname: string;
  currentPage: number;
  totalItems: number;
  pageSize: number;
  searchParams?: SearchParamsLike;
  pageParam?: string;
}

export function clampPageForTotal(currentPage: number, totalItems: number, pageSize: number): number {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  return Math.min(Math.max(1, currentPage), totalPages);
}

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

function pageWindow(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
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

export function Pagination({
  pathname,
  currentPage,
  totalItems,
  pageSize,
  searchParams = {},
  pageParam = "page",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems === 0 || totalPages <= 1) return null;

  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(totalItems, safePage * pageSize);

  function buildHref(targetPage: number): string {
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

  const pages = pageWindow(safePage, totalPages);

  return (
    <nav className="admin-pagination" aria-label="Pagination">
      <div className="admin-pagination-meta">
        Showing {start}-{end} of {totalItems}
      </div>
      <div className="admin-pagination-links">
        <Link
          aria-disabled={safePage === 1}
          className={`btn btn-ghost btn-sm ${safePage === 1 ? "is-disabled" : ""}`}
          href={buildHref(safePage - 1)}
          tabIndex={safePage === 1 ? -1 : undefined}
        >
          Prev
        </Link>
        {pages.map((entry, idx) =>
          entry === "ellipsis" ? (
            <span key={`ellipsis-${idx}`} className="admin-pagination-ellipsis">
              ...
            </span>
          ) : (
            <Link
              key={entry}
              aria-current={entry === safePage ? "page" : undefined}
              className={`btn btn-sm ${entry === safePage ? "btn-primary" : "btn-ghost"}`}
              href={buildHref(entry)}
            >
              {entry}
            </Link>
          ),
        )}
        <Link
          aria-disabled={safePage === totalPages}
          className={`btn btn-ghost btn-sm ${safePage === totalPages ? "is-disabled" : ""}`}
          href={buildHref(safePage + 1)}
          tabIndex={safePage === totalPages ? -1 : undefined}
        >
          Next
        </Link>
      </div>
    </nav>
  );
}
