'use client';

import React, { useRef } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface PlayerVolumeControlProps {
  volume: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onVolumeChange: (newVolume: number) => void;
  isDraggingVolume: boolean;
  setIsDraggingVolume: (dragging: boolean) => void;
  showVolumeControl: boolean;
  setShowVolumeControl: (show: boolean) => void;
}

export const PlayerVolumeControl: React.FC<PlayerVolumeControlProps> = ({
  volume,
  isMuted,
  onToggleMute,
  onVolumeChange,
  isDraggingVolume,
  setIsDraggingVolume,
  showVolumeControl,
  setShowVolumeControl,
}) => {
  const volumeControlRef = useRef<HTMLDivElement | null>(null);

  const calculateVolumeFromEvent = (clientX: number) => {
    if (!volumeControlRef.current) return 0;
    const rect = volumeControlRef.current.getBoundingClientRect();
    const pos = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, pos));
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const newVolume = calculateVolumeFromEvent(e.clientX);
    onVolumeChange(newVolume);
  };

  const handleVolumeMouseMove = (e: MouseEvent) => {
    const newVolume = calculateVolumeFromEvent(e.clientX);
    onVolumeChange(newVolume);
  };

  const handleVolumeMouseUp = () => {
    setIsDraggingVolume(false);
    document.removeEventListener('mousemove', handleVolumeMouseMove);
    document.removeEventListener('mouseup', handleVolumeMouseUp);
  };

  const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingVolume(true);
    handleVolumeClick(e);
    document.addEventListener('mousemove', handleVolumeMouseMove);
    document.addEventListener('mouseup', handleVolumeMouseUp);
  };

  const currentVolumePercentage = (isMuted ? 0 : volume) * 100;

  return (
    <div
      className="relative flex items-center group"
      onMouseEnter={() => setShowVolumeControl(true)}
      onMouseLeave={() => !isDraggingVolume && setShowVolumeControl(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleMute();
        }}
        className="text-white hover:text-primary transition-colors flex items-center justify-center w-8 h-8 cursor-pointer"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted || volume === 0 ? (
          <FaVolumeMute className="text-lg" />
        ) : (
          <FaVolumeUp className="text-lg" />
        )}
      </button>

      <AnimatePresence>
        {(showVolumeControl || isDraggingVolume) && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 80, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex items-center px-2"
          >
            <div
              ref={volumeControlRef}
              className="w-full h-1 bg-white/30 rounded-full cursor-pointer relative"
              onClick={handleVolumeClick}
              onMouseDown={handleVolumeMouseDown}
            >
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${currentVolumePercentage}%` }}
              />
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md transition-transform duration-100 ${
                  isDraggingVolume ? 'scale-125' : ''
                }`}
                style={{ left: `${currentVolumePercentage}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayerVolumeControl;
