'use client';

import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface DeniedClipPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const DeniedClipPagination: React.FC<DeniedClipPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center pt-4 gap-1.5">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-xl border border-border bg-cc-ground text-muted-foreground hover:text-white hover:border-border/80 disabled:opacity-30 transition-colors text-xs cursor-pointer disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <FaChevronLeft size={10} />
      </button>

      <div className="flex gap-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageToShow: number | string;
          if (totalPages <= 5) {
            pageToShow = i + 1;
          } else if (currentPage <= 3) {
            pageToShow = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageToShow = totalPages - 4 + i;
          } else {
            pageToShow = currentPage - 2 + i;
          }

          if (typeof pageToShow === 'number') {
            const isActive = currentPage === pageToShow;
            return (
              <button
                key={`page-${pageToShow}`}
                type="button"
                onClick={() => onPageChange(pageToShow as number)}
                className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-cc-ground border border-border text-muted-foreground hover:text-white hover:border-border/80'
                }`}
              >
                {pageToShow}
              </button>
            );
          }
          return (
            <span key={`dots-${i}`} className="px-2 py-1 text-xs text-muted-foreground">
              ...
            </span>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-xl border border-border bg-cc-ground text-muted-foreground hover:text-white hover:border-border/80 disabled:opacity-30 transition-colors text-xs cursor-pointer disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <FaChevronRight size={10} />
      </button>
    </div>
  );
};

export default DeniedClipPagination;
