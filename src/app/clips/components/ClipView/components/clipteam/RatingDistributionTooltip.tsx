'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { TierInfo } from './RatingDistributionGraph';

interface TooltipPosition {
  left: number;
  top: number;
  transform: string;
}

interface RatingDistributionTooltipProps {
  mounted: boolean;
  tier: TierInfo | null;
  position: TooltipPosition | null;
}

export const RatingDistributionTooltip: React.FC<RatingDistributionTooltipProps> = ({
  mounted,
  tier,
  position,
}) => {
  if (!mounted || !tier || !position || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-none fixed z-[99999] transition-opacity duration-100 ease-out"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        transform: position.transform,
      }}
    >
      <div className="p-3 bg-cc-card/95 backdrop-blur-md shadow-2xl rounded-xl border border-border min-w-[200px] max-w-[260px] select-none text-xs text-foreground">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: tier.color }}
            />
            <div>
              <p className="font-bold text-foreground text-xs leading-none">
                {tier.label}
              </p>
              {tier.subtitle && (
                <span className="text-[10px] text-muted-foreground">
                  {tier.subtitle}
                </span>
              )}
            </div>
          </div>
          <span className="font-bold text-foreground bg-secondary px-2 py-0.5 rounded-full border border-border text-[11px]">
            {tier.count} {tier.count === 1 ? 'vote' : 'votes'}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
          <span>Share:</span>
          <span className="font-semibold text-foreground">
            {tier.percentage.toFixed(0)}%
          </span>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
            <span>Rated By</span>
            <span className="text-muted-foreground/80">{tier.users.length}</span>
          </p>
          {tier.users.length > 0 ? (
            <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
              {tier.users.map((u) => (
                <div
                  key={u.userId}
                  className="flex items-center gap-2 py-0.5 text-xs text-foreground"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: tier.color }}
                  />
                  <span className="font-medium truncate">{u.username}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground italic py-0.5">
              No reviews in this tier
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
