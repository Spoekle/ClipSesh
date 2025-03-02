import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCheck, FaPlay } from 'react-icons/fa';

const ClipItem = ({ clip, hasUserRated, setExpandedClip, index }) => {
  const videoRef = useRef(null);
  const thumbnailRef = useRef(null);
  const location = useLocation();
  const [isVideoError, setIsVideoError] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Add proper URL formatting to ensure video loads correctly
  const getVideoUrl = (url) => {
    if (!url) return '';
    // Ensure URL doesn't have duplicate fragments
    return url.split('#')[0] + '#t=0.001';
  };

  // Log errors for debugging
  useEffect(() => {
    if (videoRef.current) {
      const handleVideoError = () => {
        console.error(`Error loading video for clip: ${clip._id}`, videoRef.current.error);
        setIsVideoError(true);
      };

      videoRef.current.addEventListener('error', handleVideoError);
      return () => {
        videoRef.current?.removeEventListener('error', handleVideoError);
      };
    }
  }, [clip._id]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current && !isVideoError) {
      try {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Video started playing successfully
              setIsVideoLoaded(true);
              
              // Add hover classes for transitions
              if (clip.thumbnail && thumbnailRef.current) {
                videoRef.current.classList.add('group-hover:opacity-100');
                thumbnailRef.current.classList.add('group-hover:opacity-0');
              }
            })
            .catch(error => {
              // Auto-play was prevented (common in many browsers)
              console.log("Autoplay prevented:", error);
            });
        }
      } catch (err) {
        console.error("Video play error:", err);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch (err) {
        console.error("Video pause error:", err);
      }
    }
  };

  return (
    <Link
      to={`/clips/${clip._id}`}
      state={{ from: location }}
      onClick={() => setExpandedClip(clip._id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative block w-full aspect-video rounded-xl overflow-hidden animate-fade shadow-lg hover:shadow-xl transition duration-200 transform hover:scale-[1.03]`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {/* Rating badge */}
      {hasUserRated && (
        <div className="absolute z-30 top-2 right-2 bg-blue-500/80 backdrop-blur-sm text-white px-2 py-1 rounded-md flex items-center">
          <FaCheck className="mr-1" /> Rated
        </div>
      )}

      {/* Streamer name */}
      <div className="absolute z-30 top-2 left-2 bg-neutral-800/80 backdrop-blur-sm text-white px-3 py-1 font-bold rounded-md">
        {clip.streamer}
      </div>

      {/* Thumbnail - shows initially or if video fails */}
      {(clip.thumbnail || isVideoError) && (
        <div 
          ref={thumbnailRef}
          className={`absolute inset-0 w-full h-full bg-neutral-900 transition-opacity duration-300 ${
            isHovering && !isVideoError ? 'group-hover:opacity-0' : 'opacity-100'
          }`}
        >
          {clip.thumbnail ? (
            <img
              src={clip.thumbnail}
              alt={`${clip.streamer} thumbnail`}
              className="w-full h-full object-cover"
              onError={() => console.log("Thumbnail failed to load")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-800">
              <span className="text-neutral-400">{clip.title}</span>
            </div>
          )}
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          clip.thumbnail ? 'opacity-0' : 'opacity-100'
        } ${isVideoLoaded && isHovering && !isVideoError ? 'group-hover:opacity-100' : ''}`}
        src={getVideoUrl(clip.url)}
        muted
        playsInline
        preload={clip.thumbnail ? "none" : "metadata"}
        onLoadedData={() => setIsVideoLoaded(true)}
        onError={() => setIsVideoError(true)}
        onPlaying={(e) => {
          if(clip.thumbnail && !e.target.classList.contains('group-hover:opacity-100')) {
            e.target.classList.add('group-hover:opacity-100');
            if(thumbnailRef.current && !thumbnailRef.current.classList.contains('group-hover:opacity-0')) {
              thumbnailRef.current.classList.add('group-hover:opacity-0');
            }
          }
        }}
      />

      {/* Title overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <h3 className="text-white text-sm font-medium line-clamp-2">{clip.title}</h3>
      </div>
      
      {/* Border styling */}
      <div className={`absolute inset-0 rounded-xl pointer-events-none border-2 ${
        hasUserRated ? 'border-blue-500' : 'border-neutral-700'
      }`}></div>
    </Link>
  );
};

export default ClipItem;