import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserCheck, FaChevronDown, FaCheck, FaTimes, FaShieldAlt } from 'react-icons/fa';
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

const TIER_COLORS = ['#38bdf8', '#eab308', '#f97316', '#f23030', '#717171'];

const IndividualPerformance: React.FC<IndividualPerformanceProps> = ({ sortedUsers, seasonInfo }) => {
  const [isPerformanceExpanded, setIsPerformanceExpanded] = useState<boolean>(true);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});

  const toggleUserExpand = (username: string): void => {
    setExpandedUsers(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  const averageCompletion = sortedUsers.length > 0
    ? sortedUsers.reduce((sum, user) => sum + user.percentageRated, 0) / sortedUsers.length
    : 0;

  const compliantUsers = sortedUsers.filter(user => user.percentageRated >= 20).length;

  return (
    <div className="bg-[#181818] rounded-xl border border-[#262626] shadow-sm overflow-hidden">
      {/* Clickable Header */}
      <div
        onClick={() => setIsPerformanceExpanded(!isPerformanceExpanded)}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-[#1f1f1f] transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#222222] border border-[#2e2e2e] flex items-center justify-center text-sky-400">
            <FaUserCheck size={16} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#f1f1f1] leading-tight">
              Individual Reviewer Breakdown
            </h3>
            <p className="text-xs text-[#aaaaaa] mt-0.5">
              Review quotas, compliance status, and voting distributions per member
            </p>
          </div>
        </div>

        {/* Header Indicators */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden md:flex items-center gap-5">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#717171] block">Compliant Members</span>
              <span className="text-sm font-bold text-emerald-400">{compliantUsers} / {sortedUsers.length}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#717171] block">Average Quota</span>
              <span className="text-sm font-bold text-white">{averageCompletion.toFixed(1)}%</span>
            </div>
          </div>

          <div
            className={`w-8 h-8 rounded-full bg-[#222222] border border-[#2e2e2e] flex items-center justify-center text-[#aaaaaa] transition-transform duration-200 ${
              isPerformanceExpanded ? 'rotate-180 text-white' : ''
            }`}
          >
            <FaChevronDown size={12} />
          </div>
        </div>
      </div>

      {/* Expandable Section */}
      <AnimatePresence>
        {isPerformanceExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t border-[#262626]"
          >
            <div className="p-4 sm:p-6 space-y-2.5">
              {sortedUsers.map(user => {
                const isExpanded = expandedUsers[user.username] || false;
                const userRatingPercentage = user.percentageRated;
                const isCompliant = userRatingPercentage >= 20;

                const userPieData: PieData[] = [
                  { name: 'Rated 1', value: user['1'] },
                  { name: 'Rated 2', value: user['2'] },
                  { name: 'Rated 3', value: user['3'] },
                  { name: 'Rated 4', value: user['4'] },
                  { name: 'Denied', value: user['deny'] }
                ];

                return (
                  <div
                    key={user.username}
                    className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden transition-all duration-150 hover:border-[#383838]"
                  >
                    {/* User Row Header */}
                    <div
                      onClick={() => toggleUserExpand(user.username)}
                      className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#222222] border border-[#333333] flex items-center justify-center text-xs font-bold text-white uppercase">
                          {user.username.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-[#f1f1f1]">{user.username}</h4>
                          <span className="text-xs text-[#aaaaaa]">
                            {user.total} ratings ({userRatingPercentage.toFixed(1)}% of queue)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 border ${
                            isCompliant
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {isCompliant ? <FaCheck size={9} /> : <FaTimes size={9} />}
                          <span>{isCompliant ? 'Compliant (>=20%)' : 'Under Quota'}</span>
                        </span>

                        <FaChevronDown
                          size={11}
                          className={`text-[#717171] transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-white' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-4 pb-4 overflow-hidden"
                        >
                          <div className="p-4 rounded-xl bg-[#121212] border border-[#222222] space-y-4">
                            {/* Tier Count Chips */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {[
                                { label: 'Tier 1', value: user['1'], color: '#38bdf8' },
                                { label: 'Tier 2', value: user['2'], color: '#eab308' },
                                { label: 'Tier 3', value: user['3'], color: '#f97316' },
                                { label: 'Tier 4', value: user['4'], color: '#f23030' },
                                { label: 'Denied', value: user['deny'], color: '#717171' }
                              ].map((tier, idx) => (
                                <div
                                  key={idx}
                                  className="bg-[#181818] p-2.5 rounded-lg border border-[#262626] flex flex-col justify-between"
                                >
                                  <div className="flex justify-between items-center text-xs mb-1">
                                    <span className="text-[#aaaaaa]">{tier.label}</span>
                                    <span className="font-bold" style={{ color: tier.color }}>
                                      {tier.value}
                                    </span>
                                  </div>
                                  <div className="w-full bg-[#222222] h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${(tier.value / (user.total || 1)) * 100 || 0}%`,
                                        backgroundColor: tier.color
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Mini Distribution & Progress */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#222222]">
                              <div className="w-full sm:w-44 h-28 shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={userPieData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={24}
                                      outerRadius={44}
                                      dataKey="value"
                                      paddingAngle={3}
                                    >
                                      {userPieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={TIER_COLORS[index % TIER_COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip content={<UserDistributionTooltip />} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>

                              <div className="flex-1 w-full space-y-2 text-xs">
                                <div className="flex justify-between text-[#aaaaaa]">
                                  <span>Seasonal Queue Progress</span>
                                  <span className="text-white font-bold">
                                    {user.total} / {seasonInfo.clipAmount} clips ({userRatingPercentage.toFixed(1)}%)
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-[#222222] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isCompliant ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}
                                    style={{
                                      width: `${Math.min((user.total / (seasonInfo.clipAmount || 1)) * 100, 100)}%`
                                    }}
                                  />
                                </div>
                                <div className="flex justify-between text-[11px] text-[#717171]">
                                  <span>{seasonInfo.clipAmount - user.total} clips remaining to 100% review</span>
                                  <span>Goal: 20% minimum</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IndividualPerformance;
