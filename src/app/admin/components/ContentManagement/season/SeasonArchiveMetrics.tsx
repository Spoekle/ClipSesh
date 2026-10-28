'use client';

import React from 'react';
import { Calendar, Film, Package, HardDrive } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SeasonArchiveMetricsProps {
  currentSeasonLabel: string;
  activeClips: number;
  packagesCount: number;
  totalZipSizeFormatted: string;
}

export const SeasonArchiveMetrics: React.FC<SeasonArchiveMetricsProps> = ({
  currentSeasonLabel,
  activeClips,
  packagesCount,
  totalZipSizeFormatted,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 select-none">
      <Card className="p-3.5 rounded-xl bg-background border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-primary shrink-0">
          <Calendar className="size-3.5" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
            Active Season
          </span>
          <span className="text-xs font-bold text-foreground truncate block">
            {currentSeasonLabel}
          </span>
        </div>
      </Card>

      <Card className="p-3.5 rounded-xl bg-background border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-amber-400 shrink-0">
          <Film className="size-3.5" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
            Active Pool
          </span>
          <span className="text-xs font-bold text-foreground truncate block">
            {activeClips} clips ready
          </span>
        </div>
      </Card>

      <Card className="p-3.5 rounded-xl bg-background border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-sky-400 shrink-0">
          <Package className="size-3.5" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
            ZIP Packages
          </span>
          <span className="text-xs font-bold text-foreground truncate block">
            {packagesCount} compiled
          </span>
        </div>
      </Card>

      <Card className="p-3.5 rounded-xl bg-background border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-emerald-400 shrink-0">
          <HardDrive className="size-3.5" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
            Total Archive Size
          </span>
          <span className="text-xs font-bold text-foreground truncate block">
            {totalZipSizeFormatted}
          </span>
        </div>
      </Card>
    </div>
  );
};

export default SeasonArchiveMetrics;
