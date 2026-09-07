'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from '@/lib/routerCompat';
import { FaPlay, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { format } from 'timeago.js';
import { Clip } from '../../../types/adminTypes';
import generateAvatar from '../../../utils/generateAvatar';
import { ReactNode } from 'react';

interface SearchClipCardProps {
  clip: Clip;
  index?: number;
  highlightSearchTerm: (text: string) => ReactNode;
}

const SearchClipCard: React.FC<SearchClipCardProps> = ({ clip, index = 0, highlightSearchTerm }) => {
  const location = useLocation();
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const formattedDate = format(new Date(clip.createdAt));
  const streamerAvatar = generateAvatar(clip.streamer) || undefined;

  return (
    <motion.div
      key={clip._id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      whileHover={{ y: -3 }}
      className="flex flex-col h-full bg-[#181818] hover:bg-[#1e1e1e] rounded-xl overflow-hidden border border-[#262626] hover:border-[#383838] transition-all duration-200 group cursor-pointer shadow-sm hover:shadow-lg select-none"
    >
      <Link
        to={`/clips/${clip._id}`}
        state={{ from: location }}
        className="block relative aspect-video bg-[#121212] overflow-hidden"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isHovering ? (
          <motion.video
            src={clip.url}
            loop
            muted
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        ) : (
          <img
            src={clip.thumbnail}
            alt={clip.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
            }}
          />
        )}

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Hover play icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="w-11 h-11 bg-[#f23030]/90 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-200">
            <FaPlay className="text-white text-sm ml-0.5" />
          </div>
        </div>

        {/* Comments count badge */}
        {(clip.comments?.length ?? 0) > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[11px] font-medium text-[#f1f1f1] border border-white/10">
            <IoChatbubbleEllipsesOutline size={12} className="text-neutral-300" />
            <span>{clip.comments?.length}</span>
          </div>
        )}

        {/* Streamer Pill on top left */}
        <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-[#f1f1f1] border border-white/10 text-[11px] px-2.5 py-0.5 rounded-full font-medium">
          {clip.streamer}
        </div>
      </Link>

      {/* Details Row: Streamer Avatar + Title + Metadata */}
      <div className="p-3.5 flex gap-3 flex-1">
        {/* Streamer Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#121212] border border-[#2a2a2a] overflow-hidden shrink-0 mt-0.5 flex items-center justify-center">
          <img
            src={streamerAvatar}
            alt={clip.streamer}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Text details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <Link
              to={`/clips/${clip._id}`}
              state={{ from: location }}
              className="block"
            >
              <h3 className="text-sm font-semibold text-[#f1f1f1] group-hover:text-white line-clamp-2 leading-snug tracking-tight transition-colors">
                {highlightSearchTerm(clip.title)}
              </h3>
            </Link>

            <div className="text-xs text-[#aaaaaa] hover:text-white font-medium mt-1 truncate transition-colors">
              {clip.streamer}
            </div>

            <div className="text-xs text-[#717171] mt-1 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-neutral-300 font-medium">
                <FaThumbsUp size={10} className="text-neutral-500" />
                <span>{clip.upvotes}</span>
              </span>
              {clip.downvotes > 0 && (
                <span className="flex items-center gap-1 text-neutral-400">
                  <FaThumbsDown size={10} className="text-neutral-600" />
                  <span>{clip.downvotes}</span>
                </span>
              )}
              <span className="text-neutral-600">•</span>
              <span>{formattedDate}</span>
            </div>
          </div>

          {clip.submitter && clip.submitter !== 'Legacy(no data)' && clip.submitter.toLowerCase() !== clip.streamer.toLowerCase() && (
            <div className="text-[11px] text-[#717171] mt-2 pt-2 border-t border-[#262626] truncate">
              Submitted by <span className="text-neutral-400 font-medium">{clip.submitter}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SearchClipCard;
