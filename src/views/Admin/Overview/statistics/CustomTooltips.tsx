import React from 'react';

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

export const BarTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const userData = payload[0].payload as UserData;

    return (
      <div className="p-4 bg-[#181818] shadow-2xl rounded-xl border border-[#262626] min-w-[200px] select-none">
        <h3 className="text-sm font-bold text-[#f1f1f1] mb-2.5 flex items-center justify-between">
          <span>{userData.username}</span>
          <span className="text-[10px] font-medium text-[#aaaaaa]">Reviewer</span>
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#aaaaaa]">Total Ratings:</span>
            <span className="font-semibold text-white bg-[#222222] px-2 py-0.5 rounded-full">
              {userData.total}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#aaaaaa]">Coverage:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-full ${
                userData.percentageRated >= 20
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {userData.percentageRated.toFixed(1)}%
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#262626]">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between text-[#aaaaaa]">
                <span>Rated 4:</span>
                <span className="font-semibold text-[#f23030]">{userData['4']}</span>
              </div>
              <div className="flex justify-between text-[#aaaaaa]">
                <span>Rated 3:</span>
                <span className="font-semibold text-[#f97316]">{userData['3']}</span>
              </div>
              <div className="flex justify-between text-[#aaaaaa]">
                <span>Rated 2:</span>
                <span className="font-semibold text-[#eab308]">{userData['2']}</span>
              </div>
              <div className="flex justify-between text-[#aaaaaa]">
                <span>Rated 1:</span>
                <span className="font-semibold text-[#38bdf8]">{userData['1']}</span>
              </div>
              <div className="col-span-2 flex justify-between text-[#aaaaaa] pt-1 border-t border-[#262626]/60">
                <span>Denied:</span>
                <span className="font-semibold text-[#717171]">{userData['deny']}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const PieTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as PieData;
    const totalValue = payload.reduce((sum: number, entry: any) => sum + (entry.value as number), 0);
    const percentage = totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(1) : '0';

    return (
      <div className="p-3 bg-[#181818] shadow-2xl rounded-xl border border-[#262626] min-w-[160px] select-none">
        <p className="font-semibold text-xs text-[#f1f1f1] mb-2">{data.name}</p>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[#aaaaaa]">Count:</span>
            <span className="font-bold text-white bg-[#222222] px-2 py-0.5 rounded-full">
              {data.value}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#aaaaaa]">Share:</span>
            <span className="font-bold text-[#f23030] bg-[#f23030]/10 px-2 py-0.5 rounded-full border border-[#f23030]/20">
              {percentage}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const StackedBarTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const userData = payload[0].payload as UserData & { remaining: number };
    const totalClips = userData.total + (userData.remaining || 0);

    return (
      <div className="p-4 bg-[#181818] shadow-2xl rounded-xl border border-[#262626] min-w-[220px] select-none">
        <h3 className="text-sm font-bold text-[#f1f1f1] mb-2.5">{userData.username}</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-emerald-400 font-medium">Completed:</span>
            <span className="font-semibold text-white bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {userData.total} ({totalClips > 0 ? ((userData.total / totalClips) * 100).toFixed(1) : 0}%)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#aaaaaa] font-medium">Remaining:</span>
            <span className="font-semibold text-[#aaaaaa] bg-[#222222] px-2 py-0.5 rounded-full">
              {userData.remaining || 0} clips
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#222222] rounded-full mt-2.5 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${totalClips > 0 ? (userData.total / totalClips) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const UserDistributionTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-[#181818] shadow-2xl rounded-xl border border-[#262626] min-w-[150px] select-none">
        <h3 className="font-semibold text-xs text-[#f1f1f1] mb-2">{payload[0].name}</h3>
        <div className="space-y-1.5 text-xs">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center">
              <span style={{ color: entry.color }} className="font-medium">
                {entry.dataKey}:
              </span>
              <span className="font-semibold text-white bg-[#222222] px-2 py-0.5 rounded-full ml-3">
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
