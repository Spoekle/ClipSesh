'use client';

import React from 'react';
import { RatingDistribution } from './RatingDistribution';
import ActivityTracker from './ActivityTracker';
import { User, UserRating } from '@/types/adminTypes';
import AdminSection from '../AdminSection';

interface StatisticsProps {
  clipTeam: User[];
  userRatings: UserRating[];
  clipStats: {
    totalClips: number;
    ratedClips: number;
    unratedClips: number;
    deniedClips: number;
  };
  pendingReportsCount: number;
  loading?: boolean;
}

const Statistics: React.FC<StatisticsProps> = ({
  clipTeam,
  userRatings,
  clipStats,
  pendingReportsCount,
  loading = false,
}) => {
  const totalRatings = userRatings.reduce((acc, user) => acc + user.total, 0);
  const reviewedPercent = clipStats.totalClips > 0
    ? Math.round((clipStats.ratedClips / clipStats.totalClips) * 100)
    : 0;

  const stats = [
    { label: 'Clips in pool', value: clipStats.totalClips.toLocaleString() },
    { label: 'Reviewed', value: `${reviewedPercent}%` },
    { label: 'Awaiting review', value: clipStats.unratedClips.toLocaleString() },
    { label: 'Denied', value: clipStats.deniedClips.toLocaleString() },
    { label: 'Ratings cast', value: totalRatings.toLocaleString() },
    { label: 'Open reports', value: pendingReportsCount.toLocaleString() },
  ];

  const clipTeamUsernames = clipTeam.map((member) => member.username).filter(Boolean);

  return (
    <AdminSection title="Overview" description="How the current season's review is going.">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card px-4 py-4">
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded-md bg-secondary" />
            ) : (
              <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{stat.value}</div>
            )}
            <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="h-96 animate-pulse rounded-2xl bg-secondary" />
      ) : (
        <RatingDistribution userRatings={userRatings} />
      )}

      <ActivityTracker clipTeamUsernames={clipTeamUsernames} />
    </AdminSection>
  );
};

export default Statistics;
