'use client';

import React from 'react';

export const ArchiveLoadingGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl overflow-hidden bg-cc-card border border-border animate-pulse h-80"
        >
          <div className="h-36 bg-border/40" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-border/40 rounded-sm w-2/3" />
            <div className="h-3 bg-border/40 rounded-sm w-1/2" />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="h-10 bg-cc-ground rounded-lg" />
              <div className="h-10 bg-cc-ground rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ArchiveLoadingGrid;
