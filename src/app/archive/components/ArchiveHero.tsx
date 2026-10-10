import React from 'react';
import Link from 'next/link';

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
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span className="text-muted-foreground/50 select-none">/</span>
          <span className="text-foreground font-medium">The ClipVault</span>
        </nav>

        {/* Title row with signature CC Red Underline */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="relative pb-3 w-fit">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
                 THE <span className="text-cc-red">CLIP</span>VAULT
              </h1>
              {/* CC Red Bar */}
              <div className="absolute bottom-0 left-0 w-3/5 h-[2.5px] bg-cc-red rounded-full" />
            </div>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              Explore ALL Beat Saber clips uploaded to ClipSesh right here, right now.
            </p>
          </div>

          {/* Seasons count & total clips badge */}
          <div className="flex items-center gap-2.5 pb-1 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-cc-card border border-border text-foreground">
              {totalSeasons} Seasons
            </span>
            <span className="text-xs font-medium px-3 py-1 rounded-sm bg-cc-red/10 border border-cc-red/25 text-cc-red">
              {totalClips.toLocaleString()} clips saved
            </span>
          </div>
        </div>

        {/* Year Filter Chips */}
        {availableYears.length > 1 && (
          <div className="mt-5 pt-4 border-t border-border flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs text-muted-foreground font-medium mr-1 shrink-0">Filter by Year:</span>
            <button
              onClick={() => onSelectYear(null)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                selectedYear === null
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'bg-cc-card hover:bg-secondary text-cc-muted hover:text-white border border-border'
              }`}
            >
              All Years
            </button>
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => onSelectYear(year === selectedYear ? null : year)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                  selectedYear === year
                    ? 'bg-white text-black font-semibold shadow-xs'
                    : 'bg-cc-card hover:bg-secondary text-cc-muted hover:text-white border border-border'
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
