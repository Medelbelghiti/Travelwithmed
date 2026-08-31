import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageHref = (page: number) => (page === 1 ? basePath : `${basePath}?page=${page}`);
  const prevPage = currentPage - 1;
  const nextPage = currentPage + 1;

  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {prevPage >= 1 && (
        <Link
          href={pageHref(prevPage)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink-soft transition-colors hover:border-brand hover:text-brand"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Link>
      )}

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="px-2 text-ink-muted">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-colors",
              p === currentPage
                ? "bg-brand text-white"
                : "border border-line text-ink-soft hover:border-brand hover:text-brand",
            )}
          >
            {p}
          </Link>
        ),
      )}

      {nextPage <= totalPages && (
        <Link
          href={pageHref(nextPage)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink-soft transition-colors hover:border-brand hover:text-brand"
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </Link>
      )}
    </nav>
  );
}