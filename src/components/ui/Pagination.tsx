'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 border-t border-border/50">
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">
          Showing {startItem}–{endItem} of {totalItems}
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs bg-surface border border-border text-text-secondary rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-glass-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
          let page: number;
          if (totalPages <= 5) {
            page = i + 1;
          } else if (currentPage <= 3) {
            page = i + 1;
          } else if (currentPage >= totalPages - 2) {
            page = totalPages - 4 + i;
          } else {
            page = currentPage - 2 + i;
          }
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                page === currentPage
                  ? 'bg-primary/15 text-primary-light border border-primary/20'
                  : 'text-text-muted hover:text-text-primary hover:bg-glass-light'
              }`}
            >
              {page}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-glass-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
