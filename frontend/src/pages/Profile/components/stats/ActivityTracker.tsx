import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import DateRangePicker from '../../../../components/DateRangePicker';
import { useMyRatings } from '../../../../hooks/useRatings';

interface DataPoint {
  date: string;
  count: number;
}

interface ActivityTrackerProps {
  viewSwitchTimestamp?: number;
}

const ActivityTracker: React.FC<ActivityTrackerProps> = ({ viewSwitchTimestamp }) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({ 
    start: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), 
    end: new Date(Date.now()) 
  });

  const queryParams = React.useMemo(() => {
    const params: any = {};
    
    if (dateRange.start) {
      params.startDate = dateRange.start.toISOString().split('T')[0];
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      params.endDate = endDate.toISOString().split('T')[0];
    }
    
    return params;
  }, [dateRange]);

  const { data: ratingsData, isLoading: loading, error: queryError, refetch } = useMyRatings(queryParams);
  const error = queryError?.message || null;
  const rawRatings = ratingsData?.ratings || [];

  useEffect(() => {
    if (viewSwitchTimestamp) {
      refetch();
    }
  }, [viewSwitchTimestamp, refetch]);

  useEffect(() => {  
    const counts: Record<string, number> = {};
    let earliestDate: Date | null = null;
    let latestDate: Date | null = null;
    
    rawRatings.forEach(r => {
      const dt = new Date(r.timestamp);
      
      if (dateRange.start && dt < dateRange.start) {
        return;
      }
      if (dateRange.end) {
        const endOfDay = new Date(dateRange.end);
        endOfDay.setHours(23, 59, 59, 999);
        if (dt > endOfDay) {
          return;
        }
      }
      
      if (!earliestDate || dt < earliestDate) {
        earliestDate = dt;
      }
      if (!latestDate || dt > latestDate) {
        latestDate = dt;
      }
      
      const key = dt.toISOString().split('T')[0];
      counts[key] = (counts[key] || 0) + 1;
    });

    if (earliestDate && latestDate) {
      const allKeys = generateAllDateKeys(earliestDate, latestDate);
      const chartData = allKeys.map(date => ({ date, count: counts[date] || 0 }));
      setData(chartData);
    } else {
      console.log('No data found, setting empty array');
      setData([]);
    }
  }, [rawRatings]);

  const generateAllDateKeys = (startDate: Date, endDate: Date): string[] => {
    const dateKeys: string[] = [];

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
 
    const currentDate = new Date(startDateStr + 'T00:00:00.000Z');
    const finalDate = new Date(endDateStr + 'T00:00:00.000Z');
    
    while (currentDate <= finalDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dateKeys.push(dateKey);
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return dateKeys;
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setDateRange({ start, end });
  };
  
  const formatXAxisLabel = (value: string) => {
    return value.split('-')[2];
  };
  
  const formatTooltipDate = (dateKey: string) => {
    const date = new Date(dateKey);
    return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-800 p-3 rounded-lg border border-neutral-700 shadow-lg">
          <p className="font-medium text-white">{formatTooltipDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between text-sm my-1">
              <span style={{ color: entry.color }}>
                {entry.dataKey === 'count' ? 'Ratings:' : entry.name}
              </span>
              <span className="font-semibold text-white ml-4">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  return (
    <div className='w-full'>
      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200/50 dark:border-neutral-700/50 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Activity Tracker</h3>
          </div>
          <div className="flex justify-center sm:justify-end w-full sm:w-auto">
            <DateRangePicker
              startDate={dateRange.start}
              endDate={dateRange.end}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-700 dark:to-neutral-800 rounded-xl border border-neutral-200/50 dark:border-neutral-600/50">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-10 h-10 border-3 border-neutral-300 border-t-blue-500 rounded-full"
            />
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-64 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/30 rounded-xl border border-red-200/50 dark:border-red-700/50">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-700 dark:to-neutral-800 rounded-xl border border-neutral-200/50 dark:border-neutral-600/50">
            <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-600 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">No activity data available</p>
            <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">Try adjusting your date range</p>
          </div>
        ) : (
          <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-700 dark:to-neutral-800 rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-600/50">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#666" strokeOpacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxisLabel}
                  tick={{ fill: '#888', fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fill: '#888', fontSize: 12 }}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="Ratings" 
                  stroke="url(#gradient)" 
                  strokeWidth={3}
                  activeDot={{ r: 6, fill: '#3b82f6' }}
                  animationDuration={1000}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!loading && data.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 p-4 rounded-xl border border-blue-200/50 dark:border-blue-700/50 flex flex-col items-center justify-center group hover:scale-105 transition-transform duration-200">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4" />
                </svg>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">Total Ratings</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {data.reduce((sum, item) => sum + item.count, 0)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30 p-4 rounded-xl border border-green-200/50 dark:border-green-700/50 flex flex-col items-center justify-center group hover:scale-105 transition-transform duration-200">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mb-1 font-medium">Most Active Day</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300 text-center">
                {data.length > 0 
                  ? formatTooltipDate(data.reduce((max, item) => max.count > item.count ? max : item).date) 
                  : 'N/A'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/30 p-4 rounded-xl border border-purple-200/50 dark:border-purple-700/50 flex flex-col items-center justify-center group hover:scale-105 transition-transform duration-200 sm:col-span-2 lg:col-span-1">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mb-1 font-medium">Avg Ratings/Day</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {data.length > 0 
                  ? (data.reduce((sum, item) => sum + item.count, 0) / data.filter(d => d.count > 0).length).toFixed(1) 
                  : '0'}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ActivityTracker;
