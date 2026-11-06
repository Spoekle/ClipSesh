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
  const items = [
    { label: 'ratings', value: totalActivity.toLocaleString() },
    { label: 'active reviewers', value: activeUserCount.toLocaleString() },
    { label: 'per day', value: `~${dailyVelocity}` },
    { label: 'peak', value: peakDateFormatted },
  ];

  return (
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground select-none">
      {items.map((item) => (
        <span key={item.label}>
          <span className="font-bold text-foreground tabular-nums">{item.value}</span> {item.label}
        </span>
      ))}
    </div>
  );
};

export default ActivityVelocityMetrics;
