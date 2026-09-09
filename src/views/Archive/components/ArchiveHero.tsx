import React from 'react';
import { NavLink } from '@/lib/routerCompat';

interface ArchiveHeroProps {
  totalClips: number;
  totalSeasons: number;
  totalZips: number;
  availableYears: number[];
  selectedYear: number | null;
  onSelectYear: (year: number | null) => void;
}

const ArchiveHero: React.FC<ArchiveHeroProps> = ({
  totalClips,
  totalSeasons,
  availableYears,
  selectedYear,
  onSelectYear,
}) => {
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
          <span className="text-white font-medium">The ClipVault</span>
        </nav>

        {/* Title row with signature CC Red Underline */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="relative pb-3 w-fit">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                 THE <span className="text-cc-red">CLIP</span>VAULT
              </h1>
              {/* CC Red Bar: width 60%, height 2.5px */}
              <div className="absolute bottom-0 left-0 w-3/5 h-[2.5px] bg-[#f23030] rounded-full" />
            </div>
            <p className="mt-3 text-sm sm:text-base text-[#b3b3b3] leading-relaxed max-w-xl">
              Explore ALL Beat Saber clips uploaded to ClipSesh right here, right now.
            </p>
          </div>

          {/* Seasons count & total clips badge */}
          <div className="flex items-center gap-2.5 pb-1 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-[6px] bg-[#181818] border border-[#2a2a2a] text-[#e6e6e6]">
              {totalSeasons} Seasons
            </span>
            <span className="text-xs font-medium px-3 py-1 rounded-sm bg-[#f23030]/10 border border-[#f23030]/25 text-[#f23030]">
              {totalClips.toLocaleString()} clips saved
            </span>
          </div>
        </div>

        {/* Year Filter Chips */}
        {availableYears.length > 1 && (
          <div className="mt-5 pt-4 border-t border-[#222222] flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs text-[#717171] font-medium mr-1 shrink-0">Filter by Year:</span>
            <button
              onClick={() => onSelectYear(null)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedYear === null
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'bg-[#181818] hover:bg-[#222222] text-[#aaaaaa] hover:text-[#f1f1f1] border border-[#2e2e2e]'
              }`}
            >
              All Years
            </button>
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => onSelectYear(year === selectedYear ? null : year)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  selectedYear === year
                    ? 'bg-white text-black font-semibold shadow-xs'
                    : 'bg-[#181818] hover:bg-[#222222] text-[#aaaaaa] hover:text-[#f1f1f1] border border-[#2e2e2e]'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveHero;
