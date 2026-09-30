'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { RatingUser } from '@/types/adminTypes';

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
  averageRating,
  className = '',
}) => {
  const [hoveredTooltip, setHoveredTooltip] = useState<TooltipState | null>(null);
  const [selectedTierKey, setSelectedTierKey] = useState<string | null>(null);
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

  const selectedTier = useMemo(() => {
    return tierList.find((t) => t.key === selectedTierKey) || null;
  }, [tierList, selectedTierKey]);

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
        <div className="w-full h-3.5 bg-[#141414] rounded-md overflow-hidden flex border border-[#2a2a2a] relative">
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
                  onClick={() =>
                    setSelectedTierKey(selectedTierKey === tier.key ? null : tier.key)
                  }
                  title={`${tier.label}: ${tier.count} (${tier.percentage.toFixed(0)}%)`}
                />
              );
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-[#666666] font-medium tracking-wide">
              No ratings yet
            </div>
          )}
        </div>
      </div>

      {/* Legend Badges Row */}
      <div className="grid grid-cols-5 gap-1.5">
        {tierList.map((tier) => {
          const isSelected = selectedTierKey === tier.key;
          const isHovered = hoveredTooltip?.tier.key === tier.key;

          return (
            <button
              key={tier.key}
              type="button"
              onClick={() => setSelectedTierKey(isSelected ? null : tier.key)}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredTooltip({ tier, rect });
              }}
              onMouseLeave={() => setHoveredTooltip(null)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md border transition-all cursor-pointer ${
                isSelected || isHovered
                  ? 'bg-[#222222] border-white/40 ring-1 ring-white/20'
                  : tier.count > 0
                  ? 'bg-[#141414] border-[#2a2a2a] hover:border-[#444444] hover:bg-[#1a1a1a]'
                  : 'bg-[#121212] border-[#202020] opacity-50 hover:opacity-100 hover:border-[#333333]'
              }`}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: tier.color }}
                />
                <span className="text-[11px] font-bold text-neutral-300">{tier.shortLabel}</span>
              </div>
              <span
                className={`text-xs font-mono font-semibold ${
                  tier.count > 0 ? 'text-white' : 'text-neutral-500'
                }`}
              >
                {tier.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expandable Reviewers List on Click */}
      <AnimatePresence>
        {selectedTier && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-[#141414] rounded-xl border border-[#2a2a2a] text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#242424]">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: selectedTier.color }}
                  />
                  <span className="font-semibold text-white">{selectedTier.label}</span>
                  {selectedTier.subtitle && (
                    <span className="text-[10px] text-[#717171]">
                      ({selectedTier.subtitle})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-white bg-[#222222] px-2 py-0.5 rounded-full border border-[#2a2a2a]">
                    {selectedTier.count} {selectedTier.count === 1 ? 'vote' : 'votes'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedTierKey(null)}
                    className="text-[#717171] hover:text-white p-0.5 cursor-pointer"
                    title="Close"
                  >
                    <FaTimes size={10} />
                  </button>
                </div>
              </div>

              {selectedTier.users.length > 0 ? (
                <div className="max-h-28 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                  {selectedTier.users.map((u) => (
                    <div
                      key={u.userId}
                      className="flex items-center justify-between text-xs text-neutral-300 py-0.5 px-1 rounded-md hover:bg-[#1a1a1a]"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: selectedTier.color }}
                        />
                        <span className="font-medium text-white">{u.username}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[#717171] italic py-1">
                  No ratings for this tier yet.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Hover Tooltip rendered into document.body via Portal to prevent any overflow clipping */}
      {mounted && hoveredTooltip && tooltipPosition && createPortal(
        <div
          className="pointer-events-none fixed z-[99999] transition-opacity duration-100 ease-out"
          style={{
            left: `${tooltipPosition.left}px`,
            top: `${tooltipPosition.top}px`,
            transform: tooltipPosition.transform,
          }}
        >
          <div className="p-3 bg-[#181818]/95 backdrop-blur-md shadow-2xl rounded-xl border border-[#383838] min-w-[200px] max-w-[260px] select-none text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262626]">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: hoveredTooltip.tier.color }}
                />
                <div>
                  <p className="font-bold text-white text-xs leading-none">
                    {hoveredTooltip.tier.label}
                  </p>
                  {hoveredTooltip.tier.subtitle && (
                    <span className="text-[10px] text-[#888888]">
                      {hoveredTooltip.tier.subtitle}
                    </span>
                  )}
                </div>
              </div>
              <span className="font-bold text-white bg-[#222222] px-2 py-0.5 rounded-full border border-[#2e2e2e] text-[11px]">
                {hoveredTooltip.tier.count} {hoveredTooltip.tier.count === 1 ? 'vote' : 'votes'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#aaaaaa] mb-2">
              <span>Share:</span>
              <span className="font-semibold text-white">
                {hoveredTooltip.tier.percentage.toFixed(0)}%
              </span>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#aaaaaa] mb-1.5 flex items-center justify-between">
                <span>Rated By</span>
                <span className="text-[#717171]">{hoveredTooltip.tier.users.length}</span>
              </p>
              {hoveredTooltip.tier.users.length > 0 ? (
                <div className="max-h-28 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                  {hoveredTooltip.tier.users.map((u) => (
                    <div
                      key={u.userId}
                      className="flex items-center gap-2 py-0.5 text-xs text-[#f1f1f1]"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: hoveredTooltip.tier.color }}
                      />
                      <span className="font-medium truncate">{u.username}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[#717171] italic py-0.5">
                  No reviews in this tier
                </p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(113, 113, 113, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(113, 113, 113, 0.7);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(113, 113, 113, 0.4) transparent;
        }
      `}</style>
    </div>
  );
};

export default RatingDistributionGraph;
