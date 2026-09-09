import React from 'react';
import { NavLink } from '@/lib/routerCompat';

type Season = 'Winter' | 'Spring' | 'Summer' | 'Fall';

interface ClipViewerHeaderProps {
  season: Season;
  totalClips?: number;
  isFiltered?: boolean;
}

const ClipViewerHeader: React.FC<ClipViewerHeaderProps> = ({ season, totalClips, isFiltered }) => {

  return (
    <div className="relative w-full overflow-hidden select-none">
      {/* CC Page Header Container (1200px centered) */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-6 pb-4">
        {/* Breadcrumbs (matching CC default.vue) */}
        <nav className="flex items-center gap-1.5 text-sm text-[#b3b3b3] mb-2">
          <NavLink to="/" className="hover:text-white transition-colors">
            Home
          </NavLink>
          <span className="text-[#626262] select-none">/</span>
          <span className="text-white font-medium">Clips</span>
        </nav>

        {/* Title row with signature CC Red Underline */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="relative pb-3 w-fit">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                CLIPS
              </h1>
              {/* CC Red Bar: width 60%, height 2.5px */}
              <div className="absolute bottom-0 left-0 w-3/5 h-[2.5px] bg-[#f23030] rounded-full" />
            </div>
            <p className="mt-3 text-sm sm:text-base text-[#b3b3b3] leading-relaxed max-w-xl">
              Discover, watch, and rate the best Beat Saber highlights from across the community.
            </p>
          </div>

          {/* Season badge & clips counter */}
          <div className="flex items-center gap-2.5 pb-1">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-[6px] bg-[#181818] border border-[#2a2a2a] text-[#e6e6e6]">
              {season} Season
            </span>
            {totalClips !== undefined && (
              <span className="text-xs font-medium px-3 py-1 rounded-sm bg-[#f23030]/10 border border-[#f23030]/25 text-[#f23030]">
                {totalClips.toLocaleString()} {isFiltered ? 'found' : 'available'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClipViewerHeader;
