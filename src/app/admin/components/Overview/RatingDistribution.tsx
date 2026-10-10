'use client';

import React, { useState, useMemo } from 'react';
import '@/lib/chart';
import { Bar, Doughnut } from 'react-chartjs-2';
import type { ChartOptions, Chart as ChartJS, TooltipModel } from 'chart.js';
import { FaChartBar, FaChartPie, FaLayerGroup } from 'react-icons/fa';
import { UserRating, PieData } from '@/types/adminTypes';

interface RatingDistributionProps {
  userRatings: UserRating[];
}

const TIER_COLORS = {
  'Rated 4': '#f23030',
  'Rated 3': '#f97316',
  'Rated 2': '#eab308',
  'Rated 1': '#38bdf8',
  'Rated Deny': '#717171',
};

const PIE_COLORS = ['#f23030', '#f97316', '#eab308', '#38bdf8', '#717171'];

interface TooltipContext<TType extends 'bar' | 'doughnut'> {
  chart: ChartJS<TType>;
  tooltip: TooltipModel<TType>;
}

const customBarTooltip = (
  context: TooltipContext<'bar'>,
  ratings: UserRating[]
) => {
  const { chart, tooltip } = context;
  let tooltipEl = chart.canvas.parentNode?.querySelector(
    '.chartjs-bar-tooltip'
  ) as HTMLDivElement | null;

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className =
      'chartjs-bar-tooltip pointer-events-none absolute z-50 transition-all duration-75';
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
    <div class="p-4 bg-cc-card shadow-2xl rounded-xl border border-border min-w-[200px] select-none text-xs">
      <h3 class="text-sm font-bold text-white mb-2.5 flex items-center justify-between">
        <span>${userData.username}</span>
        <span class="text-[10px] font-medium text-muted-foreground">Reviewer</span>
      </h3>
      <div class="space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span class="text-muted-foreground">Total Ratings:</span>
          <span class="font-semibold text-white bg-cc-ground px-2 py-0.5 rounded-full">
            ${userData.total}
          </span>
        </div>
        <div class="flex justify-between items-center text-xs">
          <span class="text-muted-foreground">Coverage:</span>
          <span class="font-semibold px-2 py-0.5 rounded-full ${coverageClass}">
            ${coverage.toFixed(1)}%
          </span>
        </div>
        <div class="mt-3 pt-2.5 border-t border-border">
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="flex justify-between text-muted-foreground">
              <span>Rated 4:</span>
              <span class="font-semibold text-primary">${userData['4'] || 0}</span>
            </div>
            <div class="flex justify-between text-muted-foreground">
              <span>Rated 3:</span>
              <span class="font-semibold text-amber-500">${userData['3'] || 0}</span>
            </div>
            <div class="flex justify-between text-muted-foreground">
              <span>Rated 2:</span>
              <span class="font-semibold text-yellow-500">${userData['2'] || 0}</span>
            </div>
            <div class="flex justify-between text-muted-foreground">
              <span>Rated 1:</span>
              <span class="font-semibold text-sky-400">${userData['1'] || 0}</span>
            </div>
            <div class="col-span-2 flex justify-between text-muted-foreground pt-1 border-t border-border/60">
              <span>Denied:</span>
              <span class="font-semibold text-muted-foreground">${userData['deny'] || 0}</span>
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

const customPieTooltip = (
  context: TooltipContext<'doughnut'>,
  data: PieData[],
  total: number
) => {
  const { chart, tooltip } = context;
  let tooltipEl = chart.canvas.parentNode?.querySelector(
    '.chartjs-pie-tooltip'
  ) as HTMLDivElement | null;

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className =
      'chartjs-pie-tooltip pointer-events-none absolute z-50 transition-all duration-75';
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
    <div class="p-3 bg-cc-card shadow-2xl rounded-xl border border-border min-w-[160px] select-none text-xs">
      <p class="font-semibold text-xs text-white mb-2">${item.name}</p>
      <div class="space-y-1.5 text-xs">
        <div class="flex justify-between items-center">
          <span class="text-muted-foreground">Count:</span>
          <span class="font-bold text-white bg-cc-ground px-2 py-0.5 rounded-full">
            ${item.value}
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-muted-foreground">Share:</span>
          <span class="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
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

export const RatingDistribution: React.FC<RatingDistributionProps> = ({
  userRatings,
}) => {
  const [activeChart, setActiveChart] = useState<'bar' | 'pie'>('bar');

  const activeUserRatings = useMemo(() => {
    return [...userRatings]
      .filter((u) => (u.total || 0) > 0)
      .sort((a, b) => (b.total || 0) - (a.total || 0));
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
          external: (context) => customBarTooltip(context as TooltipContext<'bar'>, activeUserRatings),
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
    [activeUserRatings]
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
          external: (context) =>
            customPieTooltip(context as TooltipContext<'doughnut'>, pieData, totalReviews),
        },
      },
    }),
    [pieData, totalReviews]
  );

  return (
    <div className="bg-cc-card p-5 sm:p-6 rounded-xl border border-border shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <FaLayerGroup className="text-primary" size={16} />
            Rating Tier Distribution
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Breakdown of scores given across all reviewed clips
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-cc-ground p-1 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setActiveChart('bar')}
              className={`p-1.5 px-3 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChart === 'bar'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <FaChartBar size={12} />
              <span>By Member</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveChart('pie')}
              className={`p-1.5 px-3 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChart === 'pie'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <FaChartPie size={12} />
              <span>Team Totals</span>
            </button>
          </div>
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
                  className="flex items-center justify-between gap-4 p-2 px-3 rounded-lg bg-cc-ground border border-border"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="text-xs font-medium text-white/90">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-white">{item.value}</span>
                    <span className="text-[10px] text-muted-foreground">({pct}%)</span>
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

export default RatingDistribution;
