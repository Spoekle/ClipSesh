import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FaChartBar, FaChartPie } from 'react-icons/fa';
import { BarTooltip, PieTooltip } from './CustomTooltips';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF0000'];

const RatingDistribution = ({ userRatings, sortBy, setSortBy }) => {
  const [activeChart, setActiveChart] = useState('bar');
  
  // Prepare data for pie chart
  const pieData = userRatings.reduce((acc, user) => {
    ['1', '2', '3', '4', 'deny'].forEach(rating => {
      const existingIndex = acc.findIndex(item => item.name === `Rated ${rating === 'deny' ? 'Deny' : rating}`);
      if (existingIndex >= 0) {
        acc[existingIndex].value += user[rating];
      } else {
        acc.push({
          name: `Rated ${rating === 'deny' ? 'Deny' : rating}`,
          value: user[rating]
        });
      }
    });
    return acc;
  }, []);

  // Sort users based on criteria
  const sortedUsers = [...userRatings].sort((a, b) => {
    if (sortBy === 'username') {
      return a.username.localeCompare(b.username);
    } else if (sortBy === 'rating') {
      return b.total - a.total;
    } else if (sortBy === 'percentage') {
      return b.percentageRated - a.percentageRated;
    }
    return 0;
  });

  return (
    <>
      <div className="flex flex-wrap justify-between mb-6">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setActiveChart('bar')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeChart === 'bar'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
            } transition-colors`}
          >
            <FaChartBar /> Bar Chart
          </button>
          <button
            onClick={() => setActiveChart('pie')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeChart === 'pie'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
            } transition-colors`}
          >
            <FaChartPie /> Pie Chart
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium hidden sm:block">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white border-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="username">Username</option>
            <option value="rating">Total Ratings</option>
            <option value="percentage">Percentage</option>
          </select>
        </div>
      </div>
      
      <div className="bg-neutral-200 dark:bg-neutral-700 rounded-xl p-4 md:p-6 shadow-inner mb-8">
        <ResponsiveContainer width="100%" height={400}>
          {activeChart === 'bar' ? (
            <BarChart data={sortedUsers} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#555" />
              <XAxis 
                dataKey="username" 
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fill: '#888', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#888' }} />
              <Tooltip content={<BarTooltip />} />
              <Legend />
              <Bar name="Total Ratings" dataKey="total" fill="#3b82f6" />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={130}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </>
  );
};

export default RatingDistribution;
