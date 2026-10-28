'use client';

import React from 'react';
import { ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortControlsProps {
  sortField: string;
  sortDirection: string;
  isTeamMember: boolean;
  onSortFieldChange: (field: string) => void;
  onSortDirectionChange: (direction: string) => void;
}

export const SortControls: React.FC<SortControlsProps> = ({
  sortField,
  sortDirection,
  isTeamMember,
  onSortFieldChange,
  onSortDirectionChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Sort Criteria Dropdown */}
      <div className="relative">
        <select
          value={sortField}
          onChange={(e) => onSortFieldChange(e.target.value)}
          className="appearance-none pl-3 pr-8 py-2 bg-background hover:bg-secondary/40 border border-border focus:border-ring rounded-xl text-xs sm:text-sm text-foreground focus:outline-none cursor-pointer transition-colors"
          aria-label="Sort criteria"
        >
          <option value="createdAt">Upload Date</option>
          <option value="views">Views</option>
          <option value="upvotes">Upvotes</option>
          <option value="downvotes">Downvotes</option>
          {isTeamMember && (
            <>
              <option value="averageRating">Average Rating</option>
              <option value="ratingCount">Rating Count</option>
              <option value="denyCount">Deny Count</option>
            </>
          )}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none size-3" />
      </div>

      {/* Sort Direction Toggle Button Group */}
      <div
        className="flex items-center border border-border rounded-xl p-0.5 bg-background shrink-0"
        role="group"
        aria-label="Sort direction"
      >
        <button
          type="button"
          onClick={() => onSortDirectionChange('desc')}
          className={`px-2.5 py-1.5 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            sortDirection === 'desc'
              ? 'bg-secondary text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Sort Descending (Highest/Newest first)"
        >
          <ArrowDown className="size-3" />
          <span>Desc</span>
        </button>
        <button
          type="button"
          onClick={() => onSortDirectionChange('asc')}
          className={`px-2.5 py-1.5 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            sortDirection === 'asc'
              ? 'bg-secondary text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Sort Ascending (Lowest/Oldest first)"
        >
          <ArrowUp className="size-3" />
          <span>Asc</span>
        </button>
      </div>
    </div>
  );
};

export default SortControls;
