import React from 'react';
import { Archive } from 'lucide-react';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { routeCrumbs } from '@/lib/breadcrumbs';
import { cn } from '@/lib/utils';

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
  totalZips,
  availableYears,
  selectedYear,
  onSelectYear,
}) => {
  const oldestYear = availableYears.at(-1);

  const stats = [
    { value: totalClips.toLocaleString(), label: 'Clips saved' },
    { value: totalSeasons.toLocaleString(), label: 'Seasons' },
    ...(oldestYear !== undefined ? [{ value: String(oldestYear), label: 'Archiving since' }] : []),
    ...(totalZips > 0 ? [{ value: totalZips.toLocaleString(), label: 'Highlight packages' }] : []),
  ];

  const yearOptions: { label: string; value: number | null }[] = [
    { label: 'All', value: null },
    ...availableYears.map((year) => ({ label: String(year), value: year })),
  ];

  return (
    <div className="relative w-full overflow-hidden select-none">
      <div className="pointer-events-none absolute -top-40 -left-40 size-[32rem] rounded-full bg-primary/15 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[48px_48px] opacity-40 mask-[radial-gradient(ellipse_at_top_left,black_10%,transparent_65%)]" />

      <div className="relative mx-auto max-w-[1200px] px-4 pt-6 pb-8 sm:px-8">
        <Breadcrumbs items={[{ label: routeCrumbs.archive.label }]} className="mb-6" />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
              <Archive className="size-3" />
              Seasonal archive
            </span>
            <h1 className="mt-4 text-5xl leading-[0.95] font-black tracking-tight text-foreground sm:text-6xl md:text-7xl">
              THE <span className="text-primary">CLIP</span>
              <br className="sm:hidden" />
              VAULT
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Every Beat Saber clip ever submitted to ClipSesh, season by season. Dig through the history of the
              community&apos;s best moments.
            </p>
          </div>

          <dl className="flex flex-wrap gap-px overflow-hidden rounded-2xl border border-border bg-border">
            {stats.map(({ value, label }) => (
              <div key={label} className="grow basis-28 bg-card/90 px-5 py-4 backdrop-blur-sm">
                <dd className="text-2xl font-bold text-foreground tabular-nums">{value}</dd>
                <dt className="mt-0.5 text-[11px] whitespace-nowrap text-muted-foreground">{label}</dt>
              </div>
            ))}
          </dl>
        </div>

        {availableYears.length > 1 && (
          <div className="mt-10 flex items-center gap-3">
            <span className="shrink-0 text-xs font-medium text-muted-foreground">Jump to</span>
            <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full border border-border bg-card p-1">
              {yearOptions.map(({ label, value }) => {
                const isActive = selectedYear === value;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onSelectYear(isActive && value !== null ? null : value)}
                    aria-pressed={isActive}
                    className={cn(
                      'shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
                      isActive
                        ? 'bg-foreground text-background shadow-sm'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveHero;
