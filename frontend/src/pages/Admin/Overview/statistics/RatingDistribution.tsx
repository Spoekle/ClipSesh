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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-neutral-200 dark:bg-neutral-700 p-6 rounded-xl shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500 p-3 rounded-xl shadow-lg">
              <FaChartBar className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                Rating Distribution Analysis
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300 mt-1">
                View the team's rating patterns and preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-neutral-200 dark:bg-neutral-700 p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveChart('bar')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                activeChart === 'bar'
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-neutral-300 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-400 dark:hover:bg-neutral-500'
              }`}
            >
              <FaChartBar /> Individual Chart
            </button>
            <button
              onClick={() => setActiveChart('pie')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                activeChart === 'pie'
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-neutral-300 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-400 dark:hover:bg-neutral-500'
              }`}
            >
              <FaChartPie /> Overall Chart
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg bg-neutral-300 dark:bg-neutral-600 text-neutral-800 dark:text-white border-none focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200"
            >
              <option value="username">Username</option>
              <option value="rating">Total Ratings</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Chart Section */}
      <div className="bg-neutral-200 dark:bg-neutral-700 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-neutral-300 dark:border-neutral-600">
          <h4 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
            {activeChart === 'bar' ? 'Individual Rating Performance' : 'Team Rating Distribution'}
          </h4>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
            {activeChart === 'bar' 
              ? 'Compare each team member\'s total ratings' 
              : 'Overall breakdown of rating types across the team'
            }
          </p>
        </div>
        
        <div className="p-6">
          <div className="bg-neutral-300 dark:bg-neutral-800 rounded-xl p-4" style={{ height: 450 }}>
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
