'use client';

import { useEffect } from 'react';

interface UsePlayerShortcutsProps {
  playerRef: React.RefObject<HTMLDivElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onPlayPause: () => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  onInteract: () => void;
}

export function usePlayerShortcuts({
  playerRef,
  videoRef,
  onPlayPause,
  onToggleFullscreen,
  onToggleMute,
  setCurrentTime,
  setVolume,
  onInteract,
}: UsePlayerShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playerRef.current) return;

      const rect = playerRef.current.getBoundingClientRect();
      const isVisible =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth);

      if (!isVisible) return;

      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      onInteract();

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          onPlayPause();
          break;
        case 'f':
          e.preventDefault();
          onToggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          onToggleMute();
          break;
        case 'arrowright':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 5);
          setCurrentTime(video.currentTime);
          break;
        case 'arrowleft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 5);
          setCurrentTime(video.currentTime);
          break;
        case 'arrowup': {
          e.preventDefault();
          const newVolumeUp = Math.min(1, video.volume + 0.1);
          video.volume = newVolumeUp;
          setVolume(newVolumeUp);
          if (video.muted) video.muted = false;
          break;
        }
        case 'arrowdown': {
          e.preventDefault();
          const newVolumeDown = Math.max(0, video.volume - 0.1);
          video.volume = newVolumeDown;
          setVolume(newVolumeDown);
          break;
        }
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': {
          e.preventDefault();
          const targetTime = (parseInt(e.key, 10) / 10) * video.duration;
          video.currentTime = targetTime;
          setCurrentTime(targetTime);
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    playerRef,
    videoRef,
    onPlayPause,
    onToggleFullscreen,
    onToggleMute,
    setCurrentTime,
    setVolume,
    onInteract,
  ]);
}

export default usePlayerShortcuts;
