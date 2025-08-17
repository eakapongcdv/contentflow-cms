// app/components/ui/pagination.tsx
import Link from "next/link";
import { Button, IconButton } from "@/app/components/ui/button";
import PageSizeSelect from "@/app/components/ui/page-size-select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export type PaginationFooterProps = {
  /** current page (1-based) */
  page: number;
  /** total pages (>= 1) */
  totalPages: number;
  /** total items (>= 0) */
  totalItems: number;
  /** page size (take) */
  take: number;
  /** function to build href for a given page number */
  makeHref: (page: number) => string;
  /** optional params to preserve when changing page size */
  pageSizeParams?: {
    q?: string;
    slug?: string;
    status?: string;
    categoryId?: string;
  };
};

export function PaginationFooter({ page, totalPages, totalItems, take, makeHref, pageSizeParams }: PaginationFooterProps) {
  const start = (page - 1) * take + 1;
  const end = Math.min(page * take, totalItems);

  // render a compact page list with gaps (1, ..., current-2..current+2, ..., total)
  const buildPageList = (current: number, total: number, span = 2): (number | "…")[] => {
    const pages = new Set<number>([1, total]);
    for (let p = current - span; p <= current + span; p++) {
      if (p >= 1 && p <= total) pages.add(p);
    }
    const sorted = Array.from(pages).sort((a, b) => a - b);
    const out: (number | "…")[] = [];
    for (let i = 0; i < sorted.length; i++) {
      out.push(sorted[i]);
      const next = sorted[i + 1];
      if (next && next - sorted[i] > 1) out.push("…");
    }
    return out;
  };

  const pageList = buildPageList(page, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="text-xs text-white/60">
        {totalItems > 0 ? (
          <>Showing {start}–{end} of {totalItems}</>
        ) : (
          <>No results</>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-white/60">Page size</span>
        <PageSizeSelect
          value={take}
          q={pageSizeParams?.q || ""}
          slug={pageSizeParams?.slug || ""}
          status={pageSizeParams?.status || ""}
          categoryId={pageSizeParams?.categoryId || ""}
          page={page}
        />
      </div>

      <div className="flex items-center gap-1">
        <Link href={makeHref(1)} aria-disabled={page === 1}>
          <IconButton
            variant="dark-outline" 
            aria-label="First"
            disabled={page === 1}
            className="rounded-full h-9 w-9 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </IconButton>
        </Link>
        <Link href={makeHref(Math.max(1, page - 1))} aria-disabled={page === 1}>
          <IconButton
            variant="dark-outline" 
            aria-label="Prev"
            disabled={page === 1}
            className="rounded-full h-9 w-9 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
        </Link>

        {pageList.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="inline-grid place-items-center h-9 w-9 text-white/50 select-none">
              …
            </span>
          ) : (
            <Link key={p} href={makeHref(p)}>
              <Button
                variant="dark-outline"
                size="sm"
                className="rounded-full h-9 w-9 px-0"
              >
                {p}
              </Button>
            </Link>
          )
        )}

        <Link href={makeHref(Math.min(totalPages, page + 1))} aria-disabled={page >= totalPages}>
          <IconButton
            variant="dark-outline" 
            aria-label="Next"
            disabled={page >= totalPages}
            className="rounded-full h-9 w-9 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </Link>
        <Link href={makeHref(totalPages)} aria-disabled={page >= totalPages}>
          <IconButton
            variant="dark-outline" 
            aria-label="Last"
            disabled={page >= totalPages}
            className="rounded-full h-9 w-9 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
          </IconButton>
        </Link>
      </div>
    </div>
  );
}

