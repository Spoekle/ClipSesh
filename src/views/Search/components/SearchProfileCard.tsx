'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from '@/lib/routerCompat';
import { FaDiscord } from 'react-icons/fa';
import { SearchProfile } from '../../../types/searchTypes';
import generateAvatar from '../../../utils/generateAvatar';

interface SearchProfileCardProps {
  profile: SearchProfile;
  index?: number;
  highlightSearchTerm: (text: string) => ReactNode;
}

const SearchProfileCard: React.FC<SearchProfileCardProps> = ({ profile, index = 0, highlightSearchTerm }) => {
  const navigate = useNavigate();

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-[#f23030]/15 text-[#f23030] border border-[#f23030]/30';
      case 'editor':
        return 'bg-[#222222] text-[#f1f1f1] border border-[#333333]';
      case 'clipteam':
        return 'bg-[#222222] text-[#f1f1f1] border border-[#333333]';
      case 'uploader':
        return 'bg-[#222222] text-[#d4d4d4] border border-[#333333]';
      default:
        return 'bg-[#1e1e1e] text-[#aaaaaa] border border-[#2a2a2a]';
    }
  };

  const avatarSrc = profile.profilePicture || generateAvatar(profile.username) || undefined;
  const joinYear = new Date(profile.createdAt || profile.stats.joinDate || Date.now()).getFullYear();

  return (
    <motion.div
      key={profile._id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      whileHover={{ y: -2 }}
      className="rounded-xl p-4 sm:p-5 cursor-pointer group border border-[#262626] bg-[#181818] hover:bg-[#1e1e1e] hover:border-[#383838] transition-all duration-200 shadow-sm hover:shadow-lg select-none"
      onClick={() => navigate(`/profile/${profile._id}`)}
    >
      <div className="flex items-center gap-4">
        {/* Creator Avatar */}
        <div className="relative shrink-0">
          <img
            src={avatarSrc}
            alt={profile.username}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-[#2a2a2a] group-hover:ring-[#444444] transition-all duration-200 bg-[#121212]"
            onError={(e) => {
              const fallback = generateAvatar(profile.username);
              if (fallback && e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback;
              }
            }}
          />
        </div>

        {/* Creator Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-base font-semibold text-[#f1f1f1] group-hover:text-white truncate transition-colors">
              {highlightSearchTerm(profile.username)}
            </h3>
            {profile.roles && profile.roles.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {profile.roles.slice(0, 2).map((role) => (
                  <span
                    key={role}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getRoleBadge(role)}`}
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}
          </div>

          {profile.discordUsername && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <FaDiscord className="text-[#5865F2] shrink-0" size={13} />
              <span className="text-xs text-[#aaaaaa] truncate">
                {profile.discordUsername}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-[#717171]">
            <span className="font-medium text-neutral-400">{profile.stats.clipsSubmitted} clips</span>
            <span>•</span>
            <span>Joined {joinYear}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SearchProfileCard;
