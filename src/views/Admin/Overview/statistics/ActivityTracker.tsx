import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { FaChartLine, FaCalendarAlt, FaUsers, FaFire } from 'react-icons/fa';
import DateRangePicker from '../../../../components/DateRangePicker';
import * as ratingService from '../../../../services/ratingService';

interface ActivityData {
  date: string;
  count: number;
  username?: string;
}

interface UserActivityData {
  [key: string]: ActivityData[];
}

interface ActivityTrackerProps {
  clipTeamUsernames?: string[];
}

const ActivityTracker: React.FC<ActivityTrackerProps> = () => {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [userActivityData, setUserActivityData] = useState<UserActivityData>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
    end: new Date(Date.now())
  });
  const [showPerUser, setShowPerUser] = useState<boolean>(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showAllUsers, setShowAllUsers] = useState<boolean>(false);

  useEffect(() => {
    fetchActivityData();
  }, [dateRange]);

  const fetchActivityData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};

      if (dateRange.start) {
        params.startDate = dateRange.start.toISOString().split('T')[0];
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        params.endDate = endDate.toISOString().split('T')[0];
      }

      const data = await ratingService.getRatingActivity(params);
      processActivityData(data);
    } catch (err) {
      console.error('Error fetching activity data:', err);
      setError('Failed to load activity data');
    } finally {
      setIsLoading(false);
    }
  };

  const processActivityData = (userData: any[]) => {
    if (!Array.isArray(userData) || userData.length === 0) {
      setActivityData([]);
      setUserActivityData({});
      return;
    }

    const activityByDate: { [date: string]: number } = {};
    const userActivityByDate: { [username: string]: { [date: string]: number } } = {};
    let earliestDate: Date | null = null;
    let latestDate: Date | null = null;

    userData.forEach((user) => {
      if (!user.username || !Array.isArray(user.ratings)) return;

      if (!userActivityByDate[user.username]) {
        userActivityByDate[user.username] = {};
      }

      user.ratings.forEach((rating: any) => {
        if (!rating.timestamp) return;

        const date = new Date(rating.timestamp);

        if (dateRange.start && date < dateRange.start) return;
        if (dateRange.end) {
          const endOfDay = new Date(dateRange.end);
          endOfDay.setHours(23, 59, 59, 999);
          if (date > endOfDay) return;
        }

        if (!earliestDate || date < earliestDate) earliestDate = date;
        if (!latestDate || date > latestDate) latestDate = date;

        const dateKey = date.toISOString().split('T')[0];

        activityByDate[dateKey] = (activityByDate[dateKey] || 0) + 1;
        userActivityByDate[user.username][dateKey] = (userActivityByDate[user.username][dateKey] || 0) + 1;
      });
    });

    if (!earliestDate || !latestDate) {
      setActivityData([]);
      setUserActivityData({});
      return;
    }

    const allDateKeys = generateAllDateKeys(earliestDate, latestDate);

    const aggregatedActivityData = allDateKeys.map((dateKey) => ({
      date: dateKey,
      count: activityByDate[dateKey] || 0
    }));

    const processedUserActivityData: UserActivityData = {};
    Object.keys(userActivityByDate).forEach((username) => {
      processedUserActivityData[username] = allDateKeys.map((dateKey) => ({
        date: dateKey,
        count: userActivityByDate[username][dateKey] || 0,
        username
      }));
    });

    setActivityData(aggregatedActivityData);
    setUserActivityData(processedUserActivityData);

    if (selectedUsers.length === 0) {
      const activeUsers = Object.keys(processedUserActivityData);
      setSelectedUsers(activeUsers.slice(0, Math.min(5, activeUsers.length)));
    }
  };

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

  const toggleUserSelection = (username: string) => {
    if (selectedUsers.includes(username)) {
      setSelectedUsers(selectedUsers.filter((u) => u !== username));
    } else {
      setSelectedUsers([...selectedUsers, username]);
    }
  };

  const formatXAxisLabel = (value: string) => {
    const parts = value.split('-');
    return parts.length === 3 ? `${parts[1]}/${parts[2]}` : value;
  };

  const formatTooltipDate = (dateKey: string) => {
    const date = new Date(dateKey);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#181818] p-3 rounded-xl border border-[#262626] shadow-2xl min-w-[180px] select-none">
          <p className="font-bold text-xs text-[#f1f1f1] mb-2 pb-1 border-b border-[#262626]">
            {formatTooltipDate(label)}
          </p>
          <div className="space-y-1 text-xs">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span style={{ color: entry.color }} className="font-medium">
                  {entry.dataKey === 'count' ? 'Total Ratings' : entry.dataKey}:
                </span>
                <span className="font-bold text-white bg-[#222222] px-2 py-0.5 rounded-full ml-3">
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

  const stringToHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const generateColor = (username: string): string => {
    const hash = stringToHash(username);
    const hues = [0, 35, 120, 195, 270, 310, 45, 160];
    const hue = hues[hash % hues.length];
    return `hsl(${hue}, 80%, 60%)`;
  };

  const createMergedUserData = () => {
    if (!showPerUser || selectedUsers.length === 0) {
      return activityData;
    }

    const allDates = activityData.map((item) => item.date);

    return allDates.map((date) => {
      const dataPoint: any = { date };
      selectedUsers.forEach((username) => {
        const userDataForDate = userActivityData[username]?.find((item) => item.date === date);
        dataPoint[username] = userDataForDate?.count || 0;
      });
      return dataPoint;
    });
  };

  const totalActivity = activityData.reduce((sum, day) => sum + day.count, 0);
  const activeUserCount = Object.keys(userActivityData).length;

  return (
    <div className="bg-[#181818] rounded-xl border border-[#262626] shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#222222] border border-[#2e2e2e] flex items-center justify-center text-[#f23030]">
            <FaChartLine size={16} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#f1f1f1] leading-tight">
              Activity & Review Velocity
            </h3>
            <p className="text-xs text-[#aaaaaa] mt-0.5">
              Daily review pace and seasonal voting trends
            </p>
          </div>
        </div>

        {/* Quick Header Indicators */}
        {!isLoading && activityData.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#717171] block">Period Total</span>
              <span className="text-sm font-bold text-white">{totalActivity} ratings</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#717171] block">Active Reviewers</span>
              <span className="text-sm font-bold text-white">{activeUserCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="px-4 sm:px-6 py-3 bg-[#141414] border-b border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center bg-[#121212] p-1 rounded-full border border-[#262626]">
            <button
              onClick={() => setShowPerUser(false)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                !showPerUser ? 'bg-[#222222] text-white shadow-xs' : 'text-[#aaaaaa] hover:text-white'
              }`}
            >
              Overall Volume
            </button>
            <button
              onClick={() => setShowPerUser(true)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                showPerUser ? 'bg-[#222222] text-white shadow-xs' : 'text-[#aaaaaa] hover:text-white'
              }`}
            >
              Per Reviewer
            </button>
          </div>

          {showPerUser && Object.keys(userActivityData).length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5">
              {(showAllUsers
                ? Object.keys(userActivityData)
                : Object.keys(userActivityData).slice(0, 8)
              ).map((username) => {
                const isSelected = selectedUsers.includes(username);
                return (
                  <button
                    key={username}
                    onClick={() => toggleUserSelection(username)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-[#222222] border-[#f23030]/60 text-white'
                        : 'bg-[#121212] border-[#262626] text-[#aaaaaa] hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: generateColor(username) }}
                    />
                    <span>{username}</span>
                  </button>
                );
              })}
              {Object.keys(userActivityData).length > 8 && (
                <button
                  onClick={() => setShowAllUsers(!showAllUsers)}
                  className="px-2.5 py-1 rounded-full text-xs text-[#f23030] hover:underline"
                >
                  {showAllUsers ? 'Less' : `+${Object.keys(userActivityData).length - 8} more`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Date Filter */}
        <div className="shrink-0">
          <DateRangePicker
            startDate={dateRange.start}
            endDate={dateRange.end}
            onDateRangeChange={handleDateRangeChange}
            className="w-full sm:w-auto text-xs"
          />
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="h-[360px] bg-[#141414] rounded-xl border border-[#222222] flex flex-col items-center justify-center text-[#aaaaaa] gap-3">
            <div className="w-8 h-8 border-2 border-[#262626] border-t-[#f23030] rounded-full animate-spin" />
            <span className="text-xs">Aggregating rating timeline...</span>
          </div>
        ) : error ? (
          <div className="h-[360px] bg-[#141414] rounded-xl border border-rose-500/20 flex items-center justify-center text-rose-400 text-xs">
            {error}
          </div>
        ) : activityData.length === 0 ? (
          <div className="h-[360px] bg-[#141414] rounded-xl border border-[#222222] flex flex-col items-center justify-center text-[#717171] gap-2">
            <FaChartLine size={28} />
            <span className="text-sm font-semibold text-[#aaaaaa]">No activity in this window</span>
            <span className="text-xs text-[#717171]">Try selecting a broader date range</span>
          </div>
        ) : (
          <div className="w-full h-[360px] bg-[#141414] rounded-xl border border-[#222222] p-3 sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={createMergedUserData()}
                margin={{ top: 15, right: 15, left: -10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="activityGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f23030" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f23030" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222222" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxisLabel}
                  tick={{ fill: '#717171', fontSize: 11 }}
                  axisLine={{ stroke: '#262626' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#717171', fontSize: 11 }}
                  axisLine={{ stroke: '#262626' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
                />

                {!showPerUser ? (
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#f23030"
                    strokeWidth={2.5}
                    fill="url(#activityGlow)"
                    name="Daily Ratings"
                    activeDot={{ r: 5, fill: '#f23030', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                ) : (
                  selectedUsers.map((username) => (
                    <Line
                      key={username}
                      type="monotone"
                      dataKey={username}
                      stroke={generateColor(username)}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      name={username}
                    />
                  ))
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Footer Timeline Summary */}
        {!isLoading && activityData.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#141414] p-3 rounded-xl border border-[#262626] flex items-center justify-between">
              <span className="text-xs text-[#aaaaaa]">Total Ratings</span>
              <span className="text-sm font-bold text-white">{totalActivity}</span>
            </div>
            <div className="bg-[#141414] p-3 rounded-xl border border-[#262626] flex items-center justify-between">
              <span className="text-xs text-[#aaaaaa]">Peak Review Day</span>
              <span className="text-sm font-bold text-[#f23030]">
                {formatTooltipDate(
                  activityData.reduce((max, item) => (item.count > max.count ? item : max), activityData[0]).date
                )}
              </span>
            </div>
            <div className="bg-[#141414] p-3 rounded-xl border border-[#262626] flex items-center justify-between">
              <span className="text-xs text-[#aaaaaa]">Daily Velocity</span>
              <span className="text-sm font-bold text-emerald-400">
                ~{Math.round(totalActivity / (activityData.length || 1))} / day
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTracker;
