import React from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { routeCrumbs } from "@/lib/breadcrumbs";
import { cn } from "@/lib/utils";

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
    { value: totalClips.toLocaleString(), label: "Clips saved" },
    { value: totalSeasons.toLocaleString(), label: "Seasons" },
    ...(oldestYear !== undefined
      ? [{ value: String(oldestYear), label: "Archiving since" }]
      : []),
    ...(totalZips > 0
      ? [{ value: totalZips.toLocaleString(), label: "Seasons" }]
      : []),
  ];

  const yearOptions: { label: string; value: number | null }[] = [
    { label: "All", value: null },
    ...availableYears.map((year) => ({ label: String(year), value: year })),
  ];

  return (
    <div className="relative w-full overflow-hidden select-none">
      <div className="relative mx-auto max-w-[1200px] px-4 pt-6 pb-4 sm:px-8">
        <Breadcrumbs
          items={[{ label: routeCrumbs.archive.label }]}
          className="mb-2"
        />

        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div>
            <div className="relative w-fit pb-3">
              <h1 className="text-3xl leading-tight font-bold tracking-tight text-foreground uppercase sm:text-4xl md:text-5xl">
                Archive
              </h1>
              <div className="absolute bottom-0 left-0 h-[2.5px] w-3/5 rounded-full bg-primary" />
            </div>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Every Beat Saber clip ever submitted to ClipSesh, season by
              season. Dig through the history of the community&apos;s best
              moments.
            </p>

            {availableYears.length > 1 && (
              <div className="mt-8 flex items-center gap-3">
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  Jump to
                </span>
                <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full border border-border bg-card p-1">
                  {yearOptions.map(({ label, value }) => {
                    const isActive = selectedYear === value;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          onSelectYear(
                            isActive && value !== null ? null : value,
                          )
                        }
                        aria-pressed={isActive}
                        className={cn(
                          "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                          isActive
                            ? "bg-foreground text-background shadow-sm"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
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
      </div>
    </div>
  );
};

export default ArchiveHero;
