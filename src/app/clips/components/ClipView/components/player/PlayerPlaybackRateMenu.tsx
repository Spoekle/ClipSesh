'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlayerPlaybackRateMenuProps {
  playbackRate: number;
  playbackRates: number[];
  showPlaybackRateMenu: boolean;
  setShowPlaybackRateMenu: (show: boolean) => void;
  onSelectRate: (rate: number) => void;
}

export const PlayerPlaybackRateMenu: React.FC<PlayerPlaybackRateMenuProps> = ({
  playbackRate,
  playbackRates,
  showPlaybackRateMenu,
  setShowPlaybackRateMenu,
  onSelectRate,
}) => {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowPlaybackRateMenu(!showPlaybackRateMenu);
        }}
        className="text-white hover:text-primary transition-colors text-xs px-2 py-1 rounded bg-black/40 border border-white/10 cursor-pointer"
      >
        {playbackRate}x
      </button>

      <AnimatePresence>
        {showPlaybackRateMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full right-0 mb-1 bg-cc-card border border-border rounded-lg overflow-hidden shadow-xl z-20"
          >
            {playbackRates.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRate(rate);
                }}
                className={`block w-full text-left px-4 py-1.5 text-xs transition-colors cursor-pointer ${
                  playbackRate === rate
                    ? 'bg-primary text-white font-semibold'
                    : 'text-white/90 hover:bg-border/60'
                }`}
              >
                {rate}x
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayerPlaybackRateMenu;
