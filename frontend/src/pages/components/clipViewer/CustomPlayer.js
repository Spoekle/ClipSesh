import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause, FaExpand, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { motion } from 'framer-motion';

const CustomPlayer = ({ currentClip }) => {
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [error, setError] = useState(null);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);

    // Timer for hiding controls
    const controlsTimer = useRef(null);

    // Initialize player and add event listeners
    useEffect(() => {
        const video = videoRef.current;

        if (!video) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onTimeUpdate = () => setCurrentTime(video.currentTime);
        const onLoadedMetadata = () => setDuration(video.duration);
        const onVolumeChange = () => {
            setVolume(video.volume);
            setIsMuted(video.muted);
        };
        const onError = () => setError("Error playing video. Please try again.");
        const onWaiting = () => setIsBuffering(true);
        const onCanPlay = () => setIsBuffering(false);

        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('volumechange', onVolumeChange);
        video.addEventListener('error', onError);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('canplay', onCanPlay);

        return () => {
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('volumechange', onVolumeChange);
            video.removeEventListener('error', onError);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('canplay', onCanPlay);
        };
    }, []);

    // Control visibility of control UI
    useEffect(() => {
        if (!hasInteracted) return;

        if (controlsTimer.current) {
            clearTimeout(controlsTimer.current);
        }

        if (isPlaying) {
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
    }, [isPlaying, hasInteracted, currentTime]);

    const handlePlayPause = () => {
        const video = videoRef.current;
        if (!video) return;

        setHasInteracted(true);

        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        const video = videoRef.current;
        if (!video) return;

        video.volume = newVolume;
        if (newVolume === 0) {
            video.muted = true;
        } else if (video.muted) {
            video.muted = false;
        }
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = !video.muted;
    };

    const handleSeek = (e) => {
        const video = videoRef.current;
        if (!video) return;

        const seekTime = (e.target.value / 100) * duration;
        video.currentTime = seekTime;
        setCurrentTime(seekTime);
    };

    const toggleFullScreen = () => {
        const player = playerRef.current;
        if (!player) return;

        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            player.requestFullscreen().catch((err) => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        }
    };

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);

        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Show controls when moving the mouse over player
    const handleMouseMove = () => {
        setShowControls(true);
        setHasInteracted(true);

        if (controlsTimer.current) {
            clearTimeout(controlsTimer.current);
        }

        if (isPlaying) {
            controlsTimer.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    return (
        <div
            ref={playerRef}
            className="relative aspect-video bg-black rounded-t-xl overflow-hidden group"
            onMouseMove={handleMouseMove}
            onClick={handlePlayPause}
        >
            {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-white p-4 text-center">
                    <div className="text-4xl mb-4">😕</div>
                    <p className="text-lg mb-2">Video playback error</p>
                    <p className="text-sm text-neutral-400">{error}</p>
                    <a
                        href={currentClip.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
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
                    />

                    {/* Buffering Indicator */}
                    {isBuffering && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    )}

                    {/* Play Overlay (for initial state) */}
                    {!hasInteracted && !isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-blue-600/80 hover:bg-blue-700/80 text-white p-6 rounded-full"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayPause();
                                }}
                            >
                                <FaPlay className="text-3xl" />
                            </motion.button>
                        </div>
                    )}

                    {/* Video Controls */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: showControls || !isPlaying ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-12 pointer-events-none ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
                    >
                        {/* Progress Bar */}
                        <div className="mb-3 pointer-events-auto">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={(currentTime / duration) * 100 || 0}
                                onChange={handleSeek}
                                onClick={e => e.stopPropagation()}
                                className="w-full h-1.5 bg-neutral-600 rounded-lg appearance-none cursor-pointer 
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-runnable-track]:h-1.5"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            {/* Left Controls */}
                            <div className="flex items-center space-x-3 pointer-events-auto">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlayPause();
                                    }}
                                    className="text-white hover:text-blue-400 transition-colors p-1"
                                >
                                    {isPlaying ? <FaPause /> : <FaPlay />}
                                </button>

                                <div className="flex items-center group relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleMute();
                                        }}
                                        className="text-white hover:text-blue-400 transition-colors mr-2 p-1"
                                    >
                                        {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
                                    </button>

                                    <div className="w-16 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={isMuted ? 0 : volume}
                                            onChange={handleVolumeChange}
                                            onClick={e => e.stopPropagation()}
                                            className="h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer 
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 
                               [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-runnable-track]:h-1"
                                        />
                                    </div>
                                </div>

                                <div className="text-white text-sm"></div>
                                {formatTime(currentTime)} / {formatTime(duration || 0)}
                            </div>
                        </div>

                        {/* Right Controls */}
                        <div className="pointer-events-auto">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFullScreen();
                                }}
                                className="text-white hover:text-blue-400 transition-colors p-1"
                            >
                                <FaExpand />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
};

export default CustomPlayer;