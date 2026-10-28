'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/Button';

interface SeasonPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export const SeasonPagination: React.FC<SeasonPaginationProps> = ({
  page,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-12 flex items-center justify-center gap-2 select-none">
      <Button
        variant="card"
        size="md"
        disabled={page <= 1}
        onClick={() => {
          onPageChange(Math.max(1, page - 1));
          window.scrollTo({ top: 180, behavior: 'smooth' });
        }}
        leftIcon={<ChevronLeft className="size-3.5" />}
      >
        Previous
      </Button>

      <div className="px-4 py-2 rounded-xl bg-background border border-border text-xs font-mono text-muted-foreground">
        Page <strong className="text-foreground">{page}</strong> of{' '}
        <strong className="text-foreground">{totalPages}</strong>
      </div>

      <Button
        variant="card"
        size="md"
        disabled={page >= totalPages}
        onClick={() => {
          onPageChange(Math.min(totalPages, page + 1));
          window.scrollTo({ top: 180, behavior: 'smooth' });
        }}
        rightIcon={<ChevronRight className="size-3.5" />}
      >
        Next
      </Button>
    </div>
  );
};

export default SeasonPagination;
