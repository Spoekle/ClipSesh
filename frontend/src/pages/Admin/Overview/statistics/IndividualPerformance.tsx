import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserAlt, FaAngleDown, FaAngleUp, FaCheck, FaTimes } from 'react-icons/fa';
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { UserDistributionTooltip } from './CustomTooltips';

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

interface IndividualPerformanceProps {
  sortedUsers: UserRating[];
  seasonInfo: SeasonInfo;
}

interface PieData {
  name: string;
  value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF0000'];

const IndividualPerformance: React.FC<IndividualPerformanceProps> = ({ sortedUsers, seasonInfo }) => {
  const [isPerformanceExpanded, setIsPerformanceExpanded] = useState<boolean>(false);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});

  // Function to toggle user details expansion
  const toggleUserExpand = (username: string): void => {
    setExpandedUsers(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  // Calculate performance metrics
  const averageCompletion = sortedUsers.length > 0
    ? sortedUsers.reduce((sum, user) => sum + user.percentageRated, 0) / sortedUsers.length
    : 0;
  const compliantUsers = sortedUsers.filter(user => user.percentageRated > 20).length;

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div
        onClick={() => setIsPerformanceExpanded(!isPerformanceExpanded)}
        className="group cursor-pointer"
      >
        <div className="bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-neutral-200/80 dark:border-neutral-700/50 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-lg shadow-sm">
                <FaUserAlt className="text-white text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                  Individual Performance
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  Breakdown of each team member's activity
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                  {averageCompletion.toFixed(1)}%
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Avg Completion</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                  {compliantUsers}/{sortedUsers.length}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Compliant</div>
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-700/50 p-2 rounded-lg group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-all duration-200">
                {isPerformanceExpanded ? (
                  <FaAngleUp className="text-neutral-600 dark:text-neutral-300" />
                ) : (
                  <FaAngleDown className="text-neutral-600 dark:text-neutral-300" />
                )}
              </div>
            </div>

            {/* Mobile toggle */}
            <div className="md:hidden bg-neutral-100 dark:bg-neutral-700/50 p-2 rounded-lg group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-all duration-200">
              {isPerformanceExpanded ? (
                <FaAngleUp className="text-neutral-600 dark:text-neutral-300" />
              ) : (
                <FaAngleDown className="text-neutral-600 dark:text-neutral-300" />
              )}
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{
          height: isPerformanceExpanded ? "auto" : 0,
          opacity: isPerformanceExpanded ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="space-y-3">
          {sortedUsers.map(user => {
            const isExpanded = expandedUsers[user.username] || false;
            const userRatingPercentage = user.percentageRated;
            let barColor;

            if (userRatingPercentage >= 90) barColor = "bg-green-500";
            else if (userRatingPercentage >= 75) barColor = "bg-blue-500";
            else if (userRatingPercentage >= 50) barColor = "bg-yellow-500";
            else if (userRatingPercentage >= 25) barColor = "bg-orange-500";
            else barColor = "bg-red-500";

            // Create data for user's mini pie chart
            const userPieData: PieData[] = [
              { name: 'Rated 1', value: user['1'] },
              { name: 'Rated 2', value: user['2'] },
              { name: 'Rated 3', value: user['3'] },
              { name: 'Rated 4', value: user['4'] },
              { name: 'Denied', value: user['deny'] }
            ];

            return (
              <motion.div
                key={user.username}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm rounded-lg overflow-hidden border border-neutral-200/80 dark:border-neutral-700/50"
              >
                <div
                  className="flex justify-between items-center p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors"
                  onClick={() => toggleUserExpand(user.username)}
                >
                  <div className="flex items-center">
                    <div className="mr-3 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold">{user.username}</h4>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        {user.total} ratings ({userRatingPercentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`flex items-center text-sm px-2 py-0.5 rounded ${userRatingPercentage > 20 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                      }`}>
                      {userRatingPercentage > 20 ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                      {userRatingPercentage > 20 ? 'Compliant' : 'Non-compliant'}
                    </span>
                    {isExpanded ? <FaAngleUp /> : <FaAngleDown />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-4"
                    >
                      <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                          {[
                            { label: 'Rated 1', value: user['1'], color: COLORS[0] },
                            { label: 'Rated 2', value: user['2'], color: COLORS[1] },
                            { label: 'Rated 3', value: user['3'], color: COLORS[2] },
                            { label: 'Rated 4', value: user['4'], color: COLORS[3] },
                            { label: 'Denied', value: user['deny'], color: COLORS[4] }
                          ].map((item, index) => (
                            <div key={index} className="bg-neutral-400 dark:bg-neutral-700 text-neutral-900 dark:text-white transition duration-200 rounded-md p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{item.label}:</span>
                                <span className="font-bold" style={{ color: item.color }}>{item.value}</span>
                              </div>
                              <div className="mt-1 w-full bg-neutral-500 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-full"
                                  style={{
                                    width: `${(item.value / (user.total || 1)) * 100 || 0}%`,
                                    backgroundColor: item.color
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Rating distribution mini pie chart with custom tooltip */}
                        <div className="mt-6 mb-2">
                          <h4 className="font-medium mb-2 text-sm uppercase tracking-wide">Rating Distribution</h4>
                          <div className="flex items-center">
                            <div className="w-1/2 h-32">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={userPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={25}
                                    outerRadius={45}
                                    fill="#8884d8"
                                    dataKey="value"
                                    paddingAngle={3}
                                  >
                                    {userPieData.map((_, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip content={<UserDistributionTooltip />} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>

                            <div className="w-1/2">
                              <div className="flex flex-col gap-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Completion:</span>
                                  <span className="font-semibold">{userRatingPercentage.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total Clips Rated:</span>
                                  <span className="font-semibold">{user.total} of {seasonInfo.clipAmount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Remaining:</span>
                                  <span className="font-semibold">{seasonInfo.clipAmount - user.total} clips</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Rating Progress</span>
                            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                              {user.total}/{seasonInfo.clipAmount} clips
                            </span>
                          </div>
                          <div className="w-full h-2 bg-neutral-400 dark:bg-neutral-600 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(user.total / seasonInfo.clipAmount) * 100 || 0}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className={`h-full ${barColor}`}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default IndividualPerformance;
