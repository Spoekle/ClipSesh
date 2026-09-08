import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import {
  FaStar,
  FaPercentage,
  FaClipboard,
  FaChartPie,
  FaCheckCircle
} from 'react-icons/fa';
import { User, Rating } from '../../../types/adminTypes';
import { getCurrentSeason } from '../../../utils/seasonHelpers';
import RatedClips from './stats/RatedClips';
import ActivityTracker from './stats/ActivityTracker';

import { useClipsWithRatings } from '../../../hooks/useClips';
import { useCombinedConfig } from '../../../hooks/useConfig';

interface UserRatingData {
  username: string;
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  'deny': number;
  total: number;
}

interface StatsSectionProps {
  user: User;
  viewSwitchTimestamp?: number;
}

const StatsSection: React.FC<StatsSectionProps> = ({ user, viewSwitchTimestamp }) => {
  const { data: clipsData, isLoading: clipsLoading, refetch: refetchClips } = useClipsWithRatings();
  const { data: configData, isLoading: configLoading } = useCombinedConfig(user);

  const clips = clipsData?.clips || [];
  const ratings = clipsData?.ratings || {};
  const clipAmount = configData?.public?.clipAmount || Object.keys(ratings).length;
  const isLoading = clipsLoading || configLoading;

  const [userStats, setUserStats] = useState<UserRatingData | null>(null);

  useEffect(() => {
    if (viewSwitchTimestamp) {
      refetchClips();
    }
  }, [viewSwitchTimestamp, refetchClips]);

  useEffect(() => {
    if (ratings && Object.keys(ratings).length > 0) {
      calculateUserStats(ratings);
    }
  }, [ratings]);

  const calculateUserStats = (ratingsData: Record<string, Rating>) => {
    const stats: UserRatingData = {
      username: user.username,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      'deny': 0,
      total: 0
    };

    Object.values(ratingsData).forEach(rating => {
      if (Array.isArray(rating.ratingCounts)) {
        rating.ratingCounts.forEach(ratingData => {
          if (Array.isArray(ratingData.users)) {
            ratingData.users.forEach(ratingUser => {
              if (ratingUser.username === user.username) {
                const ratingValue = ratingData.rating as keyof UserRatingData;
                if (typeof stats[ratingValue] === 'number') {
                  (stats[ratingValue] as number)++;
                  stats.total++;
                }
              }
            });
          }
        });
      }
    });

    setUserStats(stats);
  };

  if (isLoading) {
    return (
      <div className="bg-[#181818] rounded-2xl border border-[#262626] p-8 text-center shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#262626] border-t-cc-red mx-auto mb-2"></div>
        <p className="text-xs text-[#aaaaaa]">Loading statistics...</p>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="bg-[#181818] rounded-2xl border border-[#262626] p-8 text-center shadow-sm">
        <p className="text-xs text-[#aaaaaa]">No rating data available.</p>
      </div>
    );
  }

  const CHART_COLORS: Record<string, string> = {
    'Tier 4': '#f23030',
    'Tier 3': '#f97316',
    'Tier 2': '#eab308',
    'Tier 1': '#38bdf8',
    'Denied': '#717171'
  };

  const chartData = [
    { name: 'Tier 4', value: userStats['4'], color: CHART_COLORS['Tier 4'] },
    { name: 'Tier 3', value: userStats['3'], color: CHART_COLORS['Tier 3'] },
    { name: 'Tier 2', value: userStats['2'], color: CHART_COLORS['Tier 2'] },
    { name: 'Tier 1', value: userStats['1'], color: CHART_COLORS['Tier 1'] },
    { name: 'Denied', value: userStats['deny'], color: CHART_COLORS['Denied'] },
  ].filter(item => item.value > 0);

  const completionPercentage = clipAmount > 0 ? (userStats.total / clipAmount) * 100 : 0;

  const statCards = [
    {
      title: 'Total Ratings',
      value: userStats.total,
      icon: <FaClipboard className="text-cc-red" size={16} />
    },
    {
      title: 'Progress',
      value: `${completionPercentage.toFixed(1)}%`,
      icon: <FaPercentage className="text-[#22c55e]" size={16} />
    },
    {
      title: 'Most Given',
      value: ['1', '2', '3', '4', 'deny'].reduce((a, b) =>
        (userStats[a as keyof UserRatingData] as number) > (userStats[b as keyof UserRatingData] as number) ? a : b
      ),
      icon: <FaStar className="text-[#eab308]" size={16} />
    },
    {
      title: 'Completion',
      value: completionPercentage >= 100 ? 'Complete' : 'In Progress',
      icon: <FaCheckCircle className="text-[#38bdf8]" size={16} />
    }
  ];

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = userStats.total > 0 ? ((data.value / userStats.total) * 100).toFixed(1) : '0';
      return (
        <div className="bg-[#181818] p-3 rounded-xl border border-[#262626] shadow-xl text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
            <span className="font-semibold text-[#f1f1f1]">{data.name}</span>
          </div>
          <div className="text-[#aaaaaa]">
            <span className="font-bold text-[#f1f1f1]">{data.value}</span> ratings ({percent}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#181818] rounded-2xl border border-[#262626] p-5 shadow-sm">
        <h2 className="text-base font-bold text-[#f1f1f1] mb-1 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-cc-red/15 text-cc-red rounded-xl flex items-center justify-center">
            <FaChartPie size={14} />
          </div>
          <span>Rating Statistics</span>
        </h2>
        <p className="text-xs text-[#717171] pl-10.5">
          Your rating activity for {getCurrentSeason().season}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="rounded-2xl border border-[#262626] p-4 bg-[#181818] hover:border-[#383838] transition-all shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-[#717171] uppercase tracking-wider">
                {stat.title}
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#141414] border border-[#262626] flex items-center justify-center">
                {stat.icon}
              </div>
            </div>
            <div className="text-xl font-bold text-[#f1f1f1]">
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution Chart */}
        {chartData.length > 0 && (
          <div className="bg-[#181818] rounded-2xl border border-[#262626] p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#aaaaaa] mb-4">
              Rating Distribution
            </h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#181818" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Clean Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-[#262626]">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-[#aaaaaa]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                  <span className="text-[#f1f1f1] font-semibold">({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Tracker */}
        <div className="bg-[#181818] rounded-2xl border border-[#262626] p-5 shadow-sm">
          <ActivityTracker viewSwitchTimestamp={viewSwitchTimestamp} />
        </div>
      </div>

      {/* Rated Clips */}
      {clips.length > 0 && Object.keys(ratings).length > 0 && (
        <div className="bg-[#181818] rounded-2xl border border-[#262626] p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-[#f1f1f1]">
            <div className="w-7 h-7 bg-cc-red/15 text-cc-red rounded-xl flex items-center justify-center">
              <FaClipboard size={12} />
            </div>
            <span>Your Rated Clips</span>
          </h2>
          <RatedClips ratingsData={ratings} clipsData={clips} />
        </div>
      )}
    </div>
  );
};

export default StatsSection;
