'use client';

import React from 'react';
import { FaLayerGroup, FaCheckCircle, FaUsers, FaFlag } from 'react-icons/fa';

interface ExecutiveSummaryStripProps {
  clipAmount: number;
  reviewedPercent: number;
  ratedClipsCount: number;
  reviewTeamCount: number;
  pendingReportsCount: number;
}

export const ExecutiveSummaryStrip: React.FC<ExecutiveSummaryStripProps> = ({
  clipAmount,
  reviewedPercent,
  ratedClipsCount,
  reviewTeamCount,
  pendingReportsCount,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="bg-cc-card border border-border rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
          <FaLayerGroup size={14} />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] text-muted-foreground block truncate">Clip Pool</span>
          <span className="text-sm sm:text-base font-bold text-white">
            {clipAmount} <span className="text-[11px] font-normal text-muted-foreground">clips</span>
          </span>
        </div>
      </div>

      <div className="bg-cc-card border border-border rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
          <FaCheckCircle size={14} />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] text-muted-foreground block truncate">Review Progress</span>
          <span className="text-sm sm:text-base font-bold text-white">
            {reviewedPercent}% <span className="text-[11px] font-normal text-muted-foreground">({ratedClipsCount})</span>
          </span>
        </div>
      </div>

      <div className="bg-cc-card border border-border rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
          <FaUsers size={14} />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] text-muted-foreground block truncate">Review Team</span>
          <span className="text-sm sm:text-base font-bold text-white">
            {reviewTeamCount} <span className="text-[11px] font-normal text-muted-foreground">staff</span>
          </span>
        </div>
      </div>

      <div className="bg-cc-card border border-border rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <FaFlag size={14} />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] text-muted-foreground block truncate">Open Reports</span>
          <span className="text-sm sm:text-base font-bold text-white">
            {pendingReportsCount} <span className="text-[11px] font-normal text-muted-foreground">pending</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummaryStrip;
