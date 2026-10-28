'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SeasonFilterBarProps {
  searchInput: string;
  streamerFilter: string;
  streamers: string[];
  sortBy: 'createdAt' | 'views' | 'upvotes';
  sortOrder: 'desc' | 'asc';
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onStreamerFilterChange: (streamer: string) => void;
  onSortChange: (sortBy: 'createdAt' | 'views' | 'upvotes', sortOrder: 'desc' | 'asc') => void;
}

export const SeasonFilterBar: React.FC<SeasonFilterBarProps> = ({
  searchInput,
  streamerFilter,
  streamers,
  sortBy,
  sortOrder,
  onSearchChange,
  onClearSearch,
  onStreamerFilterChange,
  onSortChange,
}) => {
  return (
    <div className="sticky top-14 z-10 bg-card/95 backdrop-blur-md rounded-2xl border border-border mb-6 p-3 sm:p-3.5 shadow-md select-none">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[240px] max-w-sm">
          <Input
            type="text"
            className="pl-9 pr-8 h-9 bg-background border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Search clips or streamers..."
            value={searchInput}
            onChange={onSearchChange}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
          {searchInput && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Clear filter"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {streamers.length > 0 && (
            <div className="relative">
              <select
                value={streamerFilter}
                onChange={(e) => onStreamerFilterChange(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-background hover:bg-secondary/40 border border-border focus:border-ring rounded-xl text-xs sm:text-sm text-foreground focus:outline-none cursor-pointer transition-colors"
              >
                <option value="">All Streamers</option>
                {streamers.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'upvotes_desc') {
                  onSortChange('upvotes', 'desc');
                } else if (val === 'createdAt_asc') {
                  onSortChange('createdAt', 'asc');
                } else {
                  onSortChange('createdAt', 'desc');
                }
              }}
              className="appearance-none pl-3 pr-8 py-2 bg-background hover:bg-secondary/40 border border-border focus:border-ring rounded-xl text-xs sm:text-sm text-foreground focus:outline-none cursor-pointer transition-colors"
            >
              <option value="createdAt_desc">Upload Date (Desc)</option>
              <option value="createdAt_asc">Upload Date (Asc)</option>
              <option value="upvotes_desc">Most Upvoted</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonFilterBar;
