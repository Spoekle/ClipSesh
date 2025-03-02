import React from 'react';

export const BarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const userData = payload[0].payload;
    
    return (
      <div className="p-4 bg-neutral-800 shadow-lg rounded-lg border border-neutral-700">
        <h3 className="text-lg font-bold text-white mb-2">{userData.username}</h3>
        <div className="space-y-1">
          <p className="text-sm text-white flex justify-between">
            <span>Total Ratings:</span> 
            <span className="font-semibold">{userData.total}</span>
          </p>
          <p className="text-sm text-white flex justify-between">
            <span>Coverage:</span> 
            <span className="font-semibold">{userData.percentageRated.toFixed(1)}%</span>
          </p>
          <div className="mt-2 pt-2 border-t border-neutral-700">
            <div className="grid grid-cols-2 gap-2">
              {['1', '2', '3', '4', 'deny'].map(rating => (
                <p key={rating} className="text-xs flex justify-between">
                  <span className="text-neutral-400">Rated {rating}:</span>
                  <span>{userData[rating]}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const totalValue = payload.reduce((sum, entry) => sum + entry.value, 0);
    const percentage = ((data.value / totalValue) * 100).toFixed(1);
    
    return (
      <div className="p-3 bg-neutral-800 shadow-lg rounded-lg border border-neutral-700">
        <p className="font-medium text-white">{data.name}</p>
        <p className="text-sm">
          <span className="text-neutral-300">Count: </span>
          <span className="font-semibold text-white">{data.value}</span>
        </p>
        <p className="text-sm">
          <span className="text-neutral-300">Percentage: </span>
          <span className="font-semibold text-white">{percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export const StackedBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const userData = payload[0].payload;
    const totalClips = userData.total + userData.remaining;
    
    return (
      <div className="p-4 bg-neutral-800 shadow-lg rounded-lg border border-neutral-700">
        <h3 className="text-lg font-bold text-white mb-2">{userData.username}</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-green-400">Completed:</span>
            <span className="font-semibold text-white">{userData.total} clips ({((userData.total / totalClips) * 100).toFixed(1)}%)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-400">Remaining:</span>
            <span className="font-semibold text-white">{userData.remaining} clips</span>
          </div>
          <div className="w-full h-2 bg-neutral-700 rounded-full mt-2">
            <div 
              className="h-full bg-green-500 rounded-full" 
              style={{ width: `${(userData.total / totalClips) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const UserDistributionTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-neutral-800 shadow-lg rounded-lg border border-neutral-700">
        <h3 className="font-medium text-white mb-1">{payload[0].name}</h3>
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span style={{ color: entry.color }}>{entry.dataKey}:</span>
            <span className="font-semibold text-white ml-4">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};
