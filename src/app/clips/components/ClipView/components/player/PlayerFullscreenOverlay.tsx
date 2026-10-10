'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PlayerFullscreenOverlayProps {
  isFullscreen: boolean;
  showControls: boolean;
  title: string;
  streamer: string;
  submitter?: string;
  createdAt?: string;
}

export const PlayerFullscreenOverlay: React.FC<PlayerFullscreenOverlayProps> = ({
  isFullscreen,
  showControls,
  title,
  streamer,
  submitter,
  createdAt,
}) => {
  if (!isFullscreen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -20 }}
      transition={{ duration: 0.2 }}
      className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 pt-6 pb-12 pointer-events-none z-10"
    >
      <h2 className="text-white text-lg sm:text-xl font-bold mb-1 line-clamp-1">{title}</h2>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-white/80">
        <div className="flex items-center">
          <span className="font-semibold mr-1 text-muted-foreground">Streamer:</span> {streamer}
        </div>
        {submitter && (
          <div className="flex items-center">
            <span className="font-semibold mr-1 text-muted-foreground">Submitted by:</span> {submitter}
          </div>
        )}
        {createdAt && (
          <div className="flex items-center">
            <span className="font-semibold mr-1 text-muted-foreground">Date:</span> {formatDate(createdAt)}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PlayerFullscreenOverlay;
