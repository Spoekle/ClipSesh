'use client';

import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Clip } from '@/types/adminTypes';

interface ClipAdjacentNavProps {
  prevClip: Clip | null;
  nextClip: Clip | null;
  onNavigate: (clipId: string) => void;
  isLoading: boolean;
}

export const ClipAdjacentNav: React.FC<ClipAdjacentNavProps> = ({
  prevClip,
  nextClip,
  onNavigate,
  isLoading,
}) => {
  return (
    <>
      {prevClip && (
        <button
          onClick={() => onNavigate(prevClip._id)}
          disabled={isLoading}
          className={`hidden 2xl:flex fixed left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full items-center justify-center shadow-2xl border transition-all cursor-pointer ${
            isLoading
              ? 'bg-cc-card/50 border-border opacity-50 cursor-not-allowed'
              : 'bg-cc-card/90 hover:bg-border/60 text-cc-text border-border hover:scale-110 active:scale-95'
          }`}
          title={`Previous: ${prevClip.title}`}
          aria-label="Previous clip"
        >
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <FaChevronLeft size={16} />
          )}
        </button>
      )}

      {nextClip && (
        <button
          onClick={() => onNavigate(nextClip._id)}
          disabled={isLoading}
          className={`hidden 2xl:flex fixed right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full items-center justify-center shadow-2xl border transition-all cursor-pointer ${
            isLoading
              ? 'bg-cc-card/50 border-border opacity-50 cursor-not-allowed'
              : 'bg-cc-card/90 hover:bg-border/60 text-cc-text border-border hover:scale-110 active:scale-95'
          }`}
          title={`Next: ${nextClip.title}`}
          aria-label="Next clip"
        >
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <FaChevronRight size={16} />
          )}
        </button>
      )}
    </>
  );
};

export default ClipAdjacentNav;
