'use client';

import React from 'react';

export const ArchiveLoadingGrid: React.FC = () => {
  return (
    <div className="flex flex-col gap-14 animate-pulse">
      <div className="grid overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-5">
        <div className="aspect-video bg-secondary/50 md:col-span-3 md:aspect-auto md:min-h-80" />
        <div className="space-y-4 p-8 md:col-span-2">
          <div className="h-3 w-24 rounded-sm bg-secondary/60" />
          <div className="h-10 w-2/3 rounded-md bg-secondary/60" />
          <div className="h-16 w-32 rounded-2xl bg-background" />
          <div className="h-10 w-36 rounded-full bg-secondary/60" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[9.5rem_1fr]">
        <div className="space-y-2 pl-8 md:pl-0">
          <div className="h-10 w-24 rounded-md bg-secondary/60 md:ml-auto md:mr-8" />
          <div className="h-3 w-20 rounded-sm bg-secondary/40 md:ml-auto md:mr-8" />
        </div>
        <div className="grid grid-cols-1 gap-5 pl-8 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="aspect-video bg-secondary/50" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-1/2 rounded-sm bg-secondary/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArchiveLoadingGrid;
