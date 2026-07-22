import Link from "next/link";
import {
  buildPaginationHref,
  DEFAULT_LABELS,
  getPaginationMeta,
  pageWindow,
  type PaginationLabels,
} from "@/app/_lib/pagination";

type SearchParamValue = string | string[] | undefined;

export interface PaginationProps {
  pathname: string;
  currentPage: number;
  totalItems: number;
  pageSize: number;
  searchParams?: Record<string, SearchParamValue>;
  pageParam?: string;
  labels?: Partial<PaginationLabels>;
  className?: string;
  /** Next.js Link prefetch; disable on heavy dynamic admin pages. Default true. */
  prefetch?: boolean;
}

export function Pagination({
  pathname,
  currentPage,
  totalItems,
  pageSize,
  searchParams = {},
  pageParam = "page",
  labels,
  className = "site-pagination",
  prefetch = true,
}: PaginationProps) {
  const copy = { ...DEFAULT_LABELS, ...labels };
  const { safePage, totalPages, start, end } = getPaginationMeta(currentPage, totalItems, pageSize);
  const pages = pageWindow(safePage, totalPages);

  if (totalItems === 0) return null;

  return (
    <nav className={className} aria-label={copy.ariaLabel}>
      <div className="site-pagination-meta">{copy.showing(start, end, totalItems)}</div>
      <div className="site-pagination-links">
        <Link
          aria-disabled={safePage === 1}
          className={`btn btn-ghost btn-sm ${safePage === 1 ? "is-disabled" : ""}`}
          href={buildPaginationHref(pathname, safePage - 1, searchParams, pageParam)}
          tabIndex={safePage === 1 ? -1 : undefined}
          prefetch={prefetch}
        >
          {copy.prev}
        </Link>
        {pages.map((entry, idx) =>
          entry === "ellipsis" ? (
            <span key={`ellipsis-${idx}`} className="site-pagination-ellipsis">
              ...
            </span>
          ) : (
            <Link
              key={entry}
              aria-current={entry === safePage ? "page" : undefined}
              className={`btn btn-sm ${entry === safePage ? "btn-primary" : "btn-ghost"}`}
              href={buildPaginationHref(pathname, entry, searchParams, pageParam)}
              prefetch={prefetch}
            >
              {entry}
            </Link>
          ),
        )}
        <Link
          aria-disabled={safePage === totalPages}
          className={`btn btn-ghost btn-sm ${safePage === totalPages ? "is-disabled" : ""}`}
          href={buildPaginationHref(pathname, safePage + 1, searchParams, pageParam)}
          tabIndex={safePage === totalPages ? -1 : undefined}
          prefetch={prefetch}
        >
          {copy.next}
        </Link>
      </div>
    </nav>
  );
}

export {
  clampPageForTotal,
  paginateItems,
  parsePageParam,
} from "@/app/_lib/pagination";
