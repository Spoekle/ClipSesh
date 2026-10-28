'use client';

import React, { useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

interface NavButtonProps {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({
  onClick,
  disabled: navDisabled,
  icon,
  label,
}) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    whileHover={!navDisabled ? { scale: 1.05, y: -1 } : undefined}
    onClick={onClick}
    className={`mx-1 h-9 w-9 flex items-center justify-center rounded-lg border border-border text-sm ${
      navDisabled
        ? 'bg-background/50 text-muted-foreground/40 cursor-not-allowed opacity-50'
        : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer'
    } transition-all duration-150`}
    disabled={navDisabled}
    aria-label={label}
  >
    {icon}
  </motion.button>
);

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'ArrowRight' && currentPage < totalPages) {
        onPageChange(currentPage + 1);
      } else if (e.key === 'ArrowLeft' && currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, onPageChange]);

  const renderPageButton = (page: number) => (
    <motion.button
      key={page}
      whileTap={{ scale: 0.95 }}
      whileHover={!disabled ? { scale: 1.05, y: -1 } : undefined}
      onClick={() => !disabled && onPageChange(page)}
      className={`mx-1 min-w-[36px] h-9 px-2 flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150 ${
        page === currentPage
          ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 border border-primary'
          : 'bg-card text-muted-foreground border border-border hover:bg-secondary hover:text-foreground'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      disabled={disabled}
      aria-label={`Page ${page}`}
      aria-current={page === currentPage ? 'page' : undefined}
    >
      {page}
    </motion.button>
  );

  const renderPageButtons = () => {
    const pageButtons: React.ReactNode[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageButtons.push(renderPageButton(i));
      }
      return pageButtons;
    }

    pageButtons.push(renderPageButton(1));

    if (currentPage > 3) {
      pageButtons.push(
        <div key="ellipsis-start" className="flex items-center px-1 text-muted-foreground">
          <MoreHorizontal className="size-4" />
        </div>
      );
    }

    let startPage = Math.max(currentPage - 1, 2);
    let endPage = Math.min(currentPage + 1, totalPages - 1);

    if (currentPage <= 3) {
      endPage = 4;
    } else if (currentPage >= totalPages - 2) {
      startPage = totalPages - 3;
    }

    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(renderPageButton(i));
    }

    if (currentPage < totalPages - 2) {
      pageButtons.push(
        <div key="ellipsis-end" className="flex items-center px-1 text-muted-foreground">
          <MoreHorizontal className="size-4" />
        </div>
      );
    }

    pageButtons.push(renderPageButton(totalPages));

    return pageButtons;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap justify-center items-center my-4 gap-1">
      <NavButton
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1 || disabled}
        icon={<ChevronsLeft className="size-4" />}
        label="First page"
      />

      <NavButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || disabled}
        icon={<ChevronLeft className="size-4" />}
        label="Previous page"
      />

      <div className="flex mx-1">{renderPageButtons()}</div>

      <NavButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || disabled}
        icon={<ChevronRight className="size-4" />}
        label="Next page"
      />

      <NavButton
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages || disabled}
        icon={<ChevronsRight className="size-4" />}
        label="Last page"
      />
    </div>
  );
};

export default Pagination;