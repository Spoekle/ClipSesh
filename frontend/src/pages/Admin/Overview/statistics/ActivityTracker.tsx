import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaChartLine } from 'react-icons/fa';
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
  clipTeamUsernames: string[];
}

const ActivityTracker: React.FC<ActivityTrackerProps> = () => {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [userActivityData, setUserActivityData] = useState<UserActivityData>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({
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
    } catch (error) {
      console.error('Error fetching activity data:', error);
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

    userData.forEach(user => {
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

    const aggregatedActivityData = allDateKeys.map(dateKey => ({
      date: dateKey,
      count: activityByDate[dateKey] || 0
    }));

    const processedUserActivityData: UserActivityData = {};
    Object.keys(userActivityByDate).forEach(username => {
      processedUserActivityData[username] = allDateKeys.map(dateKey => ({
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
      setSelectedUsers(selectedUsers.filter(u => u !== username));
    } else {
      setSelectedUsers([...selectedUsers, username]);
    }
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
        <div className="bg-neutral-200 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 shadow-xl">
          <p className="font-medium text-neutral-800 dark:text-white mb-2">
            {formatTooltipDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center">
              <span style={{ color: entry.color }} className="font-medium">
                {entry.dataKey === 'count' ? 'Activity' : entry.dataKey}:
              </span>
              <span className="font-semibold text-neutral-800 dark:text-white ml-4">
                {entry.value} ratings
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const stringToHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const generateColor = (username: string): string => {
    const hash = stringToHash(username);
    const hue = hash % 360;
    const saturation = 65 + (hash % 25);
    const lightness = 45 + (hash % 20);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Create merged dataset for multiple users
  const createMergedUserData = () => {
    if (!showPerUser || selectedUsers.length === 0) {
      return activityData;
    }

    // Get all dates from the activity data
    const allDates = activityData.map(item => item.date);

    // Create merged data structure
    return allDates.map(date => {
      const dataPoint: any = { date };

      selectedUsers.forEach(username => {
        const userDataForDate = userActivityData[username]?.find(item => item.date === date);
        dataPoint[username] = userDataForDate?.count || 0;
      });

      return dataPoint;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-neutral-200/80 dark:border-neutral-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2.5 rounded-lg shadow-sm">
              <FaChartLine className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                Activity Timeline
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                Track rating activity patterns over time
              </p>
            </div>
          </div>

          {/* Activity Stats */}
          {!isLoading && activityData.length > 0 && (
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                  {activityData.reduce((sum, day) => sum + day.count, 0)}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Total Activity</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                  {Object.keys(userActivityData).length}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Active Users</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls and Chart Section */}
      <div className="bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl shadow-sm border border-neutral-200/80 dark:border-neutral-700/50 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowPerUser(!showPerUser)}
                className={`px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${showPerUser
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-600'
                  }`}
              >
                {showPerUser ? 'Show Overall' : 'Show Per User'}
              </button>

              {showPerUser && Object.keys(userActivityData).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {/* Show first 4 users or all users based on showAllUsers state */}
                  {(showAllUsers ? Object.keys(userActivityData) : Object.keys(userActivityData).slice(0, 10)).map(username => (
                    <button
                      key={username}
                      onClick={() => toggleUserSelection(username)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 shadow-sm hover:shadow-md transform hover:scale-105 ${selectedUsers.includes(username)
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-purple-200 dark:shadow-purple-800/20'
                        : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        {selectedUsers.includes(username) && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: generateColor(username) }}
                          />
                        )}
                        {username}
                      </span>
                    </button>
                  ))}
                  {/* Show expand/collapse button when there are more than 4 users */}
                  {Object.keys(userActivityData).length > 4 && (
                    <button
                      onClick={() => setShowAllUsers(!showAllUsers)}
                      className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 px-2 py-1 rounded transition-colors duration-200 bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-500"
                    >
                      {showAllUsers ? 'Show Less' : `+${Object.keys(userActivityData).length - 10} more`}
                    </button>
                  )}
                </div>
              )}
            </div>

            <DateRangePicker
              startDate={dateRange.start}
              endDate={dateRange.end}
              onDateRangeChange={handleDateRangeChange}
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="bg-neutral-300 dark:bg-neutral-800 rounded-xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-neutral-600 dark:text-neutral-400">Loading activity data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl p-6 text-center">
              <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
            </div>
          ) : activityData.length === 0 ? (
            <div className="bg-neutral-300 dark:bg-neutral-800 rounded-xl p-8 text-center">
              <FaChartLine className="text-4xl text-neutral-500 dark:text-neutral-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                No Activity Data
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400">
                No rating activity found for the selected date range.
              </p>
            </div>
          ) : (
            <div className="bg-neutral-300 dark:bg-neutral-800 rounded-xl p-4" style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={createMergedUserData()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatXAxisLabel}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />

                  {!showPerUser ? (
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                      name="Total Activity"
                    />
                  ) : (
                    selectedUsers.slice(0, 10).map((username) => (
                      <Line
                        key={username}
                        type="monotone"
                        dataKey={username}
                        stroke={generateColor(username)}
                        strokeWidth={2}
                        dot={{ fill: generateColor(username), strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5 }}
                        name={username}
                      />
                    ))
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Summary Stats */}
          {!isLoading && activityData.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-neutral-100 dark:bg-neutral-800/50 p-3 rounded-lg text-center border border-neutral-200 dark:border-neutral-700">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Total Ratings</div>
                <div className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                  {activityData.reduce((sum, item) => sum + item.count, 0)}
                </div>
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-800/50 p-3 rounded-lg text-center border border-neutral-200 dark:border-neutral-700">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Most Active Day</div>
                <div className="text-base font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                  {activityData.length > 0
                    ? formatTooltipDate(activityData.reduce((max, item) =>
                      item.count > max.count ? item : max, activityData[0]).date)
                    : 'N/A'}
                </div>
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-800/50 p-3 rounded-lg text-center border border-neutral-200 dark:border-neutral-700">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Average Daily</div>
                <div className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                  {activityData.length > 0
                    ? Math.round(activityData.reduce((sum, item) => sum + item.count, 0) / activityData.length)
                    : 0}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityTracker;
