'use client';

import React, { useState, useMemo } from 'react';
import '@/lib/chart';
import { Bar, Doughnut } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import {
  FaChartBar,
  FaChartPie,
  FaLayerGroup,
  FaStar,
  FaUserCheck,
  FaCheckCircle,
  FaVideo,
  FaTimesCircle,
  FaHourglassHalf,
} from 'react-icons/fa';
import { UserRating, PieData } from '@/types/adminTypes';

/* --- Custom Tooltips --- */
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

interface PieTooltipData {
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
    const data = payload[0].payload as PieTooltipData;
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

/* --- Summary Stats --- */
interface SummaryStatsProps {
  totalRatings: number;
  averageRatings: number;
  mostActiveUser: string;
  totalClips: number;
  ratedClips: number;
  unratedClips: number;
  deniedClips: number;
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({
  totalRatings,
  averageRatings,
  mostActiveUser,
  totalClips,
  ratedClips,
  unratedClips,
  deniedClips,
}) => {
  const completionRate = totalClips > 0 ? ((ratedClips / totalClips) * 100).toFixed(1) : '0';

  const primaryStats = [
    {
      label: 'Total Submissions',
      value: totalClips.toLocaleString(),
      subtext: 'Current season pool',
      icon: FaVideo,
      iconColor: 'text-sky-400',
      badge: `${totalClips} clips`,
    },
    {
      label: 'Reviewed Clips',
      value: ratedClips.toLocaleString(),
      subtext: `${completionRate}% reviewed`,
      icon: FaCheckCircle,
      iconColor: 'text-emerald-400',
      badge: `${completionRate}%`,
    },
    {
      label: 'Unrated Queue',
      value: unratedClips.toLocaleString(),
      subtext: 'Awaiting team review',
      icon: FaHourglassHalf,
      iconColor: 'text-amber-400',
      badge: `${unratedClips} left`,
    },
    {
      label: 'Denied Clips',
      value: deniedClips.toLocaleString(),
      subtext: 'Threshold met',
      icon: FaTimesCircle,
      iconColor: 'text-rose-400',
      badge: `${deniedClips} denied`,
    },
  ];

  const secondaryStats = [
    {
      label: 'Total Team Ratings',
      value: totalRatings.toLocaleString(),
      subtext: 'Cumulative votes cast',
      icon: FaStar,
      iconColor: 'text-[#f23030]',
    },
    {
      label: 'Avg Ratings / Member',
      value: Math.round(averageRatings).toLocaleString(),
      subtext: 'Reviewer average',
      icon: FaUserCheck,
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Top Reviewer',
      value: mostActiveUser,
      subtext: 'Highest contributions',
      icon: FaStar,
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {primaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[#181818] p-4 rounded-xl border border-[#262626] shadow-sm hover:border-[#383838] transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#2e2e2e] flex items-center justify-center shrink-0">
                  <Icon className={stat.iconColor} size={15} />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-[11px] text-[#717171] mt-1 flex items-center gap-1.5">
                  <span>{stat.subtext}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {secondaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[#181818] p-4 rounded-xl border border-[#262626] shadow-sm hover:border-[#383838] transition-all flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider block mb-1">
                  {stat.label}
                </span>
                <div className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                  {stat.value}
                </div>
                <span className="text-[11px] text-[#717171] block mt-0.5">
                  {stat.subtext}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#222222] border border-[#2e2e2e] flex items-center justify-center shrink-0">
                <Icon className={stat.iconColor} size={18} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* --- Rating Distribution --- */
interface RatingDistributionProps {
  userRatings: UserRating[];
  sortBy: string;
  setSortBy: React.Dispatch<React.SetStateAction<string>>;
}

const TIER_COLORS = {
  'Rated 4': '#f23030',
  'Rated 3': '#f97316',
  'Rated 2': '#eab308',
  'Rated 1': '#38bdf8',
  'Rated Deny': '#717171',
};

const PIE_COLORS = ['#f23030', '#f97316', '#eab308', '#38bdf8', '#717171'];

const customBarTooltip = (context: any, ratings: UserRating[]) => {
  const { chart, tooltip } = context;
  let tooltipEl = chart.canvas.parentNode?.querySelector('.chartjs-bar-tooltip') as HTMLDivElement | null;

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'chartjs-bar-tooltip pointer-events-none absolute z-50 transition-all duration-75';
    chart.canvas.parentNode?.appendChild(tooltipEl);
  }

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    return;
  }

  const dataIndex = tooltip.dataPoints?.[0]?.dataIndex;
  if (dataIndex === undefined) return;
  const userData = ratings[dataIndex];
  if (!userData) return;

  const coverage = userData.percentageRated ?? 0;
  const coverageClass =
    coverage >= 20
      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30';

  tooltipEl.innerHTML = `
    <div class="p-4 bg-[#181818] shadow-2xl rounded-xl border border-[#262626] min-w-[200px] select-none text-xs">
      <h3 class="text-sm font-bold text-[#f1f1f1] mb-2.5 flex items-center justify-between">
        <span>${userData.username}</span>
        <span class="text-[10px] font-medium text-[#aaaaaa]">Reviewer</span>
      </h3>
      <div class="space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span class="text-[#aaaaaa]">Total Ratings:</span>
          <span class="font-semibold text-white bg-[#222222] px-2 py-0.5 rounded-full">
            ${userData.total}
          </span>
        </div>
        <div class="flex justify-between items-center text-xs">
          <span class="text-[#aaaaaa]">Coverage:</span>
          <span class="font-semibold px-2 py-0.5 rounded-full ${coverageClass}">
            ${coverage.toFixed(1)}%
          </span>
        </div>
        <div class="mt-3 pt-2.5 border-t border-[#262626]">
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="flex justify-between text-[#aaaaaa]">
              <span>Rated 4:</span>
              <span class="font-semibold text-[#f23030]">${userData['4'] || 0}</span>
            </div>
            <div class="flex justify-between text-[#aaaaaa]">
              <span>Rated 3:</span>
              <span class="font-semibold text-[#f97316]">${userData['3'] || 0}</span>
            </div>
            <div class="flex justify-between text-[#aaaaaa]">
              <span>Rated 2:</span>
              <span class="font-semibold text-[#eab308]">${userData['2'] || 0}</span>
            </div>
            <div class="flex justify-between text-[#aaaaaa]">
              <span>Rated 1:</span>
              <span class="font-semibold text-[#38bdf8]">${userData['1'] || 0}</span>
            </div>
            <div class="col-span-2 flex justify-between text-[#aaaaaa] pt-1 border-t border-[#262626]/60">
              <span>Denied:</span>
              <span class="font-semibold text-[#717171]">${userData['deny'] || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
  const chartWidth = chart.width;
  const clampedX = Math.max(100, Math.min(chartWidth - 100, tooltip.caretX));
  const yAlign = tooltip.caretY < 140 ? 'translate(-50%, 15px)' : 'translate(-50%, -105%)';
  tooltipEl.style.opacity = '1';
  tooltipEl.style.left = positionX + clampedX + 'px';
  tooltipEl.style.top = positionY + tooltip.caretY + 'px';
  tooltipEl.style.transform = yAlign;
};

const customPieTooltip = (context: any, data: PieData[], total: number) => {
  const { chart, tooltip } = context;
  let tooltipEl = chart.canvas.parentNode?.querySelector('.chartjs-pie-tooltip') as HTMLDivElement | null;

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'chartjs-pie-tooltip pointer-events-none absolute z-50 transition-all duration-75';
    chart.canvas.parentNode?.appendChild(tooltipEl);
  }

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    return;
  }

  const dataIndex = tooltip.dataPoints?.[0]?.dataIndex;
  if (dataIndex === undefined) return;
  const item = data[dataIndex];
  if (!item) return;

  const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';

  tooltipEl.innerHTML = `
    <div class="p-3 bg-[#181818] shadow-2xl rounded-xl border border-[#262626] min-w-[160px] select-none text-xs">
      <p class="font-semibold text-xs text-[#f1f1f1] mb-2">${item.name}</p>
      <div class="space-y-1.5 text-xs">
        <div class="flex justify-between items-center">
          <span class="text-[#aaaaaa]">Count:</span>
          <span class="font-bold text-white bg-[#222222] px-2 py-0.5 rounded-full">
            ${item.value}
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-[#aaaaaa]">Share:</span>
          <span class="font-bold text-[#f23030] bg-[#f23030]/10 px-2 py-0.5 rounded-full border border-[#f23030]/20">
            ${percentage}%
          </span>
        </div>
      </div>
    </div>
  `;

  const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
  const yAlign = tooltip.caretY < 80 ? 'translate(-50%, 15px)' : 'translate(-50%, -105%)';
  tooltipEl.style.opacity = '1';
  tooltipEl.style.left = positionX + tooltip.caretX + 'px';
  tooltipEl.style.top = positionY + tooltip.caretY + 'px';
  tooltipEl.style.transform = yAlign;
};

export const RatingDistribution: React.FC<RatingDistributionProps> = ({ userRatings, sortBy, setSortBy }) => {
  const [activeChart, setActiveChart] = useState<'bar' | 'pie'>('bar');

  const activeUserRatings = useMemo(() => {
    return userRatings.filter((u) => (u.total || 0) > 0);
  }, [userRatings]);

  const pieData: PieData[] = useMemo(() => {
    const counts: Record<string, number> = {
      'Rated 4': 0,
      'Rated 3': 0,
      'Rated 2': 0,
      'Rated 1': 0,
      'Rated Deny': 0,
    };

    userRatings.forEach((user) => {
      counts['Rated 4'] += user['4'] || 0;
      counts['Rated 3'] += user['3'] || 0;
      counts['Rated 2'] += user['2'] || 0;
      counts['Rated 1'] += user['1'] || 0;
      counts['Rated Deny'] += user['deny'] || 0;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [userRatings]);

  const totalReviews = useMemo(() => {
    return pieData.reduce((acc, curr) => acc + curr.value, 0);
  }, [pieData]);

  const barData = useMemo(() => {
    return {
      labels: activeUserRatings.map((u) => u.username),
      datasets: [
        {
          label: 'Rated 4',
          data: activeUserRatings.map((u) => u['4'] || 0),
          backgroundColor: TIER_COLORS['Rated 4'],
          stack: 'ratings',
        },
        {
          label: 'Rated 3',
          data: activeUserRatings.map((u) => u['3'] || 0),
          backgroundColor: TIER_COLORS['Rated 3'],
          stack: 'ratings',
        },
        {
          label: 'Rated 2',
          data: activeUserRatings.map((u) => u['2'] || 0),
          backgroundColor: TIER_COLORS['Rated 2'],
          stack: 'ratings',
        },
        {
          label: 'Rated 1',
          data: activeUserRatings.map((u) => u['1'] || 0),
          backgroundColor: TIER_COLORS['Rated 1'],
          stack: 'ratings',
        },
        {
          label: 'Rated Deny',
          data: activeUserRatings.map((u) => u['deny'] || 0),
          backgroundColor: TIER_COLORS['Rated Deny'],
          stack: 'ratings',
          borderRadius: { topLeft: 4, topRight: 4 },
        },
      ],
    };
  }, [activeUserRatings]);

  const barOptions: ChartOptions<'bar'> = useMemo(
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
          position: 'bottom',
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            color: '#aaaaaa',
            font: { size: 11 },
            padding: 15,
          },
        },
        tooltip: {
          enabled: false,
          external: (context) => customBarTooltip(context, activeUserRatings),
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false,
          },
          ticks: {
            color: '#717171',
            font: { size: 11 },
            maxRotation: 25,
            minRotation: 25,
          },
          border: {
            display: false,
          },
        },
        y: {
          stacked: true,
          grid: {
            color: '#262626',
            borderDash: [3, 3],
          },
          ticks: {
            color: '#717171',
            font: { size: 11 },
            precision: 0,
          },
          border: {
            display: false,
          },
          beginAtZero: true,
        },
      },
    }),
    [userRatings]
  );

  const doughnutData = useMemo(() => {
    return {
      labels: pieData.map((d) => d.name),
      datasets: [
        {
          data: pieData.map((d) => d.value),
          backgroundColor: PIE_COLORS,
          borderColor: '#181818',
          borderWidth: 2,
          spacing: 3,
        },
      ],
    };
  }, [pieData]);

  const doughnutOptions: ChartOptions<'doughnut'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
          external: (context) => customPieTooltip(context, pieData, totalReviews),
        },
      },
    }),
    [pieData, totalReviews]
  );

  return (
    <div className="bg-[#181818] p-5 sm:p-6 rounded-xl border border-[#262626] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#f1f1f1] flex items-center gap-2">
            <FaLayerGroup className="text-[#f23030]" size={16} />
            Rating Tier Distribution
          </h3>
          <p className="text-xs text-[#aaaaaa] mt-0.5">
            Breakdown of scores given across all reviewed clips
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#141414] p-1 rounded-lg border border-[#262626]">
            <button
              onClick={() => setActiveChart('bar')}
              className={`p-1.5 px-3 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeChart === 'bar'
                  ? 'bg-[#f23030] text-white shadow-xs'
                  : 'text-[#aaaaaa] hover:text-white'
              }`}
            >
              <FaChartBar size={12} />
              <span>By Reviewer</span>
            </button>
            <button
              onClick={() => setActiveChart('pie')}
              className={`p-1.5 px-3 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeChart === 'pie'
                  ? 'bg-[#f23030] text-white shadow-xs'
                  : 'text-[#aaaaaa] hover:text-white'
              }`}
            >
              <FaChartPie size={12} />
              <span>Team Totals</span>
            </button>
          </div>

          {activeChart === 'bar' && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#141414] border border-[#262626] text-xs font-medium text-[#f1f1f1] rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-[#f23030]"
            >
              <option value="rating">Sort: High to Low</option>
              <option value="percentage">Sort: Coverage</option>
              <option value="username">Sort: Name</option>
            </select>
          )}
        </div>
      </div>

      {activeChart === 'bar' ? (
        <div className="h-80 w-full relative">
          <Bar data={barData} options={barOptions} />
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
          <div className="h-64 w-64 relative flex items-center justify-center">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>

          <div className="grid grid-cols-1 gap-2.5 w-full sm:w-auto min-w-[200px]">
            {pieData.map((item, index) => {
              const pct = totalReviews > 0 ? ((item.value / totalReviews) * 100).toFixed(1) : '0';
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-4 p-2 px-3 rounded-lg bg-[#141414] border border-[#262626]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="text-xs font-medium text-[#f1f1f1]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-white">{item.value}</span>
                    <span className="text-[10px] text-[#717171]">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
