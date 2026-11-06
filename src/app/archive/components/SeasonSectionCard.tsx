'use client';

import React from 'react';
import { ArrowUpRight, Film } from 'lucide-react';
import { ArchiveSeasonSection } from '@/types/clipTypes';
import { getSeasonDateRange } from '@/lib/seasonHelpers';
import { cn } from '@/lib/utils';
import { getSeasonTheme } from '../seasonTheme';
import SeasonMosaic from './SeasonMosaic';

interface SeasonSectionCardProps {
  section: ArchiveSeasonSection;
  onSelect: (section: ArchiveSeasonSection) => void;
}

export const SeasonSectionCard: React.FC<SeasonSectionCardProps> = ({ section, onSelect }) => {
  const theme = getSeasonTheme(section.season);
  const dateRange = getSeasonDateRange(section.season, section.year);

  return (
    <button
      type="button"
      onClick={() => onSelect(section)}
      className={cn(
        'group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-md transition-[border-color,box-shadow] duration-200 select-none focus-visible:outline-2 focus-visible:outline-ring',
        theme.hover
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <SeasonMosaic
          thumbnails={section.previewThumbnails}
          fallbackImage={theme.image}
          alt={`${section.season} ${section.year} preview`}
        />
        <div className={cn('absolute inset-0 bg-linear-to-t via-transparent to-transparent opacity-80', theme.from)} />
        <div className="absolute inset-0 bg-linear-to-t from-card via-card/20 to-black/30" />

        <div className="absolute bottom-2 left-4 right-4 flex items-end justify-between gap-2">
          <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-md">
            {section.season} <span className="font-mono text-lg font-bold text-white/70">{section.year}</span>
          </h3>
          <ArrowUpRight className="mb-1.5 size-5 text-white/50 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pt-2 pb-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {dateRange.shortFormatted}
          </p>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Film className="size-3.5 text-primary" />
            <span className="font-bold text-foreground tabular-nums">{section.clipCount.toLocaleString()}</span>
            clips
          </span>
        </div>

        {section.topStreamers.length > 0 && (
          <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Top</span>
            {section.topStreamers.map((streamer) => (
              <span
                key={streamer}
                className="max-w-[9rem] truncate rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground"
              >
                {streamer}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
};

export default SeasonSectionCard;
