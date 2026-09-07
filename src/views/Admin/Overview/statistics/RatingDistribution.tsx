import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { FaChartBar, FaChartPie, FaLayerGroup } from 'react-icons/fa';
import { BarTooltip, PieTooltip } from './CustomTooltips';
import { UserRating, PieData } from '../../../../types/adminTypes';

interface RatingDistributionProps {
  userRatings: UserRating[];
  sortBy: string;
  setSortBy: React.Dispatch<React.SetStateAction<string>>;
}

// Curated dark-theme tier palette
const TIER_COLORS = {
  'Rated 4': '#f23030', // Cube Red (top tier)
  'Rated 3': '#f97316', // Warm Orange
  'Rated 2': '#eab308', // Gold / Amber
  'Rated 1': '#38bdf8', // Sky Blue
  'Rated Deny': '#717171', // Neutral Slate
};

const PIE_COLORS = ['#f23030', '#f97316', '#eab308', '#38bdf8', '#717171'];

const RatingDistribution: React.FC<RatingDistributionProps> = ({ userRatings, sortBy, setSortBy }) => {
  const [activeChart, setActiveChart] = useState<'bar' | 'pie'>('bar');

  // Compute team totals for pie / donut breakdown
  const pieData: PieData[] = useMemo(() => {
    const counts: Record<string, number> = {
      'Rated 4': 0,
      'Rated 3': 0,
      'Rated 2': 0,
      'Rated 1': 0,
      'Rated Deny': 0
    };

    userRatings.forEach((user) => {
      counts['Rated 4'] += user['4'] || 0;
      counts['Rated 3'] += user['3'] || 0;
      counts['Rated 2'] += user['2'] || 0;
      counts['Rated 1'] += user['1'] || 0;
      counts['Rated Deny'] += user['deny'] || 0;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [userRatings]);

  const totalVotes = useMemo(() => {
    return pieData.reduce((sum, item) => sum + item.value, 0);
  }, [pieData]);

  // Sort user rating data for bar chart
  const sortedUsers = useMemo(() => {
    return [...userRatings].sort((a, b) => {
      if (sortBy === 'username') {
        return a.username.localeCompare(b.username);
      } else if (sortBy === 'rating') {
        return b.total - a.total;
      } else if (sortBy === 'tier4') {
        return b['4'] - a['4'];
      } else if (sortBy === 'deny') {
        return b['deny'] - a['deny'];
      }
      return 0;
    });
  }, [userRatings, sortBy]);

  return (
    <div className="bg-[#181818] rounded-xl border border-[#262626] shadow-sm overflow-hidden">
      {/* Header & View Switcher */}
      <div className="p-4 sm:p-5 border-b border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#222222] border border-[#2e2e2e] flex items-center justify-center text-[#f23030]">
            <FaLayerGroup size={16} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#f1f1f1] leading-tight">
              Rating Distribution & Breakdown
            </h3>
            <p className="text-xs text-[#aaaaaa] mt-0.5">
              Reviewer voting styles and aggregate tier frequencies
            </p>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Segmented Pill Switcher */}
          <div className="flex items-center bg-[#121212] p-1 rounded-full border border-[#262626]">
            <button
              onClick={() => setActiveChart('bar')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeChart === 'bar'
                  ? 'bg-[#222222] text-white shadow-xs'
                  : 'text-[#aaaaaa] hover:text-white'
              }`}
            >
              <FaChartBar size={12} />
              <span>Reviewers (Stacked)</span>
            </button>
            <button
              onClick={() => setActiveChart('pie')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeChart === 'pie'
                  ? 'bg-[#222222] text-white shadow-xs'
                  : 'text-[#aaaaaa] hover:text-white'
              }`}
            >
              <FaChartPie size={12} />
              <span>Team Donut</span>
            </button>
          </div>

          {/* Sort Menu (for bar view) */}
          {activeChart === 'bar' && (
            <div className="flex items-center gap-1.5 text-xs text-[#aaaaaa]">
              <label htmlFor="sort-reviewers" className="hidden sm:inline">Sort:</label>
              <select
                id="sort-reviewers"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#121212] border border-[#262626] text-[#f1f1f1] rounded-lg px-2.5 py-1 text-xs outline-none focus:border-[#f23030] transition-colors"
              >
                <option value="rating">Total Votes</option>
                <option value="username">Username</option>
                <option value="tier4">Most Tier 4s</option>
                <option value="deny">Most Denies</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="p-4 sm:p-6">
        <div className="w-full h-[380px] bg-[#141414] rounded-xl border border-[#222222] p-3 sm:p-4">
          <ResponsiveContainer width="100%" height="100%">
            {activeChart === 'bar' ? (
              <BarChart
                data={sortedUsers}
                margin={{ top: 20, right: 20, left: 0, bottom: 70 }}
                barSize={32}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222222" />
                <XAxis
                  dataKey="username"
                  angle={-40}
                  textAnchor="end"
                  height={65}
                  tick={{ fill: '#aaaaaa', fontSize: 11 }}
                  interval={0}
                  axisLine={{ stroke: '#262626' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#717171', fontSize: 11 }}
                  axisLine={{ stroke: '#262626' }}
                  tickLine={false}
                />
                <Tooltip content={<BarTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: '16px', fontSize: '11px' }}
                />
                <Bar name="Rated 4" dataKey="4" stackId="ratings" fill={TIER_COLORS['Rated 4']} />
                <Bar name="Rated 3" dataKey="3" stackId="ratings" fill={TIER_COLORS['Rated 3']} />
                <Bar name="Rated 2" dataKey="2" stackId="ratings" fill={TIER_COLORS['Rated 2']} />
                <Bar name="Rated 1" dataKey="1" stackId="ratings" fill={TIER_COLORS['Rated 1']} />
                <Bar
                  name="Denied"
                  dataKey="deny"
                  stackId="ratings"
                  fill={TIER_COLORS['Rated Deny']}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={125}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) => `${(name || '').replace('Rated ', '')}: ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                          stroke="#141414"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Callout inside Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-4">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {totalVotes.toLocaleString()}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[#aaaaaa] tracking-wider">
                    Total Votes
                  </span>
                </div>
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default RatingDistribution;
