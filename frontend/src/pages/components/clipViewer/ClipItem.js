import React, { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCheck } from 'react-icons/fa';

const ClipItem = ({ clip, hasUserRated, setExpandedClip, index }) => {
  const videoRef = useRef(null);
  const location = useLocation();

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <Link
      to={`/clips/${clip._id}`}
      state={{ from: location }}
      onClick={() => setExpandedClip(clip._id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-[80vw] md:w-[30vw] lg:w-[25vw] max-w-[450px] aspect-video animate-fade hover:scale-105 transition duration-200 rounded-lg overflow-hidden ${hasUserRated ? 'border-4 border-blue-500' : 'border-4 border-neutral-950'
        }`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {/* Rated Overlay */}
      {hasUserRated && (
        <div className="absolute z-30 top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-md flex items-center">
          <FaCheck className="mr-1" /> Rated
        </div>
      )}

      {/* Streamer Information */}
      <div className="absolute z-30 top-2 left-2 bg-black/50 text-white px-2 py-1 font-bold rounded-md flex items-center backdrop-blur-sm">
        <a href={clip.link} className="cursor-pointer">
          {clip.streamer}
        </a>
      </div>

      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover transition duration-200 opacity-50 hover:opacity-100 aspect-video"
        src={clip.url + '#t=0.001'} 
        muted
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    </Link>
  );
};

export default ClipItem;