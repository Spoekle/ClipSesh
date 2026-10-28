'use client';

import React, { useState, useMemo } from 'react';
import '@/lib/chart';
import { Line } from 'react-chartjs-2';
import type { ChartOptions, Chart as ChartJS, TooltipModel } from 'chart.js';
import { LineChart, Loader2 } from 'lucide-react';
import DateRangePicker from '../DateRangePicker';
import useActivityData, { ActivityData, UserActivityData } from './activity/useActivityData';
import ActivityVelocityMetrics from './activity/ActivityVelocityMetrics';

interface ActivityTrackerProps {
  clipTeamUsernames?: string[];
}

export const ActivityTracker: React.FC<ActivityTrackerProps> = () => {
  const {
    activityData,
    userActivityData,
    isLoading,
    error,
    dateRange,
    setDateRange,
  } = useActivityData();

  const [showPerUser, setShowPerUser] = useState<boolean>(false);

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

  const customActivityTooltip = (context: { chart: ChartJS<'line'>; tooltip: TooltipModel<'line'> }) => {
    const { chart, tooltip } = context;
    let tooltipEl = chart.canvas.parentNode?.querySelector(
      '.chartjs-activity-tooltip'
    ) as HTMLDivElement | null;

    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className =
        'chartjs-activity-tooltip pointer-events-none absolute z-50 transition-all duration-75';
      chart.canvas.parentNode?.appendChild(tooltipEl);
    }

    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = '0';
      return;
    }

    const title = tooltip.title?.[0] || '';
    const dateFormatted = formatTooltipDate(title);

    const validDataPoints = [...(tooltip.dataPoints || [])]
      .filter((dp) => {
        const val = Number(dp.raw ?? dp.formattedValue ?? 0);
        return showPerUser ? val > 0 : true;
      })
      .sort((a, b) => Number(b.raw || 0) - Number(a.raw || 0));

    const itemsHtml =
      validDataPoints.length > 0
        ? validDataPoints
            .map((dp) => {
              const dataset = dp.dataset;
              const color =
                typeof dataset.borderColor === 'string'
                  ? dataset.borderColor
                  : typeof dataset.backgroundColor === 'string'
                  ? dataset.backgroundColor
                  : '#f23030';
              const label = dataset.label || 'Total Ratings';
              const val = dp.formattedValue || dp.raw;
              return `
                <div class="flex justify-between items-center gap-3">
                  <span style="color: ${color}" class="font-medium">${label}:</span>
                  <span class="font-bold text-white bg-cc-ground px-2 py-0.5 rounded-full ml-auto">${val}</span>
                </div>
              `;
            })
            .join('')
        : `<p class="text-xs text-muted-foreground italic py-0.5">No reviews on this day</p>`;

    tooltipEl.innerHTML = `
      <div class="bg-cc-card p-3 rounded-xl border border-border shadow-2xl min-w-[180px] select-none text-xs">
        <p class="font-bold text-xs text-white mb-2 pb-1 border-b border-border">
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
            label: 'Total Reviews',
            data: activityData.map((item) => item.count),
            borderColor: '#f23030',
            backgroundColor: (context: { chart: ChartJS }) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, 'rgba(242, 48, 48, 0.35)');
              gradient.addColorStop(1, 'rgba(242, 48, 48, 0.0)');
              return gradient;
            },
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 2,
            pointHoverRadius: 6,
            pointBackgroundColor: '#f23030',
          },
        ],
      };
    }

    const usernames = Object.keys(userActivityData);
    return {
      labels,
      datasets: usernames.map((username, index) => {
        const color = generateColor(username);
        return {
          label: username,
          data: (userActivityData[username] || []).map((item) => item.count),
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

  const peakDay =
    activityData.length > 0
      ? activityData.reduce((max, item) => (item.count > max.count ? item : max), activityData[0])
      : null;

  return (
    <div className="bg-cc-card rounded-xl border border-border shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cc-ground border border-border flex items-center justify-center text-primary">
            <LineChart className="size-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">
              Activity & Review Velocity
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daily review pace and seasonal voting trends
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center bg-cc-ground p-1 rounded-full border border-border">
            <button
              type="button"
              onClick={() => setShowPerUser(false)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                !showPerUser ? 'bg-border text-white shadow-xs' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Overall Volume
            </button>
            <button
              type="button"
              onClick={() => setShowPerUser(true)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                showPerUser ? 'bg-border text-white shadow-xs' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Per Member
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
          <div className="h-[360px] bg-cc-ground rounded-xl border border-border flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Loader2 className="size-8 text-primary animate-spin" />
            <span className="text-xs">Aggregating rating timeline...</span>
          </div>
        ) : error ? (
          <div className="h-[360px] bg-cc-ground rounded-xl border border-rose-500/20 flex items-center justify-center text-rose-400 text-xs">
            {error}
          </div>
        ) : activityData.length === 0 ? (
          <div className="h-[360px] bg-cc-ground rounded-xl border border-border flex flex-col items-center justify-center text-muted-foreground gap-2">
            <LineChart className="size-7" />
            <span className="text-sm font-semibold text-white">No activity in this window</span>
            <span className="text-xs text-muted-foreground">Try selecting a broader date range</span>
          </div>
        ) : (
          <div className="w-full h-[360px] bg-cc-ground rounded-xl border border-border p-3 sm:p-4 relative">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}

        {!isLoading && activityData.length > 0 && (
          <ActivityVelocityMetrics
            totalActivity={totalActivity}
            activeUserCount={activeUserCount}
            peakDateFormatted={peakDay ? formatTooltipDate(peakDay.date) : 'N/A'}
            dailyVelocity={Math.round(totalActivity / (activityData.length || 1))}
          />
        )}
      </div>
    </div>
  );
};

export default ActivityTracker;
