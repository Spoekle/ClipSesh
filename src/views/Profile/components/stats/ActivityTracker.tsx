import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { FaChartLine } from 'react-icons/fa';
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
    const parts = value.split('-');
    return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : value;
  };

  const formatTooltipDate = (dateKey: string) => {
    const date = new Date(dateKey);
    return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#181818] p-3 rounded-xl border border-[#262626] shadow-xl text-xs">
          <p className="font-semibold text-[#f1f1f1] mb-1">{formatTooltipDate(label)}</p>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-[#aaaaaa] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cc-red" />
              Ratings
            </span>
            <span className="font-bold text-[#f1f1f1]">{payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-cc-red/15 text-cc-red rounded-lg flex items-center justify-center">
            <FaChartLine size={13} />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#aaaaaa]">
            Activity Velocity
          </h3>
        </div>
        <DateRangePicker
          startDate={dateRange.start}
          endDate={dateRange.end}
          onDateRangeChange={handleDateRangeChange}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 bg-[#141414] rounded-xl border border-[#262626]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#262626] border-t-cc-red"></div>
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center h-64 bg-[#141414] rounded-xl border border-[#262626] text-center p-4">
          <p className="text-xs text-cc-red font-medium">{error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 bg-[#141414] rounded-xl border border-[#262626] text-center p-4">
          <p className="text-xs text-[#aaaaaa] font-medium">No activity data in this range</p>
          <p className="text-[11px] text-[#717171] mt-1">Try expanding your date selection</p>
        </div>
      ) : (
        <div className="w-full h-64 bg-[#141414] rounded-xl p-3 border border-[#262626]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="profileAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f23030" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f23030" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxisLabel}
                tick={{ fill: '#717171', fontSize: 10 }}
                axisLine={{ stroke: '#262626' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#717171', fontSize: 10 }}
                axisLine={{ stroke: '#262626' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                name="Ratings"
                stroke="#f23030"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#profileAreaGradient)"
                activeDot={{ r: 5, fill: '#f23030', stroke: '#181818', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && data.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="bg-[#141414] p-3 rounded-xl border border-[#262626] flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-semibold text-[#717171] uppercase tracking-wider mb-0.5">Total Ratings</span>
            <span className="text-lg font-bold text-[#f1f1f1]">
              {data.reduce((sum, item) => sum + item.count, 0)}
            </span>
          </div>

          <div className="bg-[#141414] p-3 rounded-xl border border-[#262626] flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-semibold text-[#717171] uppercase tracking-wider mb-0.5">Peak Day</span>
            <span className="text-xs font-bold text-[#f1f1f1]">
              {data.length > 0
                ? formatTooltipDate(data.reduce((max, item) => max.count > item.count ? max : item).date)
                : 'N/A'}
            </span>
          </div>

          <div className="bg-[#141414] p-3 rounded-xl border border-[#262626] flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-semibold text-[#717171] uppercase tracking-wider mb-0.5">Avg / Active Day</span>
            <span className="text-lg font-bold text-[#f1f1f1]">
              {data.length > 0
                ? (data.reduce((sum, item) => sum + item.count, 0) / Math.max(1, data.filter(d => d.count > 0).length)).toFixed(1)
                : '0'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTracker;
