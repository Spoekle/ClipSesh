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
const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || '') || 'https://api.spoekle.com';


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
    if (role === 'admin') return <FaCrown className="text-red-500" />;
    if (role === 'editor') return <FaShieldAlt className="text-green-500" />;
    if (role === 'clipteam') return <FaStar className="text-[#f23030]" />;
    if (role === 'uploader') return <FaUser className="text-yellow-500" />;
    return <FaUser className="text-neutral-500" />;
  };

  const getRoleColor = (roles: string[]) => {
    const role = roles[0];
    if (role === 'admin') return 'text-red-500';
    if (role === 'editor') return 'text-green-500';
    if (role === 'clipteam') return 'text-[#f23030]';
    if (role === 'uploader') return 'text-yellow-500';
    return 'text-neutral-500';
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
      month: 'long',
      day: 'numeric'
    });
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };
  return (
    <motion.div
      variants={fadeIn}
      className="bg-[#161d21] border border-[#263238] rounded-[10px] p-6 lg:p-8 relative overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
        {/* Profile Picture */}
        <div className="relative mb-6 lg:mb-0 flex justify-center lg:justify-start">
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative"
          >
            <div className="w-36 h-36 rounded-full bg-gradient-to-br from-[#f23030] to-[#c51f1f] p-1 shadow-lg">
              <div className="w-full h-full rounded-full ring-4 ring-[#0e1315] overflow-hidden bg-[#263238]">
                <img
                  src={profile.profilePicture}
                  alt={`${profile.username}'s profile`}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `${backendUrl || 'https://api.spoekle.com'}/profilePictures/profile_placeholder.png`;
                  }}
                />
              </div>
            </div>

            {/* Status indicators */}
            {!profile.profile?.isPublic && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-[#f23030] rounded-full p-2 shadow-md border-2 border-[#0e1315]"
              >
                <FaEyeSlash className="text-white text-xs" />
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 text-center lg:text-left">
          {/* Name and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-3xl lg:text-4xl font-bold text-[#e6e6e6] mb-2 tracking-tight"
              >
                {profile.username}
              </motion.h1>

              {/* Roles */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex flex-wrap justify-center lg:justify-start items-center gap-2 mb-3"
              >
                {profile.roles.map((role, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0e1315] border border-[#263238] text-xs font-medium"
                  >
                    {getRoleIcon([role])}
                    <span className={getRoleColor([role])}>
                      {getRoleName([role])}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Edit Button */}
            {isOwnProfile && (
              <motion.button
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onEditClick}
                className="btn btn-primary btn-sm rounded-xl flex items-center gap-2 self-center lg:self-start shadow-sm"
              >
                <FaEdit size={13} />
                <span>Edit Profile</span>
              </motion.button>
            )}
          </div>

          {/* Bio */}
          {profile.profile?.bio && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-5"
            >
              <p className="text-sm text-[#b3b3b3] leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {profile.profile.bio}
              </p>
            </motion.div>
          )}

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {profile.discordId && profile.discordUsername && (
              <div className="bg-[#0e1315] rounded-[10px] p-3 border border-[#263238] flex flex-col items-center justify-center">
                <FaDiscord className="text-indigo-500 mb-1" size={16} />
                <p className="text-[11px] font-medium text-[#626262]">Discord</p>
                <p className="text-xs text-[#e6e6e6] font-semibold truncate max-w-full">
                  {profile.discordUsername}
                </p>
              </div>
            )}

            {profile.profile?.vrheadset && profile.profile.vrheadset !== 'Other' && (
              <div className="bg-[#0e1315] rounded-[10px] p-3 border border-[#263238] flex flex-col items-center justify-center">
                <FaVrCardboard className="text-purple-500 mb-1" size={16} />
                <p className="text-[11px] font-medium text-[#626262]">VR Headset</p>
                <p className="text-xs text-[#e6e6e6] font-semibold">
                  {profile.profile.vrheadset}
                </p>
              </div>
            )}

            <div className="bg-[#0e1315] rounded-[10px] p-3 border border-[#263238] flex flex-col items-center justify-center">
              <FaCalendarAlt className="text-emerald-500 mb-1" size={15} />
              <p className="text-[11px] font-medium text-[#626262]">Joined</p>
              <p className="text-xs text-[#e6e6e6] font-semibold">
                {formatDate(profile.joinDate)}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
