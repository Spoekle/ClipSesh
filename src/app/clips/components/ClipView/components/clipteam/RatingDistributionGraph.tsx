'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { RatingUser } from '@/types/adminTypes';
import { RatingDistributionTooltip } from './RatingDistributionTooltip';

export interface RatingCountItem {
  rating: string;
  count: number;
  users: RatingUser[];
}

interface RatingDistributionGraphProps {
  ratingCounts: RatingCountItem[];
  totalRatings: number;
  averageRating: string;
  className?: string;
}

export interface TierInfo {
  key: string;
  label: string;
  shortLabel: string;
  subtitle: string;
  color: string;
  count: number;
  percentage: number;
  users: RatingUser[];
}

const TIER_CONFIG = [
  { key: '1', label: 'Tier 1', shortLabel: '1', subtitle: 'Top Tier', color: '#38bdf8' },
  { key: '2', label: 'Tier 2', shortLabel: '2', subtitle: '', color: '#eab308' },
  { key: '3', label: 'Tier 3', shortLabel: '3', subtitle: '', color: '#f97316' },
  { key: '4', label: 'Tier 4', shortLabel: '4', subtitle: 'Filler', color: '#f23030' },
  { key: 'deny', label: 'Denied', shortLabel: 'Deny', subtitle: 'Rejected', color: '#717171' },
];

interface TooltipState {
  tier: TierInfo;
  rect: DOMRect;
}

const RatingDistributionGraph: React.FC<RatingDistributionGraphProps> = ({
  ratingCounts,
  totalRatings,
  className = '',
}) => {
  const [hoveredTooltip, setHoveredTooltip] = useState<TooltipState | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tierList: TierInfo[] = useMemo(() => {
    return TIER_CONFIG.map((config) => {
      const match = ratingCounts.find(
        (r) => r.rating === config.key || r.rating === config.key.toString()
      );
      const count = match?.count || 0;
      const users = match?.users || [];
      const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

      return {
        ...config,
        count,
        percentage,
        users,
      };
    });
  }, [ratingCounts, totalRatings]);

  // Compute portal tooltip position
  const tooltipPosition = useMemo(() => {
    if (!hoveredTooltip || typeof window === 'undefined') return null;

    const { rect } = hoveredTooltip;
    const tooltipWidth = 240;
    let left = rect.left + rect.width / 2;

    left = Math.max(
      tooltipWidth / 2 + 12,
      Math.min(window.innerWidth - tooltipWidth / 2 - 12, left)
    );

    const isAbove = rect.top > 160;
    const top = isAbove ? rect.top - 8 : rect.bottom + 8;
    const transform = isAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)';

    return { left, top, transform };
  }, [hoveredTooltip]);

  return (
    <div className={`space-y-3 select-none ${className}`}>
      {/* The Single, Shared Bar */}
      <div className="relative">
        <div className="w-full h-3.5 bg-cc-ground rounded-md overflow-hidden flex border border-border relative">
          {totalRatings > 0 ? (
            tierList.map((tier) => {
              if (tier.count === 0) return null;
              const isHovered = hoveredTooltip?.tier.key === tier.key;

              return (
                <div
                  key={tier.key}
                  className={`h-full transition-all duration-200 cursor-pointer ${
                    isHovered ? 'brightness-125 saturate-125' : 'hover:brightness-110'
                  }`}
                  style={{
                    width: `${tier.percentage}%`,
                    backgroundColor: tier.color,
                  }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredTooltip({ tier, rect });
                  }}
                  onMouseLeave={() => setHoveredTooltip(null)}
                  title={`${tier.label}: ${tier.count} (${tier.percentage.toFixed(0)}%)`}
                />
              );
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground font-medium tracking-wide">
              No ratings yet
            </div>
          )}
        </div>
      </div>

      <RatingDistributionTooltip
        mounted={mounted}
        tier={hoveredTooltip?.tier || null}
        position={tooltipPosition}
      />
    </div>
  );
};

export default RatingDistributionGraph;
