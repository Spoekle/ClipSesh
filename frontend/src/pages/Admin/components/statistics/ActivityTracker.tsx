import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import apiUrl from '../../../../config/config';
import { FaChartLine } from 'react-icons/fa';
import DateRangePicker from '../../../../components/DateRangePicker';

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
  const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
  const [showPerUser, setShowPerUser] = useState<boolean>(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchActivityData();
  }, [dateRange]);  const fetchActivityData = async () => {
    setIsLoading(true);
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
      
      const response = await axios.get(`${apiUrl}/api/ratings/activity`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      processActivityData(response.data);
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

        // Filter by custom date range if set
        if (dateRange.start && date < dateRange.start) return;
        if (dateRange.end) {
          // Create end of day for comparison
          const endOfDay = new Date(dateRange.end);
          endOfDay.setHours(23, 59, 59, 999);
          if (date > endOfDay) return;
        }

        if (!earliestDate || date < earliestDate) earliestDate = date;
        if (!latestDate || date > latestDate) latestDate = date;

        let dateKey: string;

        // Fixed to daily view for simplicity
        dateKey = date.toISOString().split('T')[0];

        activityByDate[dateKey] = (activityByDate[dateKey] || 0) + 1;

        userActivityByDate[user.username][dateKey] = (userActivityByDate[user.username][dateKey] || 0) + 1;
      });
    });

    if (!earliestDate || !latestDate) {
      setActivityData([]);
      setUserActivityData({});
      return;
    }

    // Generate all date keys in the range (using daily view)
    const allDateKeys = generateAllDateKeys(earliestDate, latestDate);
    
    // Make sure all dates in range are included in the activity data (with 0 values for empty dates)
    const aggregatedActivityData = allDateKeys.map(dateKey => ({
      date: dateKey,
      count: activityByDate[dateKey] || 0
    }));

    // Make sure all users have entries for all dates in the range
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

  const toggleUserSelection = (username: string) => {
    if (selectedUsers.includes(username)) {
      setSelectedUsers(selectedUsers.filter(u => u !== username));
    } else {
      setSelectedUsers([...selectedUsers, username]);
    }
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
                {entry.dataKey === 'count' ? `${entry.name}:` : `${entry.name}:`}
              </span>
              <span className="font-semibold text-white ml-4">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // String hash function to generate a consistent hash value for a username
  const stringToHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  // Generate HSL color based on username hash for better uniqueness
  const generateColor = (username: string): string => {
    const hash = stringToHash(username);
    
    // Generate hue from hash (0-360 degrees)
    const hue = hash % 360;
    
    // Use higher saturation and varied lightness for better distinction
    const saturation = 65 + (hash % 25); // 65-90%
    const lightness = 45 + (hash % 20); // 45-65%
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  return (
    <>
      <div className="mt-10 mb-4">
        <h3 className="text-xl font-bold flex items-center">
          <FaChartLine className="mr-2 text-purple-500" />
          Rating Activity Timeline
        </h3>
      </div>

      <div className="bg-neutral-300 dark:bg-neutral-800 p-4 sm:p-5 rounded-xl shadow-lg mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between mb-6 gap-4">
          <button
            onClick={() => setShowPerUser(!showPerUser)}
            className={`px-4 py-2 sm:py-1.5 rounded-lg text-sm flex items-center justify-center gap-2 ${
              showPerUser
                ? 'bg-purple-600 text-white'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <span>{showPerUser ? 'Show Total Activity' : 'Show Per User'}</span>
          </button>

          <DateRangePicker
            startDate={dateRange.start}
            endDate={dateRange.end}
            onDateRangeChange={handleDateRangeChange}
            className="w-full sm:w-auto"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64 bg-neutral-200 dark:bg-neutral-700 rounded-lg">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 bg-neutral-200 dark:bg-neutral-700 rounded-lg">
            <p className="text-red-500">{error}</p>
          </div>
        ) : activityData.length === 0 ? (
          <div className="flex justify-center items-center h-64 bg-neutral-200 dark:bg-neutral-700 rounded-lg">
            <p className="text-neutral-500">No activity data available for the selected filters</p>
          </div>
        ) : (
          <>
            <div className="w-full h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                {!showPerUser ? (
                  <LineChart
                    data={activityData}
                    margin={{ top: 5, right: 10, left: 10, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#555" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#888', fontSize: 10 }}
                      tickFormatter={formatXAxisLabel}
                      height={50}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: '#888', fontSize: 10 }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Total Ratings"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                ) : (
                  <LineChart
                    margin={{ top: 5, right: 10, left: 10, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#555" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#888', fontSize: 10 }}
                      tickFormatter={formatXAxisLabel}
                      allowDuplicatedCategory={false}
                      type="category"
                      height={50}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: '#888', fontSize: 10 }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {Object.entries(userActivityData)
                      .filter(([username]) => selectedUsers.includes(username))
                      .map(([username, data]) => (
                        <Line
                          key={username}
                          type="monotone"
                          data={data}
                          dataKey="count"
                          name={username}
                          stroke={generateColor(username)}
                          activeDot={{ r: 6 }}
                          strokeWidth={2}
                        />
                      ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {showPerUser && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-3">Select users to display (max 5 recommended):</p>
                <div className="flex flex-wrap gap-2 mt-1 pb-2 max-h-32 overflow-y-auto">
                  {Object.keys(userActivityData).map((username) => (
                    <button
                      key={username}
                      onClick={() => toggleUserSelection(username)}
                      className={`px-3 py-2 sm:px-2 sm:py-1 rounded-md text-xs font-medium transition-colors touch-manipulation ${
                        selectedUsers.includes(username)
                          ? 'bg-opacity-100 text-white'
                          : 'bg-opacity-50 text-neutral-300'
                      }`}
                      style={{
                        backgroundColor: selectedUsers.includes(username)
                          ? generateColor(username)
                          : '#555555'
                      }}
                    >
                      {username}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!isLoading && activityData.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-neutral-200 dark:bg-neutral-700 p-4 rounded-lg flex flex-col items-center justify-center">
              <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 text-center">Total Ratings</div>
              <div className="text-lg sm:text-xl font-bold mt-1">
                {activityData.reduce((sum, item) => sum + item.count, 0)}
              </div>
            </div>
            <div className="bg-neutral-200 dark:bg-neutral-700 p-4 rounded-lg flex flex-col items-center justify-center">
              <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 text-center">Most Active Day</div>
              <div className="text-sm sm:text-lg font-bold mt-1 text-center">
                {activityData.length > 0
                  ? formatTooltipDate(activityData.reduce((max, item) =>
                      item.count > max.count ? item : max, activityData[0]).date)
                  : 'N/A'}
              </div>
            </div>
            <div className="bg-neutral-200 dark:bg-neutral-700 p-4 rounded-lg flex flex-col items-center justify-center sm:col-span-2 lg:col-span-1">
              <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 text-center">Active Users</div>
              <div className="text-lg sm:text-xl font-bold mt-1">
                {Object.keys(userActivityData).length}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ActivityTracker;