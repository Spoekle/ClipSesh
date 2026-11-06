'use client';

import React, { useState, useMemo } from 'react';
import '@/lib/chart';
import { Bar, Doughnut } from 'react-chartjs-2';
import type { ChartOptions, Chart as ChartJS, TooltipModel } from 'chart.js';
import { BarChart3, PieChart } from 'lucide-react';
import { UserRating, PieData } from '@/types/adminTypes';
import { RATING_TIERS } from '@/lib/ratingTiers';

interface RatingDistributionProps {
  userRatings: UserRating[];
}

// Bottom-to-top stacking order for the bar chart: Denied at the base, Tier 1 on top.
const STACK_ORDER = [...RATING_TIERS].reverse();

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
            ${RATING_TIERS.map(
              (tier) => `
            <div class="flex justify-between text-muted-foreground${tier.key === 'deny' ? ' col-span-2 pt-1 border-t border-border/60' : ''}">
              <span>${tier.label}:</span>
              <span class="font-semibold" style="color: ${tier.color}">${userData[tier.key] || 0}</span>
            </div>`
            ).join('')}
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
    return RATING_TIERS.map((tier) => ({
      name: tier.label,
      value: userRatings.reduce((acc, user) => acc + (user[tier.key] || 0), 0),
    }));
  }, [userRatings]);

  const totalReviews = useMemo(() => {
    return pieData.reduce((acc, curr) => acc + curr.value, 0);
  }, [pieData]);

  const barData = useMemo(() => {
    return {
      labels: activeUserRatings.map((u) => u.username),
      datasets: STACK_ORDER.map((tier) => ({
        label: tier.label,
        data: activeUserRatings.map((u) => u[tier.key] || 0),
        backgroundColor: tier.color,
        stack: 'ratings',
        ...(tier.key === '1' && { borderRadius: { topLeft: 4, topRight: 4 } }),
      })),
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
          backgroundColor: RATING_TIERS.map((tier) => tier.color),
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
    <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-bold text-foreground">Ratings by tier</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Scores given across all reviewed clips</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-cc-ground p-1 rounded-full border border-border">
            <button
              type="button"
              onClick={() => setActiveChart('bar')}
              className={`py-1 px-3 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChart === 'bar'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <BarChart3 className="size-3.5" />
              <span>Per member</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveChart('pie')}
              className={`py-1 px-3 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChart === 'pie'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <PieChart className="size-3.5" />
              <span>Total</span>
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
                      style={{ backgroundColor: RATING_TIERS[index]?.color }}
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
