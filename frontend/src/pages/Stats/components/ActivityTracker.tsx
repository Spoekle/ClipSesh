import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiUrl from '../../../config/config';
import { motion } from 'framer-motion';
import { FaChartLine } from 'react-icons/fa';
import DateRangePicker from '../../../components/DateRangePicker';

interface DataPoint {
  date: string;
  count: number;
}

const ActivityTracker: React.FC = () => {
  const [rawRatings, setRawRatings] = useState<any[]>([]);
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });

  // fetch user-specific ratings when dateRange changes
  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const params: any = {};
        
        // Add date range parameters if set
        if (dateRange.start) {
          params.startDate = dateRange.start.toISOString().split('T')[0];
        }
        if (dateRange.end) {
          // Ensure end date includes the full day
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          params.endDate = endDate.toISOString().split('T')[0];
        }
        
        const res = await axios.get(`${apiUrl}/api/ratings/my-ratings`, {
          headers: { Authorization: `Bearer ${token}` },
          params
        });
        setRawRatings(res.data.ratings || []);
      } catch (e) {
        setError('Unable to load activity');
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [dateRange]);

  // process rawRatings into time-series data when rawRatings updates
  useEffect(() => {  
    const counts: Record<string, number> = {};
    let earliestDate: Date | null = null;
    let latestDate: Date | null = null;
    
    rawRatings.forEach(r => {
      const dt = new Date(r.timestamp);
      
      // Filter by custom date range if set
      if (dateRange.start && dt < dateRange.start) {
        return;
      }
      if (dateRange.end) {
        // Create end of day for comparison
        const endOfDay = new Date(dateRange.end);
        endOfDay.setHours(23, 59, 59, 999);
        if (dt > endOfDay) {
          return;
        }
      }
      
      // Track date range
      if (!earliestDate || dt < earliestDate) {
        earliestDate = dt;
      }
      if (!latestDate || dt > latestDate) {
        latestDate = dt;
      }
      
      // Use daily view for consistency
      const key = dt.toISOString().split('T')[0];
      counts[key] = (counts[key] || 0) + 1;
    });

    // If we have data, generate all date keys in the range to fill in zeros
    if (earliestDate && latestDate) {
      const allKeys = generateAllDateKeys(earliestDate, latestDate);
      const chartData = allKeys.map(date => ({ date, count: counts[date] || 0 }));
      setData(chartData);
    } else {
      console.log('No data found, setting empty array');
      setData([]);
    }
  }, [rawRatings]);
  
  // Helper function to generate all date keys in the range (daily view)
  const generateAllDateKeys = (startDate: Date, endDate: Date): string[] => {
    const dateKeys: string[] = [];
    
    // Get date strings directly to avoid timezone issues
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Create dates from the ISO date strings to ensure consistency
    const currentDate = new Date(startDateStr + 'T00:00:00.000Z');
    const finalDate = new Date(endDateStr + 'T00:00:00.000Z');
    
    while (currentDate <= finalDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dateKeys.push(dateKey);
      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return dateKeys;
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setDateRange({ start, end });
  };
  
  const formatXAxisLabel = (value: string) => {
    // For daily view, show day of month
    return value.split('-')[2];
  };
  
  const formatTooltipDate = (dateKey: string) => {
    // For daily view, format as readable date
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
      <div className="bg-neutral-300 dark:bg-neutral-800 p-5 rounded-xl shadow-lg mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between mb-6 gap-4">
          <div className="flex justify-center sm:justify-end w-full">
            <DateRangePicker
              startDate={dateRange.start}
              endDate={dateRange.end}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 bg-neutral-200 dark:bg-neutral-700 rounded-lg">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 bg-neutral-200 dark:bg-neutral-700 rounded-lg">
            <p className="text-red-500">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center h-64 bg-neutral-200 dark:bg-neutral-700 rounded-lg">
            <p className="text-neutral-500">No activity data available for the selected filters</p>
          </div>
        ) : (
          <div className="w-full h-64 sm:h-80">
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
                  stroke="#8884d8" 
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!loading && data.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
          >
            <div className="bg-neutral-200 dark:bg-neutral-700 p-3 sm:p-4 rounded-lg flex flex-col items-center justify-center">
              <p className="text-xs sm:text-sm text-neutral-500 mb-1">Total Ratings</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-500">
                {data.reduce((sum, item) => sum + item.count, 0)}
              </p>
            </div>
            <div className="bg-neutral-200 dark:bg-neutral-700 p-3 sm:p-4 rounded-lg flex flex-col items-center justify-center">
              <p className="text-xs sm:text-sm text-neutral-500 mb-1">Most Active Day</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-500 text-center">
                {data.length > 0 
                  ? formatTooltipDate(data.reduce((max, item) => max.count > item.count ? max : item).date) 
                  : 'N/A'}
              </p>
            </div>
            <div className="bg-neutral-200 dark:bg-neutral-700 p-3 sm:p-4 rounded-lg flex flex-col items-center justify-center sm:col-span-2 lg:col-span-1">
              <p className="text-xs sm:text-sm text-neutral-500 mb-1">Avg Ratings/Day</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-500">
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
