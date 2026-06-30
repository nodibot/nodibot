import { Pagination as BasePagination, type PaginationProps as BasePaginationProps } from "@/app/_components/Pagination";

export {
  clampPageForTotal,
  paginateItems,
  parsePageParam,
  buildPaginationHref,
  getPaginationMeta,
} from "@/app/_lib/pagination";

type PaginationProps = Omit<BasePaginationProps, "className">;

export function Pagination(props: PaginationProps) {
  return <BasePagination {...props} className="admin-pagination" />;
}
