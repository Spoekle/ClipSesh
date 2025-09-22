import React from 'react';
import { TooltipProps } from 'recharts';
import { 
  ValueType, 
  NameType 
} from 'recharts/types/component/DefaultTooltipContent';

// Type definitions for user data in tooltips
interface UserData {
  username: string;
  total: number;
  percentageRated: number;
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  deny: number;
  remaining?: number;
}

interface PieData {
  name: string;
  value: number;
  payload?: any;
}

export const BarTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload}) => {
  if (active && payload && payload.length) {
    const userData = payload[0].payload as UserData;
    
    return (
      <div className="p-4 bg-neutral-200 dark:bg-neutral-800 shadow-xl rounded-xl border border-neutral-300 dark:border-neutral-700">
        <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-3">{userData.username}</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-600 dark:text-neutral-300">Total Ratings:</span> 
            <span className="font-semibold text-neutral-800 dark:text-white bg-neutral-300 dark:bg-neutral-700 px-2 py-1 rounded">{userData.total}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-600 dark:text-neutral-300">Coverage:</span> 
            <span className={`font-semibold text-neutral-800 dark:text-white ${userData.percentageRated >= 20 ? 'bg-green-200 dark:bg-green-800' : 'bg-red-200 dark:bg-red-800'} px-2 py-1 rounded`}>{userData.percentageRated.toFixed(1)}%</span>
          </div>
          <div className="mt-3 pt-2 border-t border-neutral-300 dark:border-neutral-600">
            <div className="grid grid-cols-2 gap-2">
              {(['1', '2', '3', '4', 'deny'] as const).map(rating => (
                <div key={rating} className="flex justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Rated {rating}:</span>
                  <span className="font-medium text-neutral-700 dark:text-neutral-200">{userData[rating]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const PieTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as PieData;
    const totalValue = payload.reduce((sum, entry) => sum + (entry.value as number), 0);
    const percentage = ((data.value / totalValue) * 100).toFixed(1);
    
    return (
      <div className="p-3 bg-neutral-200 dark:bg-neutral-800 shadow-xl rounded-xl border border-neutral-300 dark:border-neutral-700">
        <p className="font-medium text-neutral-800 dark:text-white mb-2">{data.name}</p>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-600 dark:text-neutral-300">Count:</span>
            <span className="font-semibold text-neutral-800 dark:text-white bg-neutral-300 dark:bg-neutral-700 px-2 py-1 rounded">{data.value}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-600 dark:text-neutral-300">Percentage:</span>
            <span className="font-semibold text-neutral-800 dark:text-white bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">{percentage}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const StackedBarTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const userData = payload[0].payload as UserData & { remaining: number };
    const totalClips = userData.total + userData.remaining;
    
    return (
      <div className="p-4 bg-neutral-200 dark:bg-neutral-800 shadow-xl rounded-xl border border-neutral-300 dark:border-neutral-700">
        <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-3">{userData.username}</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-green-600 dark:text-green-400 font-medium">Completed:</span>
            <span className="font-semibold text-neutral-800 dark:text-white bg-green-200 dark:bg-green-800 px-3 py-1 rounded-lg">
              {userData.total} clips ({((userData.total / totalClips) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-500 dark:text-neutral-400 font-medium">Remaining:</span>
            <span className="font-semibold text-neutral-800 dark:text-white bg-neutral-300 dark:bg-neutral-700 px-3 py-1 rounded-lg">
              {userData.remaining} clips
            </span>
          </div>
          <div className="w-full h-3 bg-neutral-300 dark:bg-neutral-700 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all duration-300" 
              style={{ width: `${(userData.total / totalClips) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const UserDistributionTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-neutral-200 dark:bg-neutral-800 shadow-xl rounded-xl border border-neutral-300 dark:border-neutral-700">
        <h3 className="font-medium text-neutral-800 dark:text-white mb-2">{payload[0].name}</h3>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span style={{ color: entry.color }} className="font-medium">{entry.dataKey}:</span>
              <span className="font-semibold text-neutral-800 dark:text-white bg-neutral-300 dark:bg-neutral-700 px-2 py-1 rounded ml-3">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};
