'use client';

import React, { useState, useEffect, useMemo } from 'react';
import '@/lib/chart';
import { Line } from 'react-chartjs-2';
import type { ChartOptions, ScriptableContext } from 'chart.js';
import { FaChartLine } from 'react-icons/fa';
import DateRangePicker from '../DateRangePicker';
import * as ratingService from '@/services/ratingService';

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
    end: new Date(Date.now()),
  });
  const [showPerUser, setShowPerUser] = useState<boolean>(false);

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
      count: activityByDate[dateKey] || 0,
    }));

    const processedUserActivityData: UserActivityData = {};
    Object.keys(userActivityByDate).forEach((username) => {
      processedUserActivityData[username] = allDateKeys.map((dateKey) => ({
        date: dateKey,
        count: userActivityByDate[username][dateKey] || 0,
        username,
      }));
    });

    setActivityData(aggregatedActivityData);
    setUserActivityData(processedUserActivityData);
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

  const formatXAxisLabel = (value: string) => {
    const parts = value.split('-');
    return parts.length === 3 ? `${parts[1]}/${parts[2]}` : value;
  };

  const formatTooltipDate = (dateKey: string) => {
    if (!dateKey) return '';
    const date = new Date(dateKey);
    if (isNaN(date.getTime())) return dateKey;
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const customActivityTooltip = (context: any) => {
    const { chart, tooltip } = context;
    let tooltipEl = chart.canvas.parentNode?.querySelector('.chartjs-activity-tooltip') as HTMLDivElement | null;

    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'chartjs-activity-tooltip pointer-events-none absolute z-50 transition-all duration-75';
      chart.canvas.parentNode?.appendChild(tooltipEl);
    }

    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = '0';
      return;
    }

    const title = tooltip.title?.[0] || '';
    const dateFormatted = formatTooltipDate(title);

    const validDataPoints = [...(tooltip.dataPoints || [])]
      .filter((dp: any) => {
        const val = Number(dp.raw ?? dp.formattedValue ?? 0);
        if (showPerUser) {
          return val > 0;
        }
        return true;
      })
      .sort((a: any, b: any) => Number(b.raw || 0) - Number(a.raw || 0));

    const itemsHtml =
      validDataPoints.length > 0
        ? validDataPoints
            .map((dp: any) => {
              const color = dp.dataset.borderColor || dp.dataset.backgroundColor || '#f23030';
              const label = dp.dataset.label || 'Total Ratings';
              const val = dp.formattedValue || dp.raw;
              return `
                <div class="flex justify-between items-center gap-3">
                  <span style="color: ${color}" class="font-medium">${label}:</span>
                  <span class="font-bold text-white bg-[#222222] px-2 py-0.5 rounded-full ml-auto">${val}</span>
                </div>
              `;
            })
            .join('')
        : `<p class="text-xs text-[#717171] italic py-0.5">No reviews on this day</p>`;

    tooltipEl.innerHTML = `
      <div class="bg-[#181818] p-3 rounded-xl border border-[#262626] shadow-2xl min-w-[180px] select-none text-xs">
        <p class="font-bold text-xs text-[#f1f1f1] mb-2 pb-1 border-b border-[#262626]">
          ${dateFormatted}
        </p>
        <div class="space-y-1 text-xs">
          ${itemsHtml}
        </div>
      </div>
    `;

    const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
    const chartWidth = chart.width;
    const clampedX = Math.max(90, Math.min(chartWidth - 90, tooltip.caretX));
    const yAlign = tooltip.caretY < 120 ? 'translate(-50%, 15px)' : 'translate(-50%, -105%)';
    tooltipEl.style.opacity = '1';
    tooltipEl.style.left = positionX + clampedX + 'px';
    tooltipEl.style.top = positionY + tooltip.caretY + 'px';
    tooltipEl.style.transform = yAlign;
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

  const chartData = useMemo(() => {
    const labels = activityData.map((item) => item.date);

    if (!showPerUser) {
      return {
        labels,
        datasets: [
          {
            label: 'Daily Ratings',
            data: activityData.map((item) => item.count),
            borderColor: '#f23030',
            borderWidth: 2.5,
            fill: true,
            backgroundColor: (context: ScriptableContext<'line'>) => {
              const ctx = context.chart?.ctx;
              if (!ctx) return 'rgba(242, 48, 48, 0.2)';
              const gradient = ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, 'rgba(242, 48, 48, 0.35)');
              gradient.addColorStop(1, 'rgba(242, 48, 48, 0)');
              return gradient;
            },
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#f23030',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
          },
        ],
      };
    }

    const usersWithVotes = Object.keys(userActivityData)
      .map((username) => {
        const totalVotes = (userActivityData[username] || []).reduce((sum, item) => sum + item.count, 0);
        return { username, totalVotes };
      })
      .filter((u) => u.totalVotes > 0)
      .sort((a, b) => b.totalVotes - a.totalVotes)
      .map((u) => u.username);

    return {
      labels,
      datasets: usersWithVotes.map((username, index) => {
        const color = generateColor(username);
        return {
          label: username,
          data: labels.map((date) => {
            const userForDate = userActivityData[username]?.find((item) => item.date === date);
            return userForDate?.count || 0;
          }),
          borderColor: color,
          backgroundColor: color,
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
          hidden: index >= 8,
        };
      }),
    };
  }, [activityData, showPerUser, userActivityData]);

  const chartOptions: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 8,
            boxHeight: 8,
            usePointStyle: true,
            pointStyle: 'circle',
            color: '#aaaaaa',
            font: { size: 11 },
            padding: 12,
          },
        },
        tooltip: {
          enabled: false,
          external: customActivityTooltip,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#717171',
            font: { size: 11 },
            callback: function (val) {
              const label = this.getLabelForValue(Number(val));
              return formatXAxisLabel(label);
            },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12,
          },
          border: {
            color: '#262626',
          },
        },
        y: {
          grid: {
            color: '#222222',
            borderDash: [3, 3],
          },
          ticks: {
            color: '#717171',
            font: { size: 11 },
            precision: 0,
          },
          border: {
            color: '#262626',
          },
          beginAtZero: true,
        },
      },
    }),
    []
  );

  const totalActivity = activityData.reduce((sum, day) => sum + day.count, 0);
  const activeUserCount = Object.keys(userActivityData).filter((username) =>
    (userActivityData[username] || []).some((item) => item.count > 0)
  ).length;

  return (
    <div className="bg-[#181818] rounded-xl border border-[#262626] shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-4">
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

        <div className="flex items-center flex-wrap gap-2.5">
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

          <DateRangePicker
            startDate={dateRange.start}
            endDate={dateRange.end}
            onDateRangeChange={handleDateRangeChange}
            className="w-full sm:w-auto text-xs"
          />
        </div>
      </div>

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
          <div className="w-full h-[360px] bg-[#141414] rounded-xl border border-[#222222] p-3 sm:p-4 relative">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}

        {!isLoading && activityData.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#141414] p-3 rounded-xl border border-[#262626] flex items-center justify-between">
              <span className="text-xs text-[#aaaaaa]">Total Ratings</span>
              <span className="text-sm font-bold text-white">{totalActivity}</span>
            </div>
            <div className="bg-[#141414] p-3 rounded-xl border border-[#262626] flex items-center justify-between">
              <span className="text-xs text-[#aaaaaa]">Active Reviewers</span>
              <span className="text-sm font-bold text-white">{activeUserCount}</span>
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
