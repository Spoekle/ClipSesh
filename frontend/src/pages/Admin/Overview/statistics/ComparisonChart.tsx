import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaChartBar, FaAngleDown, FaAngleUp, FaTrophy, FaUsers, FaClipboard } from 'react-icons/fa';
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

  // Calculate metrics for the improved UI
  const averageCompletion = sortedUsers.length > 0
    ? (sortedUsers.reduce((acc, user) => acc + user.percentageRated, 0) / sortedUsers.length)
    : 0;

  const teamCoverage = ((totalRatings / (sortedUsers.length * seasonInfo.clipAmount || 1)) * 100);

  const topPerformer = sortedUsers[0];
  const totalCompleted = sortedUsers.reduce((acc, user) => acc + user.total, 0);

  return (
    <div className="space-y-4">
      {/* Header with Stats Preview - matching admin page styling */}
      <div
        onClick={() => setIsComparisonExpanded(!isComparisonExpanded)}
        className="group cursor-pointer"
      >
        <div className="bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-neutral-200/80 dark:border-neutral-700/50 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-2.5 rounded-lg shadow-sm">
                <FaChartBar className="text-white text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                  Rating Progress Comparison
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  Track team performance across all clips
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                  {averageCompletion.toFixed(1)}%
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Avg Progress</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                  {totalCompleted}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Total Rated</div>
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-700/50 p-2 rounded-lg group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-all duration-200">
                {isComparisonExpanded ? (
                  <FaAngleUp className="text-neutral-600 dark:text-neutral-300" />
                ) : (
                  <FaAngleDown className="text-neutral-600 dark:text-neutral-300" />
                )}
              </div>
            </div>

            {/* Mobile toggle */}
            <div className="md:hidden bg-neutral-100 dark:bg-neutral-700/50 p-2 rounded-lg group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-all duration-200">
              {isComparisonExpanded ? (
                <FaAngleUp className="text-neutral-600 dark:text-neutral-300" />
              ) : (
                <FaAngleDown className="text-neutral-600 dark:text-neutral-300" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Chart Section */}
      <motion.div
        initial={false}
        animate={{
          height: isComparisonExpanded ? "auto" : 0,
          opacity: isComparisonExpanded ? 1 : 0
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl shadow-sm border border-neutral-200/80 dark:border-neutral-700/50">
          {/* Chart Header */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div>
                <h4 className="text-base font-medium text-neutral-800 dark:text-neutral-100">
                  Individual Progress Breakdown
                </h4>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  Completed vs remaining clips for each team member
                </p>
              </div>
              {topPerformer && (
                <div className="flex items-center space-x-2 bg-neutral-100 dark:bg-neutral-700/50 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-600">
                  <FaTrophy className="text-amber-500 dark:text-amber-400 text-sm" />
                  <span className="text-neutral-700 dark:text-neutral-200 text-sm font-medium">
                    Top: {topPerformer.username} ({topPerformer.percentageRated.toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Chart Container */}
          <div className="p-4">
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4" style={{ height: Math.max(350, sortedUsers.length * 55) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedUsers.map(user => ({
                    ...user,
                    remaining: seasonInfo.clipAmount - user.total
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  layout="vertical"
                  barCategoryGap="20%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                    stroke="#9ca3af"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    type="number"
                    domain={[0, seasonInfo.clipAmount]}
                    tickCount={Math.min(6, seasonInfo.clipAmount)}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#6b7280' }}
                    tickLine={{ stroke: '#6b7280' }}
                    label={{
                      value: 'Number of Clips',
                      position: 'insideBottom',
                      offset: -10,
                      style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px' }
                    }}
                  />
                  <YAxis
                    dataKey="username"
                    type="category"
                    tick={{ fill: '#6b7280', fontSize: 13 }}
                    width={140}
                    axisLine={{ stroke: '#6b7280' }}
                    tickLine={{ stroke: '#6b7280' }}
                    interval={0}
                  />
                  <Tooltip content={<StackedBarTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="rect"
                  />
                  <Bar
                    name="Completed"
                    dataKey="total"
                    stackId="a"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                    minPointSize={2}
                  />
                  <Bar
                    name="Remaining"
                    dataKey="remaining"
                    stackId="a"
                    fill="#d1d5db"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Enhanced Summary Cards */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <FaClipboard className="text-neutral-500 dark:text-neutral-400 text-lg" />
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded-full">
                    TOTAL
                  </span>
                </div>
                <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                  {seasonInfo.clipAmount}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
                  Total Clips Available
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700/50">
                <div className="flex items-center justify-between mb-2">
                  <FaUsers className="text-green-600 dark:text-green-400 text-lg" />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-800/30 px-2 py-0.5 rounded-full">
                    TEAM
                  </span>
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {teamCoverage.toFixed(1)}%
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
                  Team Coverage Rate
                </div>
                <div className="mt-2 bg-green-200 dark:bg-green-800/30 rounded-full h-1.5">
                  <div
                    className="bg-green-500 dark:bg-green-400 h-1.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(teamCoverage, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700/50">
                <div className="flex items-center justify-between mb-2">
                  <FaTrophy className="text-blue-600 dark:text-blue-400 text-lg" />
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800/30 px-2 py-0.5 rounded-full">
                    AVG
                  </span>
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {averageCompletion.toFixed(1)}%
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                  Average Completion
                </div>
                <div className="mt-2 bg-blue-200 dark:bg-blue-800/30 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${averageCompletion}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ComparisonChart;