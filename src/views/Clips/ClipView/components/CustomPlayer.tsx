import { safeLocalStorage } from '@/utils/storage';
import { useState, useRef, useEffect, useCallback } from 'react';
import { FaPlay, FaPause, FaExpand, FaVolumeUp, FaVolumeMute, FaRedo, FaCompress, FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Clip } from '../../../../types/adminTypes';

const CustomPlayer = ({ currentClip }: { currentClip: Clip }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerRef = useRef<any>(null);
    const progressRef = useRef<any>(null);
    const volumeControlRef = useRef<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.5); // Default to half volume
    const [previousVolume, setPreviousVolume] = useState(0.5); // Default to half volume
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDraggingVolume, setIsDraggingVolume] = useState(false);
    const [isDraggingProgress, setIsDraggingProgress] = useState(false);
    const isDraggingProgressRef = useRef(false);
    const wasPlayingBeforeDragRef = useRef(false);
    const [scrubTime, setScrubTime] = useState<number | null>(null);
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [hoverPercentage, setHoverPercentage] = useState<number>(0);
    const [bufferedEnd, setBufferedEnd] = useState<number>(0);
    const [showVolumeControl, setShowVolumeControl] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showPlaybackRateMenu, setShowPlaybackRateMenu] = useState(false);
    const [, setShowQualityMenu] = useState(false);
    
    // Available playback rates
    const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
    
    // Timer for hiding controls
    const controlsTimer = useRef<any>(null);

    // Initialize player and add event listeners
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onTimeUpdate = () => !isDraggingProgressRef.current && setCurrentTime(video.currentTime);
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
            // Try to load thumbnail as poster if available
            if (currentClip?.thumbnail && !video.poster) {
                video.poster = currentClip.thumbnail;
            }
        };
        const onVolumeChange = () => {
            setVolume(video.volume);
            setIsMuted(video.muted);
        };
        const onError = () => {
            console.error("Video playback error:", video.error);
            setError("Error playing video. Please try again.");
        };
        const onWaiting = () => setIsBuffering(true);
        const onCanPlay = () => setIsBuffering(false);
        const onEnded = () => {
            setIsPlaying(false);
            setShowControls(true);
        };

        // Set initial volume based on stored preference or default to 0.5
        const storedVolume = safeLocalStorage.getItem('clipViewerVolume');
        if (storedVolume) {
            const parsedVolume = parseFloat(storedVolume);
            if (!isNaN(parsedVolume)) {
                video.volume = parsedVolume;
                setVolume(parsedVolume);
                setIsMuted(parsedVolume === 0);
            } else {
                // If stored volume is invalid, set to default 0.5
                video.volume = 0.5;
                setVolume(0.5);
            }
        } else {
            // If no stored volume, set to default 0.5
            video.volume = 0.5;
            setVolume(0.5);
        }

        // Register event listeners
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
            // Clean up event listeners
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
    }, [currentClip?.thumbnail]);

    // Track fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Control visibility of control UI
    useEffect(() => {
        if (!hasInteracted) return;

        if (controlsTimer.current) {
            clearTimeout(controlsTimer.current);
        }

        // Only auto-hide controls if video is playing and user isn't dragging anything
        if (isPlaying && !isDraggingProgress && !isDraggingVolume && 
            !showPlaybackRateMenu && !showVolumeControl) {
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
        showVolumeControl
    ]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle keys if this component is focused/visible
            if (!playerRef.current) return;
            
            // Check if video player is in viewport
            const rect = playerRef.current.getBoundingClientRect();
            const isVisible = (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
            
            if (!isVisible) return;
            
            // Don't handle if focused in input fields
            if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
            
            const video = videoRef.current;
            if (!video) return;
            
            setHasInteracted(true);
            
            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    handlePlayPause();
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullScreen();
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMute();
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
                case 'arrowup':
                    e.preventDefault();
                    const newVolumeUp = Math.min(1, video.volume + 0.1);
                    video.volume = newVolumeUp;
                    setVolume(newVolumeUp);
                    if (video.muted) video.muted = false;
                    break;
                case 'arrowdown':
                    e.preventDefault();
                    const newVolumeDown = Math.max(0, video.volume - 0.1);
                    video.volume = newVolumeDown;
                    setVolume(newVolumeDown);
                    break;
                case '0':
                case '1':
                    e.preventDefault();
                    video.currentTime = (parseInt(e.key) / 10) * video.duration;
                    setCurrentTime(video.currentTime);
                    break;
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    e.preventDefault();
                    video.currentTime = (parseInt(e.key) / 10) * video.duration;
                    setCurrentTime(video.currentTime);
                    break;
                default:
                    break;
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Save volume preference when changed
    useEffect(() => {
        if (volume !== undefined && !isDraggingVolume) {
            safeLocalStorage.setItem('clipViewerVolume', volume.toString());
        }
    }, [volume, isDraggingVolume]);

    // Update playback rate when changed
    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    const handlePlayPause = () => {
        const video = videoRef.current;
        if (!video) return;

        setHasInteracted(true);

        if (video.paused) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Play error:", error);
                    setError("Playback was prevented. Please try again.");
                });
            }
        } else {
            video.pause();
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        const video = videoRef.current;
        if (!video) return;

        video.volume = newVolume;
        setVolume(newVolume);
        
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
            // Restore previous volume if it was greater than 0, otherwise set to 0.5
            const newVolume = previousVolume > 0 ? previousVolume : 0.5;
            video.volume = newVolume;
            setVolume(newVolume);
            setIsMuted(false);
        } else {
            setPreviousVolume(video.volume); // Store current volume before muting
            video.muted = true;
            setIsMuted(true);
        }
    };

    const getPercentageFromClientX = useCallback((clientX: number) => {
        if (!progressRef.current) return 0;
        const rect = progressRef.current.getBoundingClientRect();
        if (rect.width === 0) return 0;
        const pos = (clientX - rect.left) / rect.width;
        return Math.max(0, Math.min(1, pos));
    }, []);

    const handleProgressPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        setHasInteracted(true);

        const video = videoRef.current;
        if (!video || !duration) return;

        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
            // Fallback if not supported
        }

        isDraggingProgressRef.current = true;
        setIsDraggingProgress(true);
        wasPlayingBeforeDragRef.current = !video.paused;

        const pct = getPercentageFromClientX(e.clientX);
        const targetTime = pct * duration;
        setScrubTime(targetTime);
        setCurrentTime(targetTime);
        video.currentTime = targetTime;
    };

    const handleProgressPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!duration) return;
        const pct = getPercentageFromClientX(e.clientX);
        const time = pct * duration;

        setHoverPercentage(pct * 100);
        setHoverTime(time);

        if (isDraggingProgressRef.current) {
            setScrubTime(time);
            setCurrentTime(time);
            if (videoRef.current) {
                videoRef.current.currentTime = time;
            }
        }
    };

    const handleProgressPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingProgressRef.current) return;

        try {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
            }
        } catch {
            // Ignore
        }

        isDraggingProgressRef.current = false;
        setIsDraggingProgress(false);

        const video = videoRef.current;
        if (video && duration) {
            const pct = getPercentageFromClientX(e.clientX);
            const targetTime = pct * duration;
            video.currentTime = targetTime;
            setCurrentTime(targetTime);

            if (wasPlayingBeforeDragRef.current) {
                video.play().catch(() => {});
            }
        }
        setScrubTime(null);
    };

    const handleProgressPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
        handleProgressPointerUp(e);
    };

    const handleProgressMouseLeave = () => {
        if (!isDraggingProgressRef.current) {
            setHoverTime(null);
        }
    };

    // Global listener ensures drag state resets cleanly if pointer is released outside
    useEffect(() => {
        const handleGlobalPointerUp = () => {
            if (isDraggingProgressRef.current) {
                isDraggingProgressRef.current = false;
                setIsDraggingProgress(false);
                setScrubTime(null);
                if (wasPlayingBeforeDragRef.current && videoRef.current) {
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
    }, []);

    const handleVolumeClick = (e) => {
        e.stopPropagation();
        if (!volumeControlRef.current) return;

        const rect = volumeControlRef.current.getBoundingClientRect();
        let volumeValue = (e.clientX - rect.left) / rect.width;
        volumeValue = Math.max(0, Math.min(volumeValue, 1)); // Clamp between 0 and 1
        
        const video = videoRef.current;
        if (!video) return;
        
        video.volume = volumeValue;
        setVolume(volumeValue);
        
        if (volumeValue === 0) {
            video.muted = true;
            setIsMuted(true);
        } else if (video.muted) {
            video.muted = false;
            setIsMuted(false);
        }
    };

    const handleVolumeMouseDown = (e) => {
        e.stopPropagation(); // Prevent click on video
        setIsDraggingVolume(true);
        
        // Set initial volume based on click position
        handleVolumeClick(e);
        
        document.addEventListener('mousemove', handleVolumeMouseMove);
        document.addEventListener('mouseup', handleVolumeMouseUp);
    };

    const handleVolumeMouseMove = (e) => {
        if (!isDraggingVolume || !volumeControlRef.current) return;
        
        const rect = volumeControlRef.current.getBoundingClientRect();
        let volumeValue = (e.clientX - rect.left) / rect.width;
        volumeValue = Math.max(0, Math.min(volumeValue, 1)); // Clamp between 0 and 1
        
        const video = videoRef.current;
        if (!video) return;
        
        video.volume = volumeValue;
        setVolume(volumeValue);
        if (volumeValue === 0) {
            video.muted = true;
            setIsMuted(true);
        } else if (video.muted) {
            video.muted = false;
            setIsMuted(false);
        }
    };

    const handleVolumeMouseUp = () => {
        setIsDraggingVolume(false);
        document.removeEventListener('mousemove', handleVolumeMouseMove);
        document.removeEventListener('mouseup', handleVolumeMouseUp);
    };

    const toggleFullScreen = () => {
        const player = playerRef.current;
        if (!player) return;

        if (document.fullscreenElement) {
            document.exitFullscreen().catch((err) => {
                console.error('Error exiting fullscreen:', err);
            });
        } else {
            player.requestFullscreen().catch((err) => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        }
    };

    const formatTime = (timeInSeconds) => {
        if (isNaN(timeInSeconds)) return '0:00';
        
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);

        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
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

    const setPlaybackRateValue = (rate) => {
        setPlaybackRate(rate);
        setShowPlaybackRateMenu(false);
    };

    // Show controls when moving the mouse over player
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

    // Format date for fullscreen display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate progress percentage
    const activeCurrentTime = isDraggingProgress && scrubTime !== null ? scrubTime : currentTime;
    const progressPercentage = duration > 0 ? (activeCurrentTime / duration) * 100 : 0;
    const bufferPercentage = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

    // Determine if video is finished playing
    const isVideoEnded = currentTime >= duration && duration > 0;

    return (
        <div
            ref={playerRef}
            className={`relative aspect-video bg-black rounded-t-xl overflow-hidden group ${isFullscreen ? 'fullscreen' : ''}`}
            onMouseMove={handleMouseMove}
            onClick={(e) => {
                // Don't propagate clicks from controls
                if (e.target === playerRef.current || e.target === videoRef.current) {
                    handlePlayPause();
                }
            }}
            onContextMenu={e => e.preventDefault()}
        >
            {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-white p-4 text-center">
                    <FaExclamationTriangle className="text-4xl text-neutral-500 mb-4" />
                    <p className="text-lg mb-2">Video playback error</p>
                    <p className="text-sm text-neutral-400">{error}</p>
                    <a
                        href={currentClip.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 px-4 py-2 bg-[#f23030] hover:bg-[#d92626] text-white rounded-[10px] transition font-medium"
                        onClick={e => e.stopPropagation()}
                    >
                        Open Original Clip
                    </a>
                </div>
            ) : (
                <>
                    {/* Video Element */}
                    <video
                        ref={videoRef}
                        className="w-full h-full object-contain"
                        src={currentClip.url}
                        poster={currentClip.thumbnail}
                        preload="metadata"
                        playsInline
                        onContextMenu={e => e.preventDefault()}
                    />

                    {/* Fullscreen Info Overlay */}
                    {isFullscreen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -20 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 pt-6 pb-10 pointer-events-none"
                        >
                            <h2 className="text-white text-xl font-bold mb-2">{currentClip.title}</h2>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/80">
                                <div className="flex items-center">
                                    <span className="font-semibold mr-1">Streamer:</span> {currentClip.streamer}
                                </div>
                                {currentClip.submitter && (
                                    <div className="flex items-center">
                                        <span className="font-semibold mr-1">Submitted by:</span> {currentClip.submitter}
                                    </div>
                                )}
                                {currentClip.createdAt && (
                                    <div className="flex items-center">
                                        <span className="font-semibold mr-1">Date:</span> {formatDate(currentClip.createdAt)}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Buffering Indicator */}
                    {isBuffering && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-none">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f23030]"></div>
                        </div>
                    )}

                    {/* Play Overlay for initial view */}
                    {!hasInteracted && !isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-[#f23030]/90 hover:bg-[#d92626] text-white p-6 rounded-full shadow-lg"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayPause();
                                }}
                                aria-label="Play video"
                            >
                                <FaPlay className="text-3xl" />
                            </motion.button>
                        </div>
                    )}

                    {/* Replay button when video ends */}
                    {isVideoEnded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-[#f23030]/90 hover:bg-[#d92626] text-white p-6 rounded-full shadow-lg"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRestart();
                                }}
                                aria-label="Replay video"
                            >
                                <FaRedo className="text-3xl" />
                            </motion.button>
                        </div>
                    )}

                    {/* Video Controls */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: showControls || !isPlaying ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-16 pb-4 px-4 pointer-events-none"
                    >
                        {/* Progress Bar (Generous 28px hit target, smooth YouTube-style scrubber) */}
                        <div 
                            className="relative h-7 flex items-center cursor-pointer pointer-events-auto touch-none select-none group/scrubber -my-1" 
                            ref={progressRef}
                            onPointerDown={handleProgressPointerDown}
                            onPointerMove={handleProgressPointerMove}
                            onPointerUp={handleProgressPointerUp}
                            onPointerCancel={handleProgressPointerCancel}
                            onMouseLeave={handleProgressMouseLeave}
                        >
                            {/* Hover / Scrub Time Tooltip Preview */}
                            {(hoverTime !== null || isDraggingProgress) && duration > 0 && (
                                <div
                                    className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-[#181818]/95 text-white text-[11px] font-mono font-medium pointer-events-none border border-white/15 shadow-xl whitespace-nowrap z-30 backdrop-blur-xs"
                                    style={{
                                        left: `${Math.max(2, Math.min(98, isDraggingProgress ? progressPercentage : hoverPercentage))}%`
                                    }}
                                >
                                    {formatTime(isDraggingProgress && scrubTime !== null ? scrubTime : (hoverTime || 0))}
                                </div>
                            )}

                            {/* Track Container */}
                            <div className={`relative w-full rounded-full transition-all duration-150 bg-white/20 overflow-visible ${isDraggingProgress ? 'h-2' : 'h-1 group-hover/scrubber:h-1.5'}`}>
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
                                    className="absolute left-0 top-0 h-full bg-[#f23030] rounded-full"
                                    style={{ width: `${Math.min(100, progressPercentage)}%` }}
                                />

                                {/* Scrubber Playhead Handle */}
                                <div 
                                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#f23030] rounded-full border-2 border-white shadow-[0_0_8px_rgba(242,48,48,0.8)] pointer-events-none transition-transform duration-150 ${
                                        isDraggingProgress 
                                            ? 'scale-125' 
                                            : 'scale-0 group-hover/scrubber:scale-100'
                                    }`}
                                    style={{ left: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
                                />
                            </div>
                        </div>
                        
                        {/* Time display and controls row */}
                        <div className="flex justify-between items-center">
                            {/* Left controls */}
                            <div className="flex items-center space-x-4 pointer-events-auto">
                                {/* Play/Pause button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlayPause();
                                    }}
                                    className="text-white hover:text-[#f23030] transition-colors flex items-center justify-center w-8 h-8"
                                    aria-label={isPlaying ? 'Pause' : 'Play'}
                                >
                                    {isPlaying ? 
                                        <FaPause className="text-lg" /> : 
                                        <FaPlay className="text-lg" />
                                    }
                                </button>

                                {/* Time display */}
                                <div className="text-white text-sm">
                                    <span>{formatTime(activeCurrentTime)}</span>
                                    <span className="mx-1">/</span>
                                    <span>{formatTime(duration || 0)}</span>
                                </div>
                            </div>
                            
                            {/* Right Controls */}
                            <div className="flex items-center space-x-4 pointer-events-auto">
                                {/* Playback rate dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowPlaybackRateMenu(!showPlaybackRateMenu);
                                            setShowQualityMenu(false);
                                        }}
                                        className="text-white hover:text-[#f23030] transition-colors text-xs px-2 py-1 rounded bg-black/30"
                                    >
                                        {playbackRate}x
                                    </button>
                                    
                                    <AnimatePresence>
                                        {showPlaybackRateMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute bottom-full right-0 mb-1 bg-[#161d21] border border-[#263238] rounded-[8px] overflow-hidden"
                                            >
                                                {playbackRates.map(rate => (
                                                    <button
                                                        key={rate}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPlaybackRateValue(rate);
                                                        }}
                                                        className={`block w-full text-left px-4 py-2 text-sm ${
                                                            playbackRate === rate 
                                                                ? 'bg-[#f23030] text-white font-medium' 
                                                                : 'text-[#e6e6e6] hover:bg-[#263238]'
                                                        }`}
                                                    >
                                                        {rate}x
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Volume control */}
                                <div 
                                    className="relative flex items-center group"
                                    onMouseEnter={() => setShowVolumeControl(true)}
                                    onMouseLeave={() => !isDraggingVolume && setShowVolumeControl(false)}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleMute();
                                        }}
                                        className="text-white hover:text-[#f23030] transition-colors flex items-center justify-center w-8 h-8"
                                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                                    >
                                        {isMuted || volume === 0 ? 
                                            <FaVolumeMute className="text-lg" /> : 
                                            <FaVolumeUp className="text-lg" />
                                        }
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
                                                    className="w-full h-1 bg-neutral-600 rounded-full cursor-pointer relative"
                                                    onClick={handleVolumeClick}
                                                    onMouseDown={handleVolumeMouseDown}
                                                >
                                                    <div 
                                                        className="h-full bg-[#f23030] rounded-full"
                                                        style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                                                    />
                                                    {/* Volume handle/knob */}
                                                    <div 
                                                        className={`absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md ${isDraggingVolume ? 'scale-125' : ''}`}
                                                        style={{ left: `${(isMuted ? 0 : volume) * 100}%` }}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Fullscreen button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFullScreen();
                                    }}
                                    className="text-white hover:text-[#f23030] transition-colors flex items-center justify-center w-8 h-8"
                                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                                >
                                    {isFullscreen ? 
                                        <FaCompress className="text-lg" /> : 
                                        <FaExpand className="text-lg" />
                                    }
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}

            <style jsx>{`
                /* When in fullscreen mode, add a subtle glow to the progress bar */
                .fullscreen .pointer-events-auto {
                    cursor: pointer;
                }
                
                /* Improve volume slider appearance */
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    background: white;
                    border-radius: 50%;
                    cursor: pointer;
                }
                
                /* Video has focus styles only when using keyboard navigation */
                video:focus-visible {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }
            `}</style>
        </div>
    );
};

export default CustomPlayer;