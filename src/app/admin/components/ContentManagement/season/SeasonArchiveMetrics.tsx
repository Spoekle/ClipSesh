'use client';

import React from 'react';
import { FaCalendarAlt, FaFilm, FaBoxOpen, FaHdd } from 'react-icons/fa';

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
      <div className="p-3.5 rounded-xl bg-cc-ground border border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-cc-card border border-border flex items-center justify-center text-primary shrink-0">
          <FaCalendarAlt size={14} />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
            Active Season
          </span>
          <span className="text-xs font-bold text-white truncate block">
            {currentSeasonLabel}
          </span>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-cc-ground border border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-cc-card border border-border flex items-center justify-center text-amber-400 shrink-0">
          <FaFilm size={14} />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
            Active Pool
          </span>
          <span className="text-xs font-bold text-white truncate block">
            {activeClips} clips ready
          </span>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-cc-ground border border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-cc-card border border-border flex items-center justify-center text-sky-400 shrink-0">
          <FaBoxOpen size={14} />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
            ZIP Packages
          </span>
          <span className="text-xs font-bold text-white truncate block">
            {packagesCount} compiled
          </span>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-cc-ground border border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-cc-card border border-border flex items-center justify-center text-emerald-400 shrink-0">
          <FaHdd size={14} />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
            Total Archive Size
          </span>
          <span className="text-xs font-bold text-white truncate block">
            {totalZipSizeFormatted}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SeasonArchiveMetrics;
