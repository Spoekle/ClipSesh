import React from 'react';
import Link from 'next/link';

export type Season = 'Winter' | 'Spring' | 'Summer' | 'Fall';

export interface ClipViewerHeaderProps {
  season: Season;
  totalClips?: number;
  isFiltered?: boolean;
}

export const ClipViewerHeader: React.FC<ClipViewerHeaderProps> = ({
  season,
  totalClips,
  isFiltered,
}) => {
  return (
    <div className="relative w-full overflow-hidden select-none">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-6 pb-4">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span className="text-muted-foreground/60 select-none">/</span>
          <span className="text-foreground font-medium">Clips</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="relative pb-3 w-fit">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
                CLIPS
              </h1>
              <div className="absolute bottom-0 left-0 w-3/5 h-[2.5px] bg-cc-red rounded-full" />
            </div>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              Discover, watch, and rate the best Beat Saber highlights from across the community.
            </p>
          </div>

          <div className="flex items-center gap-2.5 pb-1">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-cc-card border border-border text-foreground">
              {season} Season
            </span>
            {totalClips !== undefined && (
              <span className="text-xs font-medium px-3 py-1 rounded-sm bg-cc-red/10 border border-cc-red/25 text-cc-red">
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
