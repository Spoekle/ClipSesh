'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface PlayerProgressBarProps {
  duration: number;
  currentTime: number;
  bufferedEnd: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  setCurrentTime: (time: number) => void;
  onInteract: () => void;
  formatTime: (seconds: number) => string;
  isDraggingProgress: boolean;
  setIsDraggingProgress: (dragging: boolean) => void;
}

export const PlayerProgressBar: React.FC<PlayerProgressBarProps> = ({
  duration,
  currentTime,
  bufferedEnd,
  videoRef,
  setCurrentTime,
  onInteract,
  formatTime,
  isDraggingProgress,
  setIsDraggingProgress,
}) => {
  const progressRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const wasPlayingRef = useRef(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPercentage, setHoverPercentage] = useState<number>(0);

  const getPercentageFromClientX = useCallback((clientX: number) => {
    if (!progressRef.current) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    if (rect.width === 0) return 0;
    const pos = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, pos));
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onInteract();

    const video = videoRef.current;
    if (!video || !duration) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback
    }

    isDraggingRef.current = true;
    setIsDraggingProgress(true);
    wasPlayingRef.current = !video.paused;

    const pct = getPercentageFromClientX(e.clientX);
    const targetTime = pct * duration;
    setScrubTime(targetTime);
    setCurrentTime(targetTime);
    video.currentTime = targetTime;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!duration) return;
    const pct = getPercentageFromClientX(e.clientX);
    const time = pct * duration;

    setHoverPercentage(pct * 100);
    setHoverTime(time);

    if (isDraggingRef.current) {
      setScrubTime(time);
      setCurrentTime(time);
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    isDraggingRef.current = false;
    setIsDraggingProgress(false);

    const video = videoRef.current;
    if (video && duration) {
      const pct = getPercentageFromClientX(e.clientX);
      const targetTime = pct * duration;
      video.currentTime = targetTime;
      setCurrentTime(targetTime);

      if (wasPlayingRef.current) {
        video.play().catch(() => {});
      }
    }
    setScrubTime(null);
  };

  const handleMouseLeave = () => {
    if (!isDraggingRef.current) {
      setHoverTime(null);
    }
  };

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDraggingProgress(false);
        setScrubTime(null);
        if (wasPlayingRef.current && videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('mouseup', handleGlobalPointerUp);
    window.addEventListener('touchend', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
      window.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, [setIsDraggingProgress, videoRef]);

  const activeCurrentTime = isDraggingProgress && scrubTime !== null ? scrubTime : currentTime;
  const progressPercentage = duration > 0 ? (activeCurrentTime / duration) * 100 : 0;
  const bufferPercentage = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={progressRef}
      className="relative h-7 flex items-center cursor-pointer pointer-events-auto touch-none select-none group/scrubber -my-1"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hover / Scrub Time Tooltip Preview */}
      {(hoverTime !== null || isDraggingProgress) && duration > 0 && (
        <div
          className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-cc-card/95 text-white text-[11px] font-mono font-medium pointer-events-none border border-border shadow-xl whitespace-nowrap z-30 backdrop-blur-xs"
          style={{
            left: `${Math.max(2, Math.min(98, isDraggingProgress ? progressPercentage : hoverPercentage))}%`,
          }}
        >
          {formatTime(isDraggingProgress && scrubTime !== null ? scrubTime : hoverTime || 0)}
        </div>
      )}

      {/* Track Container */}
      <div
        className={`relative w-full rounded-full transition-all duration-150 bg-white/20 overflow-visible ${
          isDraggingProgress ? 'h-2' : 'h-1 group-hover/scrubber:h-1.5'
        }`}
      >
        {/* Buffer Progress Bar */}
        {bufferPercentage > 0 && (
          <div
            className="absolute left-0 top-0 h-full bg-white/25 rounded-full pointer-events-none"
            style={{ width: `${Math.min(100, bufferPercentage)}%` }}
          />
        )}

        {/* Hover Ghost Bar */}
        {hoverTime !== null && !isDraggingProgress && (
          <div
            className="absolute left-0 top-0 h-full bg-white/35 rounded-full pointer-events-none"
            style={{ width: `${Math.min(100, hoverPercentage)}%` }}
          />
        )}

        {/* Played Progress Bar */}
        <div
          className="absolute left-0 top-0 h-full bg-primary rounded-full"
          style={{ width: `${Math.min(100, progressPercentage)}%` }}
        />

        {/* Scrubber Playhead Handle */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-primary rounded-full border-2 border-white shadow-md pointer-events-none transition-transform duration-150 ${
            isDraggingProgress ? 'scale-125' : 'scale-0 group-hover/scrubber:scale-100'
          }`}
          style={{ left: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
        />
      </div>
    </div>
  );
};

export default PlayerProgressBar;
