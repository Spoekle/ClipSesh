'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Star, Play } from 'lucide-react';
import { format } from 'timeago.js';
import { User, Clip, Rating } from '@/types/adminTypes';
import { computeClipRatingSummary } from '../utils/clipRatingHelpers';
import { ClipItemTeamRating } from './ClipItemTeamRating';
import { Badge } from '@/components/ui/badge';

interface ClipItemProps {
  clip: Clip;
  user: User | null;
  ratings?: Record<string, Rating>;
  config?: { denyThreshold?: number } | null;
  filterRatedClips?: boolean;
  setExpandedClip: (clipId: string) => void;
}

export const ClipItem: React.FC<ClipItemProps> = ({
  clip,
  user,
  ratings,
  config,
  setExpandedClip,
}) => {
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef<boolean>(false);
  const justToggledPreviewRef = useRef<boolean>(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    userRating,
    hasRated,
    isDenied,
    averageRating,
    denialCount,
    totalRatings,
  } = useMemo(() => {
    return computeClipRatingSummary(clip._id, ratings, user, config?.denyThreshold);
  }, [clip._id, ratings, user, config?.denyThreshold]);

  const isStaff = Boolean(
    user && (user.roles.includes('admin') || user.roles.includes('clipteam'))
  );
  const formattedDate = format(new Date(clip.createdAt));

  // Dismiss hover effects on mobile when tapping outside this card
  useEffect(() => {
    if (!isHovering) return;

    const handleTouchOutside = (e: TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsHovering(false);
      }
    };

    document.addEventListener('touchstart', handleTouchOutside, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [isHovering]);

  // Clean up long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    isSwipingRef.current = false;

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (!isSwipingRef.current) {
        setIsHovering(true);
        justToggledPreviewRef.current = true;
      }
    }, 250);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);

    if (dx > 10 || dy > 10) {
      isSwipingRef.current = true;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (isHovering) {
        setIsHovering(false);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    if (isSwipingRef.current || !touchStartRef.current) {
      touchStartRef.current = null;
      return;
    }

    const duration = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    if (duration >= 250) {
      justToggledPreviewRef.current = true;
      return;
    }

    const target = e.target as HTMLElement;
    const isThumbnailTap = Boolean(target.closest('[data-thumbnail-container]'));

    if (isThumbnailTap) {
      if (!isHovering) {
        setIsHovering(true);
        justToggledPreviewRef.current = true;
      } else {
        setExpandedClip(clip._id);
        setIsHovering(false);
      }
    } else {
      setExpandedClip(clip._id);
    }
  };

  const handleCardClick = () => {
    if (justToggledPreviewRef.current) {
      justToggledPreviewRef.current = false;
      return;
    }

    setExpandedClip(clip._id);
  };

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        touchStartRef.current = null;
      }}
      className="group relative isolate flex flex-col h-full p-0 sm:p-2 rounded-none sm:rounded-xl cursor-pointer select-none hover:z-10"
    >
      {/* YouTube-style hover background: scales up on hover while item content stays fixed */}
      <div
        className={`absolute inset-0 -z-10 rounded-none sm:rounded-2xl bg-secondary/50 border-y sm:border border-border/40 transition-all duration-200 ease-out pointer-events-none ${
          isHovering
            ? 'opacity-100 scale-[1.02] sm:scale-105 shadow-md sm:shadow-xl'
            : 'opacity-0 scale-100 group-hover:opacity-100 group-hover:scale-[1.02] sm:group-hover:scale-105 shadow-lg group-hover:shadow-xl'
        }`}
      />

      {/* 16:9 Thumbnail Container */}
      <div
        data-thumbnail-container="true"
        className="relative aspect-video bg-card rounded-none sm:rounded-xl overflow-hidden"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isHovering ? (
          <video
            src={clip.url}
            loop
            muted
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-none sm:rounded-xl"
          />
        ) : (
          <img
            src={clip.thumbnail}
            alt={clip.title}
            className="w-full h-full object-cover rounded-none sm:rounded-xl"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
            }}
          />
        )}

        {/* Rating/Denial Badges (Top-Right) */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {hasRated && userRating && (
            <Badge
              variant="secondary"
              className="px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-xs border border-white/15 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
            >
              {userRating === 'deny' ? (
                <span className="text-red-400">Denied</span>
              ) : (
                <>
                  <Star className="size-2.5 text-amber-400 fill-amber-400" />
                  <span>{userRating}</span>
                </>
              )}
            </Badge>
          )}

          {isDenied && isStaff && (
            <Badge
              variant="destructive"
              className="px-2 py-0.5 rounded-md bg-red-950/90 border border-red-500/40 text-red-300 text-[11px] font-bold shadow-sm"
            >
              Denied
            </Badge>
          )}
        </div>
      </div>

      {/* Details: Title + Metadata */}
      <div className="px-3.5 py-3 sm:px-0 sm:py-3.5 flex flex-col justify-between flex-1">
        <div className="flex items-start justify-between gap-3">
          {/* Left Column: Title, Streamer, Date */}
          <div className="min-w-0 flex-1 flex flex-col">
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug tracking-tight transition-colors">
              {clip.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground truncate">{clip.streamer}</span>
              <span className="flex text-xs text-muted-foreground items-center gap-1" title={`${clip.views || 0} views`}>
                <Play className="size-2.5" />
                <span>{clip.views || 0}</span>
              </span>
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Team rating row (admin/clipteam only) */}
        {isStaff && (
          <ClipItemTeamRating
            averageRating={averageRating}
            totalRatings={totalRatings}
            denialCount={denialCount}
          />
        )}
      </div>
    </div>
  );
};

export default ClipItem;