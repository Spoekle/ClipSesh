'use client';

import React from 'react';
import { m } from 'framer-motion';
import { ArchiveSeasonSection } from '@/types/clipTypes';
import { cn } from '@/lib/utils';
import { getSeasonTheme } from '../seasonTheme';
import SeasonSectionCard from './SeasonSectionCard';

interface ArchiveTimelineProps {
  sections: ArchiveSeasonSection[];
  onSelect: (section: ArchiveSeasonSection) => void;
}

/** Sections grouped by year along a vertical rail, newest year first. */
export const ArchiveTimeline: React.FC<ArchiveTimelineProps> = ({ sections, onSelect }) => {
  const years: { year: number; sections: ArchiveSeasonSection[] }[] = [];
  for (const section of sections) {
    const group = years.find((g) => g.year === section.year);
    if (group) group.sections.push(section);
    else years.push({ year: section.year, sections: [section] });
  }

  return (
    <div className="relative">
      <div className="absolute top-3 bottom-0 left-[7px] w-px bg-linear-to-b from-border via-border to-transparent md:left-[9.5rem]" />

      <div className="flex flex-col gap-14">
        {years.map(({ year, sections: yearSections }) => {
          const clipCount = yearSections.reduce((acc, s) => acc + s.clipCount, 0);

          return (
            <section key={year} className="relative grid gap-6 md:grid-cols-[9.5rem_1fr]">
              <header className="relative pl-8 md:pl-0">
                <div className="md:sticky md:top-24 md:pr-8 md:text-right">
                  <span className="absolute top-2.5 left-0 size-[15px] rounded-full border-4 border-background bg-primary ring-1 ring-primary/50 md:top-3.5 md:right-[-7.5px] md:left-auto" />
                  <h2 className="font-mono text-4xl leading-none font-black tracking-tighter text-transparent [-webkit-text-stroke:1.5px_var(--muted-foreground)] md:text-5xl">
                    {year}
                  </h2>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {yearSections.length} {yearSections.length === 1 ? 'season' : 'seasons'} ·{' '}
                    {clipCount.toLocaleString()} clips
                  </p>
                  <div className="mt-3 flex gap-1 md:justify-end">
                    {yearSections.map((s) => (
                      <span
                        key={s.season}
                        title={s.season}
                        className={cn('h-1 w-5 rounded-full', getSeasonTheme(s.season).solid)}
                      />
                    ))}
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 gap-5 pl-8 sm:grid-cols-2 md:pl-8 xl:grid-cols-3">
                {yearSections.map((section, i) => (
                  <m.div
                    key={`${section.season}-${section.year}`}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <SeasonSectionCard section={section} onSelect={onSelect} />
                  </m.div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default ArchiveTimeline;
