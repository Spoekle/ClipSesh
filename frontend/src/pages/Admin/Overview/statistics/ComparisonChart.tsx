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
    <div className="space-y-6">
      {/* Header with Stats Preview - matching admin page styling */}
      <div 
        onClick={() => setIsComparisonExpanded(!isComparisonExpanded)}
        className="group cursor-pointer"
      >
        <div className="bg-neutral-200 dark:bg-neutral-700 p-6 rounded-xl hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-green-500 p-3 rounded-xl shadow-lg">
                <FaChartBar className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                  Rating Progress Comparison
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 mt-1">
                  Track team performance across all clips
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                  {averageCompletion.toFixed(1)}%
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Avg Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                  {totalCompleted}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Rated</div>
              </div>
              <div className="bg-neutral-300 dark:bg-neutral-600 p-3 rounded-full shadow-md group-hover:bg-neutral-400 dark:group-hover:bg-neutral-500 transition-all duration-200">
                {isComparisonExpanded ? (
                  <FaAngleUp className="text-neutral-700 dark:text-neutral-300 text-lg" />
                ) : (
                  <FaAngleDown className="text-neutral-700 dark:text-neutral-300 text-lg" />
                )}
              </div>
            </div>
            
            {/* Mobile toggle */}
            <div className="md:hidden bg-neutral-300 dark:bg-neutral-600 p-3 rounded-full shadow-md group-hover:bg-neutral-400 dark:group-hover:bg-neutral-500 transition-all duration-200">
              {isComparisonExpanded ? (
                <FaAngleUp className="text-neutral-700 dark:text-neutral-300" />
              ) : (
                <FaAngleDown className="text-neutral-700 dark:text-neutral-300" />
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
        <div className="bg-neutral-200 dark:bg-neutral-700 rounded-xl shadow-lg">
          {/* Chart Header */}
          <div className="p-6 border-b border-neutral-300 dark:border-neutral-600">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div>
                <h4 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                  Individual Progress Breakdown
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
                  Completed vs remaining clips for each team member
                </p>
              </div>
              {topPerformer && (
                <div className="flex items-center space-x-2 bg-neutral-300 dark:bg-neutral-600 px-4 py-2 rounded-full">
                  <FaTrophy className="text-yellow-600 dark:text-yellow-400 text-sm" />
                  <span className="text-neutral-800 dark:text-neutral-200 text-sm font-medium">
                    Top: {topPerformer.username} ({topPerformer.percentageRated.toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Chart Container */}
          <div className="p-6">
            <div className="w-full bg-neutral-300 dark:bg-neutral-800 rounded-xl p-4" style={{ height: Math.max(400, sortedUsers.length * 60) }}>
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
          <div className="p-6 border-t border-neutral-300 dark:border-neutral-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-neutral-300 to-neutral-400 dark:from-neutral-600 dark:to-neutral-700 p-6 rounded-xl border border-neutral-400 dark:border-neutral-500">
                <div className="flex items-center justify-between mb-3">
                  <FaClipboard className="text-neutral-700 dark:text-neutral-300 text-xl" />
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded-full">
                    TOTAL
                  </span>
                </div>
                <div className="text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-1">
                  {seasonInfo.clipAmount}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                  Total Clips Available
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-200 to-green-300 dark:from-green-800/50 dark:to-green-700/50 p-6 rounded-xl border border-green-300 dark:border-green-600">
                <div className="flex items-center justify-between mb-3">
                  <FaUsers className="text-green-700 dark:text-green-300 text-xl" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-800/50 px-2 py-1 rounded-full">
                    TEAM
                  </span>
                </div>
                <div className="text-3xl font-bold text-green-800 dark:text-green-200 mb-1">
                  {teamCoverage.toFixed(1)}%
                </div>
                <div className="text-sm text-green-700 dark:text-green-300 font-medium">
                  Team Coverage Rate
                </div>
                <div className="mt-2 bg-green-300 dark:bg-green-800/50 rounded-full h-2">
                  <div 
                    className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(teamCoverage, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-800/50 dark:to-blue-700/50 p-6 rounded-xl border border-blue-300 dark:border-blue-600">
                <div className="flex items-center justify-between mb-3">
                  <FaTrophy className="text-blue-700 dark:text-blue-300 text-xl" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800/50 px-2 py-1 rounded-full">
                    AVG
                  </span>
                </div>
                <div className="text-3xl font-bold text-blue-800 dark:text-blue-200 mb-1">
                  {averageCompletion.toFixed(1)}%
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  Average Completion
                </div>
                <div className="mt-2 bg-blue-300 dark:bg-blue-800/50 rounded-full h-2">
                  <div 
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-1000 ease-out"
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