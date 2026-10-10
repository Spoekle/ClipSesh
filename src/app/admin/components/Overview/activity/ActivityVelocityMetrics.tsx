'use client';

import React from 'react';

interface ActivityVelocityMetricsProps {
  totalActivity: number;
  activeUserCount: number;
  peakDateFormatted: string;
  dailyVelocity: number;
}

export const ActivityVelocityMetrics: React.FC<ActivityVelocityMetricsProps> = ({
  totalActivity,
  activeUserCount,
  peakDateFormatted,
  dailyVelocity,
}) => {
  return (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 select-none">
      <div className="bg-cc-ground p-3 rounded-xl border border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Total Ratings</span>
        <span className="text-sm font-bold text-white">{totalActivity}</span>
      </div>
      <div className="bg-cc-ground p-3 rounded-xl border border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Active Reviewers</span>
        <span className="text-sm font-bold text-white">{activeUserCount}</span>
      </div>
      <div className="bg-cc-ground p-3 rounded-xl border border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Peak Review Day</span>
        <span className="text-sm font-bold text-primary">{peakDateFormatted}</span>
      </div>
      <div className="bg-cc-ground p-3 rounded-xl border border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Daily Velocity</span>
        <span className="text-sm font-bold text-emerald-400">
          ~{dailyVelocity} / day
        </span>
      </div>
    </div>
  );
};

export default ActivityVelocityMetrics;
