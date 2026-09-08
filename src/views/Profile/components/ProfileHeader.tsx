import React from 'react';
import { motion } from 'framer-motion';
import {
  FaUser,
  FaCalendarAlt,
  FaDiscord,
  FaEdit,
  FaEyeSlash,
  FaCrown,
  FaShieldAlt,
  FaStar,
  FaVrCardboard
} from 'react-icons/fa';
import { PublicProfile } from '../../../types/profileTypes';
import { getUserAvatarUrl, handleAvatarError } from '../../../utils/generateAvatar';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface ProfileHeaderProps {
  profile: PublicProfile;
  isOwnProfile: boolean;
  onEditClick: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isOwnProfile,
  onEditClick
}) => {
  const getRoleIcon = (roles: string[]) => {
    const role = roles[0];
    if (role === 'admin') return <FaCrown className="text-cc-red" />;
    if (role === 'editor') return <FaShieldAlt className="text-[#22c55e]" />;
    if (role === 'clipteam') return <FaStar className="text-[#eab308]" />;
    if (role === 'uploader') return <FaUser className="text-[#38bdf8]" />;
    return <FaUser className="text-[#aaaaaa]" />;
  };

  const getRoleColor = (roles: string[]) => {
    const role = roles[0];
    if (role === 'admin') return 'text-cc-red';
    if (role === 'editor') return 'text-[#22c55e]';
    if (role === 'clipteam') return 'text-[#eab308]';
    if (role === 'uploader') return 'text-[#38bdf8]';
    return 'text-[#aaaaaa]';
  };

  const getRoleName = (roles: string[]) => {
    const role = roles[0];
    if (role === 'admin') return 'Admin';
    if (role === 'editor') return 'Editor';
    if (role === 'clipteam') return 'Clip Team';
    if (role === 'uploader') return 'Uploader';
    if (role === 'user') return 'User';
    return 'Member';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-[#181818] border border-[#262626] rounded-2xl p-6 lg:p-8 relative overflow-hidden shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
        {/* Profile Picture */}
        <div className="relative mb-6 lg:mb-0 flex justify-center lg:justify-start">
          <div className="relative">
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-linear-to-br from-cc-red to-cc-red-active p-1 shadow-lg">
              <div className="w-full h-full rounded-full ring-4 ring-[#141414] overflow-hidden bg-[#222222]">
                <img
                  src={getUserAvatarUrl(profile.username, profile.profilePicture, 256)}
                  alt={`${profile.username}'s profile`}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => handleAvatarError(e, profile.username, 256)}
                />
              </div>
            </div>

            {/* Private Profile Status Indicator */}
            {!profile.profile?.isPublic && (
              <div
                className="absolute -top-1 -right-1 bg-cc-red rounded-full p-2 shadow-md border-2 border-[#181818]"
                title="Private profile"
              >
                <FaEyeSlash className="text-white text-xs" />
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 text-center lg:text-left">
          {/* Name and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#f1f1f1] mb-2 tracking-tight">
                {profile.username}
              </h1>

              {/* Roles */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2 mb-3">
                {profile.roles.map((role, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141414] border border-[#262626] text-[11px] font-semibold uppercase tracking-wider"
                  >
                    {getRoleIcon([role])}
                    <span className={getRoleColor([role])}>
                      {getRoleName([role])}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Edit Button */}
            {isOwnProfile && (
              <button
                onClick={onEditClick}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cc-red hover:bg-cc-red-hover text-white text-xs font-semibold transition cursor-pointer self-center lg:self-start shadow-sm"
              >
                <FaEdit size={12} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {/* Bio */}
          {profile.profile?.bio && (
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-[#aaaaaa] leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {profile.profile.bio}
              </p>
            </div>
          )}

          {/* Stats Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {profile.discordId && profile.discordUsername && (
              <div className="bg-[#141414] rounded-xl p-3 border border-[#262626] flex flex-col items-center justify-center">
                <FaDiscord className="text-[#5865F2] mb-1" size={15} />
                <p className="text-[10px] font-semibold text-[#717171] uppercase tracking-wider">Discord</p>
                <p className="text-xs text-[#f1f1f1] font-medium truncate max-w-full">
                  {profile.discordUsername}
                </p>
              </div>
            )}

            {profile.profile?.vrheadset && profile.profile.vrheadset !== 'Other' && (
              <div className="bg-[#141414] rounded-xl p-3 border border-[#262626] flex flex-col items-center justify-center">
                <FaVrCardboard className="text-[#a855f7] mb-1" size={15} />
                <p className="text-[10px] font-semibold text-[#717171] uppercase tracking-wider">VR Headset</p>
                <p className="text-xs text-[#f1f1f1] font-medium truncate max-w-full">
                  {profile.profile.vrheadset}
                </p>
              </div>
            )}

            <div className="bg-[#141414] rounded-xl p-3 border border-[#262626] flex flex-col items-center justify-center col-span-2 sm:col-span-1">
              <FaCalendarAlt className="text-[#22c55e] mb-1" size={14} />
              <p className="text-[10px] font-semibold text-[#717171] uppercase tracking-wider">Joined</p>
              <p className="text-xs text-[#f1f1f1] font-medium">
                {formatDate(profile.joinDate)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
