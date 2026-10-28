'use client';

import React from 'react';
import { SummaryStats, RatingDistribution } from './StatisticsWidgets';
import ActivityTracker from './ActivityTracker';
import { motion } from 'framer-motion';
import { BarChart3, CalendarCheck } from 'lucide-react';
import { User, UserRating, SeasonInfo } from '@/types/adminTypes';
import { Card } from '@/components/ui/card';

interface StatisticsProps {
  clipTeam: User[];
  userRatings: UserRating[];
  seasonInfo: SeasonInfo;
  clipStats?: {
    totalClips: number;
    ratedClips: number;
    unratedClips: number;
    deniedClips: number;
  };
  loading?: boolean;
}

const Statistics: React.FC<StatisticsProps> = ({
  clipTeam,
  userRatings,
  seasonInfo,
  clipStats,
  loading = false,
}) => {
  const SkeletonBox = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-secondary rounded-xl ${className}`} />
  );

  const totalRatings = userRatings.reduce((acc, user) => acc + user.total, 0);
  const averageRatings = userRatings.length > 0 ? totalRatings / userRatings.length : 0;
  const mostActiveUser = [...userRatings].sort((a, b) => b.total - a.total)[0]?.username || 'None';

  const clipTeamUsernames = clipTeam.map((member) => member.username || '').filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full space-y-6"
    >
      {/* Top Banner */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Review Team Analytics
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live submission intake, review quotas, and team performance metrics
            </p>
          </div>
        </div>

        {seasonInfo.season && (
          <div className="flex items-center gap-2 bg-background border border-border px-3.5 py-2 rounded-full self-start sm:self-auto">
            <CalendarCheck className="text-primary size-3.5" />
            <span className="text-xs text-muted-foreground">Active Season:</span>
            <span className="text-xs font-bold text-foreground capitalize">
              {seasonInfo.season} {seasonInfo.year || new Date().getFullYear()}
            </span>
          </div>
        )}
      </Card>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBox key={i} className="h-28" />
            ))}
          </div>
          <SkeletonBox className="h-96" />
          <SkeletonBox className="h-80" />
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          {clipStats && (
            <SummaryStats
              totalRatings={totalRatings}
              averageRatings={averageRatings}
              mostActiveUser={mostActiveUser}
              totalClips={clipStats.totalClips}
              ratedClips={clipStats.ratedClips}
              unratedClips={clipStats.unratedClips}
              deniedClips={clipStats.deniedClips}
            />
          )}

          {/* Rating Distribution (Stacked Bars + Donut) */}
          <RatingDistribution userRatings={userRatings} />

          {/* Timeline Velocity Area Chart */}
          <ActivityTracker clipTeamUsernames={clipTeamUsernames} />
        </>
      )}
    </motion.div>
  );
};

export default Statistics;
