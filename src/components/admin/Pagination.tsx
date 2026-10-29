import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export function PaginationControls({ page, pages, total, size, href }: { page: number; pages: number; total: number; size: number; href: (p: number) => string }) {
  if (total === 0) return null;
  const from = (page - 1) * size + 1, to = Math.min(total, page * size);
  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted">Showing {from}–{to} of {total}</p>
      <div className="flex items-center gap-2">
        {page > 1 ? <Link className="btn btn-sm" rel="prev" href={href(page - 1)}><ChevronLeft size={14} aria-hidden /> Previous</Link> : <span className="btn btn-sm opacity-40" aria-disabled><ChevronLeft size={14} aria-hidden /> Previous</span>}
        <span className="px-2 text-muted">Page {page} of {pages}</span>
        {page < pages ? <Link className="btn btn-sm" rel="next" href={href(page + 1)}>Next <ChevronRight size={14} aria-hidden /></Link> : <span className="btn btn-sm opacity-40" aria-disabled>Next <ChevronRight size={14} aria-hidden /></span>}
      </div>
    </nav>
  );
}
