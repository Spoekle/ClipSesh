import React, { useState } from 'react';
import SummaryStats from './statistics/SummaryStats';
import RatingDistribution from './statistics/RatingDistribution';
import IndividualPerformance from './statistics/IndividualPerformance';
import ComparisonChart from './statistics/ComparisonChart';
import ActivityTracker from './statistics/ActivityTracker';
import { motion } from 'framer-motion';
import { FaChartBar, FaCalendarCheck } from 'react-icons/fa';
import { UserRating, SeasonInfo } from '../../../types/adminTypes';

interface User {
  _id: string;
  username: string;
  roles: string[];
  [key: string]: any;
}

interface StatisticsProps {
  clipTeam: User[];
  userRatings: UserRating[];
  seasonInfo: SeasonInfo;
  adminStats?: any;
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
  loading = false
}) => {
  const [sortBy, setSortBy] = useState<'username' | 'rating' | 'percentage' | 'tier4' | 'deny'>('rating');

  const SkeletonBox = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-[#222222] rounded-xl ${className}`} />
  );

  const totalRatings = userRatings.reduce((acc, user) => acc + user.total, 0);
  const averageRatings = userRatings.length > 0 ? totalRatings / userRatings.length : 0;
  const mostActiveUser = [...userRatings].sort((a, b) => b.total - a.total)[0]?.username || 'None';

  const sortedUsers = [...userRatings].sort((a, b) => {
    if (sortBy === 'username') {
      return a.username.localeCompare(b.username);
    } else if (sortBy === 'rating') {
      return b.total - a.total;
    } else if (sortBy === 'percentage') {
      return b.percentageRated - a.percentageRated;
    }
    return 0;
  });

  const clipTeamUsernames = clipTeam.map(member => member.username || '').filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full space-y-6"
    >
      {/* Top Banner */}
      <div className="bg-[#181818] p-5 sm:p-6 rounded-xl border border-[#262626] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#222222] border border-[#2e2e2e] flex items-center justify-center text-[#f23030]">
            <FaChartBar size={18} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#f1f1f1] tracking-tight">
              Review Team Analytics
            </h2>
            <p className="text-xs text-[#aaaaaa] mt-0.5">
              Live submission intake, review quotas, and team performance metrics
            </p>
          </div>
        </div>

        {seasonInfo.season && (
          <div className="flex items-center gap-2 bg-[#141414] border border-[#262626] px-3.5 py-2 rounded-full self-start sm:self-auto">
            <FaCalendarCheck className="text-[#f23030]" size={13} />
            <span className="text-xs text-[#aaaaaa]">Active Season:</span>
            <span className="text-xs font-bold text-white capitalize">
              {seasonInfo.season} {seasonInfo.year || new Date().getFullYear()}
            </span>
          </div>
        )}
      </div>

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
          <RatingDistribution
            userRatings={userRatings}
            sortBy={sortBy}
            setSortBy={setSortBy as React.Dispatch<React.SetStateAction<string>>}
          />

          {/* Quota & Progress Comparison Bar Chart */}
          <ComparisonChart
            sortedUsers={sortedUsers}
            seasonInfo={seasonInfo}
            totalRatings={totalRatings}
          />

          {/* Timeline Velocity Area Chart */}
          <ActivityTracker clipTeamUsernames={clipTeamUsernames} />

          {/* Individual Member Roster & Performance */}
          <IndividualPerformance
            sortedUsers={sortedUsers}
            seasonInfo={seasonInfo}
          />
        </>
      )}
    </motion.div>
  );
};

export default Statistics;
