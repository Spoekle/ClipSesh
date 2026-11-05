'use client';

import React from 'react';
import { m } from 'framer-motion';
import { ArrowRight, Film } from 'lucide-react';
import { ArchiveSeasonSection } from '@/types/clipTypes';
import { getSeasonDateRange } from '@/lib/seasonHelpers';
import { cn } from '@/lib/utils';
import { getSeasonTheme } from '../seasonTheme';
import SeasonMosaic from './SeasonMosaic';

interface ArchiveSpotlightProps {
  section: ArchiveSeasonSection;
  onSelect: (section: ArchiveSeasonSection) => void;
}

/** Wide feature card highlighting the most recent season at the top of the archive. */
export const ArchiveSpotlight: React.FC<ArchiveSpotlightProps> = ({ section, onSelect }) => {
  const theme = getSeasonTheme(section.season);
  const dateRange = getSeasonDateRange(section.season, section.year);
  const SeasonIcon = theme.icon;

  return (
    <m.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onClick={() => onSelect(section)}
      className={cn(
        'group relative grid w-full overflow-hidden rounded-3xl border border-border bg-card text-left shadow-lg transition-[border-color,box-shadow] duration-200 select-none focus-visible:outline-2 focus-visible:outline-ring md:grid-cols-5',
        theme.hover
      )}
    >
      <div
        className={cn('pointer-events-none absolute inset-0 bg-linear-to-br via-transparent to-transparent', theme.from)}
      />

      <div className="relative aspect-video overflow-hidden md:col-span-3 md:aspect-auto md:min-h-80">
        <SeasonMosaic
          thumbnails={section.previewThumbnails}
          fallbackImage={theme.image}
          alt={`${section.season} ${section.year} preview`}
        />
        <div className="absolute inset-0 bg-linear-to-t from-card via-transparent to-transparent md:bg-linear-to-r md:from-transparent md:via-transparent md:to-card" />
      </div>

      <div className="relative flex flex-col justify-center gap-5 p-6 md:col-span-2 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
            {section.isCurrent ? 'Happening now' : 'Latest season'}
          </span>
          <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', theme.chip)}>
            <SeasonIcon className="size-3" />
            {section.season}
          </span>
        </div>

        <div>
          <h2 className="text-4xl leading-none font-black tracking-tight text-foreground sm:text-5xl">
            {section.season}
            <span className="ml-3 font-mono text-2xl font-bold text-muted-foreground sm:text-3xl">{section.year}</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{dateRange.fullFormatted}</p>
        </div>

        <div className="flex w-fit items-center gap-3 rounded-2xl border border-border bg-background/60 px-4 py-3 backdrop-blur-sm">
          <Film className="size-5 text-primary" />
          <div>
            <div className="text-xl font-bold text-foreground tabular-nums">{section.clipCount.toLocaleString()}</div>
            <div className="text-[11px] text-muted-foreground">Clips</div>
          </div>
        </div>

        {section.topStreamers.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Featuring{' '}
            {section.topStreamers.map((streamer, i) => (
              <React.Fragment key={streamer}>
                {i > 0 && (i === section.topStreamers.length - 1 ? ' & ' : ', ')}
                <span className="font-semibold text-foreground">{streamer}</span>
              </React.Fragment>
            ))}
          </p>
        )}

        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-primary-hover">
          Explore season
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </m.button>
  );
};

export default ArchiveSpotlight;
