'use client';

import { safeLocalStorage } from '@/utils/storage';
import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Maximize2,
  RotateCcw,
  Minimize2,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Clip } from '@/types/adminTypes';
import PlayerProgressBar from './player/PlayerProgressBar';
import PlayerVolumeControl from './player/PlayerVolumeControl';
import PlayerPlaybackRateMenu from './player/PlayerPlaybackRateMenu';
import PlayerFullscreenOverlay from './player/PlayerFullscreenOverlay';
import usePlayerShortcuts from './player/usePlayerShortcuts';
import { Button } from '@/components/common/Button';

const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

export const CustomPlayer = ({ currentClip }: { currentClip: Clip }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [previousVolume, setPreviousVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [bufferedEnd, setBufferedEnd] = useState<number>(0);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showPlaybackRateMenu, setShowPlaybackRateMenu] = useState(false);

  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      if (!isDraggingProgress) {
        setCurrentTime(video.currentTime);
      }
    };
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBufferedEnd(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onLoadedMetadata = () => {
      setDuration(video.duration);
      if (video.buffered.length > 0) {
        setBufferedEnd(video.buffered.end(video.buffered.length - 1));
      }
      if (currentClip?.thumbnail && !video.poster) {
        video.poster = currentClip.thumbnail;
      }
    };
    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const onError = () => {
      setError('Error playing video. Please try again.');
    };
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
    };

    const storedVolume = safeLocalStorage.getItem('clipViewerVolume');
    if (storedVolume) {
      const parsedVolume = parseFloat(storedVolume);
      if (!isNaN(parsedVolume)) {
        video.volume = parsedVolume;
        setVolume(parsedVolume);
        setIsMuted(parsedVolume === 0);
      } else {
        video.volume = 0.5;
        setVolume(0.5);
      }
    } else {
      video.volume = 0.5;
      setVolume(0.5);
    }

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('progress', onProgress);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('error', onError);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('error', onError);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('ended', onEnded);
    };
  }, [currentClip?.thumbnail, isDraggingProgress]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!hasInteracted) return;

    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }

    if (
      isPlaying &&
      !isDraggingProgress &&
      !isDraggingVolume &&
      !showPlaybackRateMenu &&
      !showVolumeControl
    ) {
      controlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      setShowControls(true);
    }

    return () => {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
  }, [
    isPlaying,
    hasInteracted,
    currentTime,
    isDraggingProgress,
    isDraggingVolume,
    showPlaybackRateMenu,
    showVolumeControl,
  ]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    setHasInteracted(true);

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = newVolume;
    setVolume(newVolume);
    safeLocalStorage.setItem('clipViewerVolume', newVolume.toString());

    if (newVolume === 0) {
      video.muted = true;
      setIsMuted(true);
    } else if (video.muted) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.muted || video.volume === 0) {
      video.muted = false;
      const newVolume = previousVolume > 0 ? previousVolume : 0.5;
      video.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(video.volume);
      video.muted = true;
      setIsMuted(true);
    }
  };

  const toggleFullScreen = () => {
    const player = playerRef.current;
    if (!player) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      player.requestFullscreen().catch(() => {});
    }
  };

  const handleRestart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) {
      handlePlayPause();
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    setHasInteracted(true);

    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }

    if (isPlaying && !isDraggingProgress && !isDraggingVolume) {
      controlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  usePlayerShortcuts({
    playerRef,
    videoRef,
    onPlayPause: handlePlayPause,
    onToggleFullscreen: toggleFullScreen,
    onToggleMute: toggleMute,
    setCurrentTime,
    setVolume: handleVolumeChange,
    onInteract: () => setHasInteracted(true),
  });

  const isVideoEnded = currentTime >= duration && duration > 0;

  return (
    <div
      ref={playerRef}
      className={`relative aspect-video bg-black rounded-t-xl overflow-hidden group select-none ${
        isFullscreen ? 'fullscreen' : ''
      }`}
      onMouseMove={handleMouseMove}
      onClick={(e) => {
        if (e.target === playerRef.current || e.target === videoRef.current) {
          handlePlayPause();
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background text-foreground p-4 text-center">
          <AlertTriangle className="size-10 text-muted-foreground mb-4" />
          <p className="text-lg mb-2">Video playback error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            href={currentClip.url}
            target="_blank"
            variant="primary"
            size="sm"
            className="mt-4"
            onClick={(e) => e.stopPropagation()}
          >
            Open Original Clip
          </Button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            src={currentClip.url}
            poster={currentClip.thumbnail}
            preload="metadata"
            playsInline
            onContextMenu={(e) => e.preventDefault()}
          />

          <PlayerFullscreenOverlay
            isFullscreen={isFullscreen}
            showControls={showControls}
            title={currentClip.title}
            streamer={currentClip.streamer}
            submitter={currentClip.submitter}
            createdAt={currentClip.createdAt}
          />

          {isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-xs pointer-events-none">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
            </div>
          )}

          {!hasInteracted && !isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary/90 hover:bg-primary text-white p-6 rounded-full shadow-lg cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPause();
                }}
                aria-label="Play video"
              >
                <Play className="size-8 fill-current ml-0.5" />
              </motion.button>
            </div>
          )}

          {isVideoEnded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary/90 hover:bg-primary text-white p-6 rounded-full shadow-lg cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRestart();
                }}
                aria-label="Replay video"
              >
                <RotateCcw className="size-8" />
              </motion.button>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showControls || !isPlaying ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-16 pb-4 px-4 pointer-events-none"
          >
            <PlayerProgressBar
              duration={duration}
              currentTime={currentTime}
              bufferedEnd={bufferedEnd}
              videoRef={videoRef}
              setCurrentTime={setCurrentTime}
              onInteract={() => setHasInteracted(true)}
              formatTime={formatTime}
              isDraggingProgress={isDraggingProgress}
              setIsDraggingProgress={setIsDraggingProgress}
            />

            <div className="flex justify-between items-center mt-1">
              <div className="flex items-center space-x-4 pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPause();
                  }}
                  className="text-white hover:text-primary transition-colors flex items-center justify-center w-8 h-8 cursor-pointer"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current ml-0.5" />}
                </button>

                <div className="text-white text-xs sm:text-sm font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span className="mx-1 text-muted-foreground">/</span>
                  <span className="text-muted-foreground">{formatTime(duration || 0)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 pointer-events-auto">
                <PlayerPlaybackRateMenu
                  playbackRate={playbackRate}
                  playbackRates={PLAYBACK_RATES}
                  showPlaybackRateMenu={showPlaybackRateMenu}
                  setShowPlaybackRateMenu={setShowPlaybackRateMenu}
                  onSelectRate={(rate) => {
                    setPlaybackRate(rate);
                    if (videoRef.current) {
                      videoRef.current.playbackRate = rate;
                    }
                    setShowPlaybackRateMenu(false);
                  }}
                />

                <PlayerVolumeControl
                  volume={volume}
                  isMuted={isMuted}
                  onToggleMute={toggleMute}
                  onVolumeChange={handleVolumeChange}
                  isDraggingVolume={isDraggingVolume}
                  setIsDraggingVolume={setIsDraggingVolume}
                  showVolumeControl={showVolumeControl}
                  setShowVolumeControl={setShowVolumeControl}
                />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullScreen();
                  }}
                  className="text-white hover:text-primary transition-colors flex items-center justify-center w-8 h-8 cursor-pointer"
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="size-5" />
                  ) : (
                    <Maximize2 className="size-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default CustomPlayer;