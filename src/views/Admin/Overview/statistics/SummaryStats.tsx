import React from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaUserCheck, FaCheckCircle, FaVideo, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';

interface SummaryStatsProps {
  totalRatings: number;
  averageRatings: number;
  mostActiveUser: string;
  totalClips: number;
  ratedClips: number;
  unratedClips: number;
  deniedClips: number;
}

const SummaryStats: React.FC<SummaryStatsProps> = ({
  totalRatings,
  averageRatings,
  mostActiveUser,
  totalClips,
  ratedClips,
  unratedClips,
  deniedClips
}) => {
  const completionRate = totalClips > 0 ? ((ratedClips / totalClips) * 100).toFixed(1) : '0';

  const primaryStats = [
    {
      label: 'Total Submissions',
      value: totalClips.toLocaleString(),
      subtext: 'Current season pool',
      icon: FaVideo,
      iconColor: 'text-sky-400',
      badge: `${totalClips} clips`
    },
    {
      label: 'Reviewed Clips',
      value: ratedClips.toLocaleString(),
      subtext: `${completionRate}% reviewed`,
      icon: FaCheckCircle,
      iconColor: 'text-emerald-400',
      badge: `${completionRate}%`
    },
    {
      label: 'Unrated Queue',
      value: unratedClips.toLocaleString(),
      subtext: 'Awaiting team review',
      icon: FaHourglassHalf,
      iconColor: 'text-amber-400',
      badge: `${unratedClips} left`
    },
    {
      label: 'Denied Clips',
      value: deniedClips.toLocaleString(),
      subtext: 'Threshold met',
      icon: FaTimesCircle,
      iconColor: 'text-rose-400',
      badge: `${deniedClips} denied`
    }
  ];

  const secondaryStats = [
    {
      label: 'Total Team Ratings',
      value: totalRatings.toLocaleString(),
      subtext: 'Cumulative votes cast',
      icon: FaStar,
      iconColor: 'text-[#f23030]'
    },
    {
      label: 'Avg Ratings / Member',
      value: Math.round(averageRatings).toLocaleString(),
      subtext: 'Reviewer average',
      icon: FaUserCheck,
      iconColor: 'text-emerald-400'
    },
    {
      label: 'Top Reviewer',
      value: mostActiveUser,
      subtext: 'Highest contributions',
      icon: FaStar,
      iconColor: 'text-amber-400'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Primary Pipeline Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {primaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              className="bg-[#181818] p-4 rounded-xl border border-[#262626] shadow-sm hover:border-[#383838] transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#2e2e2e] flex items-center justify-center shrink-0">
                  <Icon className={stat.iconColor} size={15} />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-[11px] text-[#717171] mt-1 flex items-center gap-1.5">
                  <span>{stat.subtext}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Reviewer Engagement Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {secondaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              className="bg-[#181818] p-4 rounded-xl border border-[#262626] shadow-sm hover:border-[#383838] transition-all flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider block mb-1">
                  {stat.label}
                </span>
                <div className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                  {stat.value}
                </div>
                <span className="text-[11px] text-[#717171] block mt-0.5">
                  {stat.subtext}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#222222] border border-[#2e2e2e] flex items-center justify-center shrink-0">
                <Icon className={stat.iconColor} size={18} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SummaryStats;
