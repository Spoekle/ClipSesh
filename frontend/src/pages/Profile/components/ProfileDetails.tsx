import React from 'react';
import { PublicProfile } from '../../../types/profileTypes';

interface ProfileDetailsProps {
  profile: PublicProfile | null;
  isOwnProfile: boolean;
  onEditClick?: () => void;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ 
  profile, 
  isOwnProfile, 
  onEditClick 
}) => {
  if (!profile) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-neutral-300 dark:bg-neutral-800 rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Profile Details
        </h2>
        {isOwnProfile && onEditClick && (
          <button
            onClick={onEditClick}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Bio Section */}
        <div className="bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-700 dark:to-neutral-600 rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            Bio
          </h3>
          <p className="text-neutral-700 dark:text-neutral-200 leading-relaxed">
            {profile.bio || 'No bio provided'}
          </p>
        </div>

        {/* Website Section */}
        {profile.website && (
          <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-4 shadow-md">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              Website
            </h3>
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors duration-200"
            >
              {profile.website}
            </a>
          </div>
        )}

        {/* Member Since Section */}
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            Member Since
          </h3>
          <p className="text-neutral-700 dark:text-neutral-200">
            {profile.joinDate ? formatDate(profile.joinDate) : 'Unknown'}
          </p>
        </div>

        {/* Last Active Section */}
        {profile.lastActive && (
          <div className="bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 rounded-lg p-4 shadow-md">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              Last Active
            </h3>
            <p className="text-neutral-700 dark:text-neutral-200">
              {formatDate(profile.lastActive)}
            </p>
          </div>
        )}

        {/* Profile Visibility */}
        <div className="bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            Profile Visibility
          </h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            profile.isPublic 
              ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
              : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
          }`}>
            {profile.isPublic ? 'Public' : 'Private'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetails;
