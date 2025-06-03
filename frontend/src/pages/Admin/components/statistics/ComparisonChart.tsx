import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaChartBar, FaAngleDown, FaAngleUp } from 'react-icons/fa';
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

  return (
    <>
      <div 
        onClick={() => setIsComparisonExpanded(!isComparisonExpanded)}
        className="flex justify-between items-center mt-10 mb-4 cursor-pointer group"
      >
        <h3 className="text-xl font-bold flex items-center">
          <FaChartBar className="mr-2 text-green-500" /> 
          Rating Completion Comparison
        </h3>
        <div className="bg-neutral-200 dark:bg-neutral-700 p-2 rounded-full transform transition-transform duration-200 group-hover:bg-neutral-300 dark:group-hover:bg-neutral-600">
          {isComparisonExpanded ? (
            <FaAngleUp className="text-neutral-600 dark:text-neutral-300" />
          ) : (
            <FaAngleDown className="text-neutral-600 dark:text-neutral-300" />
          )}
        </div>
      </div>
      
      <motion.div 
        initial={false}
        animate={{ 
          height: isComparisonExpanded ? "auto" : 0,
          opacity: isComparisonExpanded ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="bg-neutral-200 dark:bg-neutral-700 p-4 md:p-6 rounded-xl shadow-inner w-full">
          <div className="w-full" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={sortedUsers.map(user => ({
                  ...user,
                  remaining: seasonInfo.clipAmount - user.total
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis 
                  type="number" 
                  domain={[0, seasonInfo.clipAmount]} 
                  tickCount={Math.min(6, seasonInfo.clipAmount)} 
                  tick={{ fill: '#888' }}
                  label={{ 
                    value: 'Clips', 
                    position: 'insideBottom',
                    offset: -10,
                    fill: '#888' 
                  }}
                />
                <YAxis 
                  dataKey="username" 
                  type="category" 
                  tick={{ fill: '#888', fontSize: 12 }}
                  width={100}
                />
                <Tooltip content={<StackedBarTooltip />} />
                <Legend />
                <Bar 
                  name="Completed" 
                  dataKey="total" 
                  stackId="a" 
                  fill="#4ade80"
                />
                <Bar 
                  name="Remaining" 
                  dataKey="remaining" 
                  stackId="a" 
                  fill="#d1d5db"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Add summary below the chart */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-300 dark:bg-neutral-600 p-3 rounded-lg">
              <div className="font-medium text-center">Total Clips</div>
              <div className="text-2xl font-bold text-center">{seasonInfo.clipAmount}</div>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
              <div className="font-medium text-center text-green-700 dark:text-green-300">Team Coverage</div>
              <div className="text-2xl font-bold text-center text-green-700 dark:text-green-300">
                {((totalRatings / (sortedUsers.length * seasonInfo.clipAmount || 1)) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <div className="font-medium text-center text-blue-700 dark:text-blue-300">Average Completion</div>
              <div className="text-2xl font-bold text-center text-blue-700 dark:text-blue-300">
                {sortedUsers.length > 0 
                  ? ((sortedUsers.reduce((acc, user) => acc + user.percentageRated, 0) / sortedUsers.length)).toFixed(1) 
                  : 0}%
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ComparisonChart;