import React, { useState, useRef, useEffect } from 'react';
import { MdFullscreen, MdFullscreenExit, MdPause, MdPlayArrow, MdVolumeUp } from "react-icons/md";
import Slider from '@mui/material/Slider';

const CustomPlayer = ({ currentClip }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const [showVolume, setShowVolume] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const divRef = useRef(null);
    const videoRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handlePause = () => setIsPlaying(false);
        const handlePlay = () => setIsPlaying(true);
        const ref = videoRef.current; // create new ref variable because react throws a fit if "videoRef.current" is called during cleanup lol
        if(ref) {
            ref.addEventListener(`pause`, handlePause);
            ref.addEventListener(`play`, handlePlay);
            return () => {
                ref.removeEventListener(`pause`, handlePause);
                ref.removeEventListener(`play`, handlePlay);
            }
        }
    }, [videoRef.current])

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
        }
    }, [volume]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
        } else {
            videoRef.current.pause();
        }
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        setCurrentTime(videoRef.current.currentTime);
    };

    const handleSeek = (e) => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = e.target.value;
        setCurrentTime(e.target.value);
    };

    const handleVolumeChange = (event, newValue) => {
        if (!videoRef.current) return;
        videoRef.current.volume = newValue;
        setVolume(newValue);
    };

    const handleFullscreen = () => {
        if (!divRef.current) return;
        if (divRef.current.requestFullscreen) {
            if(isFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            } else {
                divRef.current.requestFullscreen();
                setIsFullscreen(true);
            }
        }
    };

    return (
        <div ref={divRef} className="relative flex flex-col items-center justify-center">
            <video
                ref={videoRef}
                onTimeUpdate={handleTimeUpdate}
                className="w-full rounded-2xl bg-black object-cover"
                src={currentClip.url + '#t=0.001'}
                controls={false}
            />
                <div className={`absolute bottom-2 ${isMobile ? `w-[calc(100%-1rem)] left-2` : `left-1/2 transform -translate-x-1/2`} flex items-center space-x-3 p-2 bg-white/20 backdrop-blur-md rounded-lg`}>
                    <button onClick={togglePlay} className="text-white text-xl p-1">
                        {isPlaying ? <MdPause /> : <MdPlayArrow />}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max={videoRef.current?.duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1 accent-blue-600 cursor-pointer transition-all"
                    />
                    <div className="relative">
                        <button
                            onClick={() => setShowVolume(!showVolume)}
                            className="text-white text-xl p-1"
                        >
                            <MdVolumeUp />
                        </button>
                        {showVolume && (
                            <div className='absolute h-24 left-[-6px] bottom-[38px] bg-black/20 backdrop-blur-md rounded-t-lg px-1 py-4'>
                                <Slider
                                    orientation="vertical"
                                    value={volume}
                                    onChange={handleVolumeChange}
                                    step={0.01}
                                    min={0}
                                    max={1}
                                />
                            </div>
                        )}
                    </div>
                    <button onClick={handleFullscreen} className="text-white text-xl p-1" title='Fullscreen'>
                        {isFullscreen ? (<MdFullscreenExit />) : (<MdFullscreen />)}
                    </button>
                </div>
        </div>
    );
};

export default CustomPlayer;