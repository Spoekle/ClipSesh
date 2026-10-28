'use client';

import React from 'react';
import {
  Star,
  UserCheck,
  XCircle,
  Hourglass,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SummaryStatsProps {
  totalRatings: number;
  averageRatings: number;
  mostActiveUser: string;
  totalClips: number;
  ratedClips: number;
  unratedClips: number;
  deniedClips: number;
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({
  totalRatings,
  averageRatings,
  unratedClips,
  deniedClips,
}) => {
  const primaryStats = [
    {
      label: 'Unrated Queue',
      value: unratedClips.toLocaleString(),
      subtext: 'Awaiting review',
      icon: Hourglass,
      iconColor: 'text-amber-400',
    },
    {
      label: 'Denied Clips',
      value: deniedClips.toLocaleString(),
      subtext: 'Threshold met',
      icon: XCircle,
      iconColor: 'text-rose-400',
    },
    {
      label: 'Total Team Ratings',
      value: totalRatings.toLocaleString(),
      subtext: 'Total votes cast',
      icon: Star,
      iconColor: 'text-primary',
    },
    {
      label: 'Avg Ratings / Member',
      value: Math.round(averageRatings).toLocaleString(),
      subtext: 'Clip Team average',
      icon: UserCheck,
      iconColor: 'text-emerald-400',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {primaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="p-4 bg-card border-border shadow-xs hover:border-border/80 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                  <Icon className={`size-4 ${stat.iconColor}`} />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {stat.value}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                  <span>{stat.subtext}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SummaryStats;
