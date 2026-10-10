'use client';

import React, { useEffect } from 'react';
import {
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaEllipsisH,
} from 'react-icons/fa';
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
    className={`mx-1 h-9.5 w-9.5 flex items-center justify-center rounded-xl border border-border text-sm ${
      navDisabled
        ? 'bg-cc-ground/50 text-muted-foreground/40 cursor-not-allowed opacity-50'
        : 'bg-cc-card text-muted-foreground hover:bg-secondary hover:text-white cursor-pointer'
    } transition-all duration-150`}
    disabled={navDisabled}
    aria-label={label}
  >
    {icon}
  </motion.button>
);

const Pagination: React.FC<PaginationProps> = ({
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
      className={`mx-1 min-w-[38px] h-9.5 px-2 flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-150 ${
        page === currentPage
          ? 'bg-primary text-white font-bold shadow-lg shadow-primary/30 border border-primary'
          : 'bg-cc-card text-muted-foreground border border-border hover:bg-secondary hover:text-white'
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
        <div key="ellipsis-start" className="flex items-center px-2 text-muted-foreground">
          <FaEllipsisH />
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
        <div key="ellipsis-end" className="flex items-center px-2 text-muted-foreground">
          <FaEllipsisH />
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
        icon={<FaAngleDoubleLeft className="text-lg" />}
        label="First page"
      />

      <NavButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || disabled}
        icon={<FaAngleLeft className="text-lg" />}
        label="Previous page"
      />

      <div className="flex mx-1">{renderPageButtons()}</div>

      <NavButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || disabled}
        icon={<FaAngleRight className="text-lg" />}
        label="Next page"
      />

      <NavButton
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages || disabled}
        icon={<FaAngleDoubleRight className="text-lg" />}
        label="Last page"
      />
    </div>
  );
};

export default Pagination;