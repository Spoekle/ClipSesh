import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FaChartBar, FaChartPie } from 'react-icons/fa';
import { BarTooltip, PieTooltip } from './CustomTooltips';
import { UserRating, PieData } from '../../../../types/adminTypes';

interface RatingDistributionProps {
  userRatings: UserRating[];
  sortBy: string;
  setSortBy: React.Dispatch<React.SetStateAction<string>>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF0000'];

const RatingDistribution: React.FC<RatingDistributionProps> = ({ userRatings, sortBy, setSortBy }) => {
  const [activeChart, setActiveChart] = useState<'bar' | 'pie'>('bar');

  const pieData: PieData[] = userRatings.reduce((acc: PieData[], user) => {
    (['1', '2', '3', '4', 'deny'] as const).forEach(rating => {
      const name = `Rated ${rating === 'deny' ? 'Deny' : rating}`;
      const existingIndex = acc.findIndex(item => item.name === name);
      if (existingIndex >= 0) {
        acc[existingIndex].value += user[rating];
      } else {
        acc.push({
          name,
          value: user[rating]
        });
      }
    });
    return acc;
  }, []);

  const sortedUsers = [...userRatings].sort((a, b) => {
    if (sortBy === 'username') {
      return a.username.localeCompare(b.username);
    } else if (sortBy === 'rating') {
      return b.total - a.total;
    }
    return 0;
  });


  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-neutral-200/80 dark:border-neutral-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-lg shadow-sm">
              <FaChartBar className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                Rating Distribution
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                View the team's rating patterns
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-neutral-200/80 dark:border-neutral-700/50">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveChart('bar')}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium ${activeChart === 'bar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-600'
                }`}
            >
              <FaChartBar /> Individual
            </button>
            <button
              onClick={() => setActiveChart('pie')}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium ${activeChart === 'pie'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-600'
                }`}
            >
              <FaChartPie /> Overall
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all duration-200 text-sm"
            >
              <option value="username">Username</option>
              <option value="rating">Total Ratings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl shadow-sm border border-neutral-200/80 dark:border-neutral-700/50 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h4 className="text-base font-medium text-neutral-800 dark:text-neutral-100">
            {activeChart === 'bar' ? 'Individual Rating Performance' : 'Team Rating Distribution'}
          </h4>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-0.5">
            {activeChart === 'bar'
              ? 'Compare each team member\'s total ratings'
              : 'Overall breakdown of rating types across the team'
            }
          </p>
        </div>

        <div className="p-4">
          <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4" style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              {activeChart === 'bar' ? (
                <BarChart data={sortedUsers} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#9ca3af" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="username"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    interval={0}
                  />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip content={<BarTooltip />} />
                  <Legend />
                  <Bar
                    name="Total Ratings"
                    dataKey="total"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={140}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingDistribution;
