import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { FaChartBar, FaChevronDown, FaStar, FaUsers, FaFolderOpen } from 'react-icons/fa';
import { StackedBarTooltip } from './CustomTooltips';

interface UserRating {
  username: string;
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  deny: number;
  total: number;
  percentageRated: number;
}

interface SeasonInfo {
  season?: string;
  clipAmount: number;
}

interface ComparisonChartProps {
  sortedUsers: UserRating[];
  seasonInfo: SeasonInfo;
  totalRatings: number;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ sortedUsers, seasonInfo, totalRatings }) => {
  const [isComparisonExpanded, setIsComparisonExpanded] = useState<boolean>(false);

  // Metrics
  const averageCompletion = sortedUsers.length > 0
    ? (sortedUsers.reduce((acc, user) => acc + user.percentageRated, 0) / sortedUsers.length)
    : 0;

  const teamCoverage = ((totalRatings / (sortedUsers.length * seasonInfo.clipAmount || 1)) * 100);
  const topPerformer = sortedUsers[0];
  const totalCompleted = sortedUsers.reduce((acc, user) => acc + user.total, 0);

  return (
    <div className="bg-[#181818] rounded-xl border border-[#262626] shadow-sm overflow-hidden">
      {/* Clickable Header Bar */}
      <div
        onClick={() => setIsComparisonExpanded(!isComparisonExpanded)}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-[#1f1f1f] transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#222222] border border-[#2e2e2e] flex items-center justify-center text-emerald-400">
            <FaChartBar size={16} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#f1f1f1] leading-tight">
              Reviewer Quota & Progress Tracker
            </h3>
            <p className="text-xs text-[#aaaaaa] mt-0.5">
              Completed vs remaining clips for each team member
            </p>
          </div>
        </div>

        {/* Quick Header Indicators */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden md:flex items-center gap-5">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#717171] block">Avg Progress</span>
              <span className="text-sm font-bold text-white">{averageCompletion.toFixed(1)}%</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#717171] block">Total Rated</span>
              <span className="text-sm font-bold text-white">{totalCompleted}</span>
            </div>
          </div>

          <div
            className={`w-8 h-8 rounded-full bg-[#222222] border border-[#2e2e2e] flex items-center justify-center text-[#aaaaaa] transition-transform duration-200 ${
              isComparisonExpanded ? 'rotate-180 text-white' : ''
            }`}
          >
            <FaChevronDown size={12} />
          </div>
        </div>
      </div>

      {/* Expandable Chart Canvas & Details */}
      <AnimatePresence>
        {isComparisonExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t border-[#262626]"
          >
            {/* Top Sub-Bar */}
            <div className="px-4 sm:px-6 py-3 bg-[#141414] border-b border-[#262626] flex items-center justify-between text-xs">
              <span className="text-[#aaaaaa]">
                Tracking {sortedUsers.length} team members against {seasonInfo.clipAmount} seasonal submissions
              </span>
              {topPerformer && (
                <div className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                  <FaStar size={11} />
                  <span>Leader: {topPerformer.username} ({topPerformer.percentageRated.toFixed(1)}%)</span>
                </div>
              )}
            </div>

            {/* Horizontal Bar Chart */}
            <div className="p-4 sm:p-6">
              <div
                className="w-full bg-[#141414] rounded-xl border border-[#222222] p-3 sm:p-4"
                style={{ height: Math.max(340, sortedUsers.length * 48) }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sortedUsers.map(user => ({
                      ...user,
                      remaining: Math.max(0, seasonInfo.clipAmount - user.total)
                    }))}
                    margin={{ top: 15, right: 30, left: 10, bottom: 20 }}
                    layout="vertical"
                    barCategoryGap="25%"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#222222" />
                    <XAxis
                      type="number"
                      domain={[0, seasonInfo.clipAmount || 100]}
                      tick={{ fill: '#717171', fontSize: 11 }}
                      axisLine={{ stroke: '#262626' }}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="username"
                      type="category"
                      tick={{ fill: '#aaaaaa', fontSize: 12 }}
                      width={120}
                      axisLine={{ stroke: '#262626' }}
                      tickLine={false}
                    />
                    <Tooltip content={<StackedBarTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                    />
                    <Bar
                      name="Completed"
                      dataKey="total"
                      stackId="a"
                      fill="#22c55e"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      name="Remaining"
                      dataKey="remaining"
                      stackId="a"
                      fill="#262626"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#141414] p-4 rounded-xl border border-[#262626]">
                  <div className="flex items-center justify-between mb-2">
                    <FaFolderOpen className="text-sky-400" size={16} />
                    <span className="text-[10px] font-bold text-[#aaaaaa] bg-[#222222] px-2 py-0.5 rounded-full">
                      AVAILABLE
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white">{seasonInfo.clipAmount}</div>
                  <div className="text-xs text-[#717171] mt-0.5">Total Clips in Season Queue</div>
                </div>

                <div className="bg-[#141414] p-4 rounded-xl border border-[#262626]">
                  <div className="flex items-center justify-between mb-2">
                    <FaUsers className="text-emerald-400" size={16} />
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      TEAM
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white">{teamCoverage.toFixed(1)}%</div>
                  <div className="text-xs text-[#717171] mt-0.5">Overall Coverage Efficiency</div>
                  <div className="mt-2.5 bg-[#222222] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(teamCoverage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-[#141414] p-4 rounded-xl border border-[#262626]">
                  <div className="flex items-center justify-between mb-2">
                    <FaStar className="text-amber-400" size={16} />
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                      AVG
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white">{averageCompletion.toFixed(1)}%</div>
                  <div className="text-xs text-[#717171] mt-0.5">Average Reviewer Completion</div>
                  <div className="mt-2.5 bg-[#222222] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(averageCompletion, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComparisonChart;