'use client';

import React from 'react';
import { FaChevronDown, FaArrowUp, FaArrowDown } from 'react-icons/fa';

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
          className="appearance-none pl-3 pr-8 py-2 bg-cc-ground hover:bg-white/5 border border-border focus:border-border/80 rounded-xl text-xs sm:text-sm text-foreground focus:outline-none cursor-pointer transition-colors"
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
        <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-[10px]" />
      </div>

      {/* Sort Direction Toggle Button Group */}
      <div
        className="flex items-center border border-border rounded-xl p-0.5 bg-cc-ground shrink-0"
        role="group"
        aria-label="Sort direction"
      >
        <button
          type="button"
          onClick={() => onSortDirectionChange('desc')}
          className={`px-2.5 py-1.5 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            sortDirection === 'desc'
              ? 'bg-white/10 text-white shadow-xs'
              : 'text-muted-foreground hover:text-white'
          }`}
          title="Sort Descending (Highest/Newest first)"
        >
          <FaArrowDown size={10} />
          <span>Desc</span>
        </button>
        <button
          type="button"
          onClick={() => onSortDirectionChange('asc')}
          className={`px-2.5 py-1.5 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            sortDirection === 'asc'
              ? 'bg-white/10 text-white shadow-xs'
              : 'text-muted-foreground hover:text-white'
          }`}
          title="Sort Ascending (Lowest/Oldest first)"
        >
          <FaArrowUp size={10} />
          <span>Asc</span>
        </button>
      </div>
    </div>
  );
};

export default SortControls;
