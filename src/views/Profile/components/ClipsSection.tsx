import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from '@/lib/routerCompat';
import { FaGamepad } from 'react-icons/fa';
import { PublicProfile } from '../../../types/profileTypes';
import { useClipsByUser } from '../../../hooks/useClips';

interface ClipsSectionProps {
  profile: PublicProfile;
  isOwnProfile: boolean;
  viewSwitchTimestamp?: number;
}

const ClipsSection: React.FC<ClipsSectionProps> = ({
  profile,
  isOwnProfile,
  viewSwitchTimestamp
}) => {
  const navigate = useNavigate();
  const [showAllClips, setShowAllClips] = useState(false);

  const limit = showAllClips ? 50 : 6;
  const {
    data: clipsResponse,
    isLoading: clipsLoading,
    refetch: refetchClips
  } = useClipsByUser(profile.discordId || '', 1, limit);

  const userClips = clipsResponse?.clips || [];
  const totalClips = clipsResponse?.total || 0;

  React.useEffect(() => {
    if (viewSwitchTimestamp) {
      refetchClips();
    }
  }, [viewSwitchTimestamp, refetchClips]);

  const onShowAllClick = () => {
    setShowAllClips(true);
  };

  return (
    <div className="bg-[#181818] rounded-2xl border border-[#262626] p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-[#f1f1f1] flex items-center gap-2.5">
          <div className="w-8 h-8 bg-cc-red/15 text-cc-red rounded-xl flex items-center justify-center">
            <FaGamepad size={14} />
          </div>
          <span>Submitted Clips</span>
          {totalClips > 0 && (
            <span className="px-2 py-0.5 bg-[#141414] border border-[#262626] text-[#aaaaaa] text-xs font-semibold rounded-full">
              {totalClips}
            </span>
          )}
        </h2>
        {totalClips > 6 && !showAllClips && (
          <button
            onClick={onShowAllClick}
            className="bg-cc-red hover:bg-cc-red-hover text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm"
          >
            View All
          </button>
        )}
      </div>

      {clipsLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#262626] border-t-cc-red"></div>
        </div>
      ) : userClips.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {userClips.map((clip, index) => (
            <motion.div
              key={clip._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
              className="rounded-2xl overflow-hidden border border-[#262626] bg-[#141414] hover:border-[#383838] transition-all cursor-pointer group shadow-sm"
              onClick={() => navigate(`/clips/${clip._id}`)}
            >
              {clip.thumbnail ? (
                <div className="aspect-video bg-[#121212] overflow-hidden">
                  <img
                    src={clip.thumbnail}
                    alt={clip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-[#121212] flex items-center justify-center">
                  <FaGamepad className="text-[#717171] text-2xl" />
                </div>
              )}

              <div className="p-3.5">
                <h3 className="text-xs font-semibold text-[#f1f1f1] mb-2 line-clamp-2 leading-snug group-hover:text-cc-red transition-colors">
                  {clip.title}
                </h3>

                <div className="flex items-center justify-between text-xs text-[#aaaaaa] mb-2">
                  <span className="truncate font-medium">{clip.streamer}</span>
                  {clip.upvotes !== undefined && clip.downvotes !== undefined && (
                    <div className="flex items-center gap-1.5 shrink-0 text-xs">
                      <span className="text-[#22c55e] font-semibold">↑{clip.upvotes}</span>
                      <span className="text-cc-red font-semibold">↓{clip.downvotes}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[10px] text-[#717171]">
                  <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-14">
          <div className="w-12 h-12 bg-[#141414] border border-[#262626] rounded-xl flex items-center justify-center mx-auto mb-3 text-[#717171]">
            <FaGamepad size={20} />
          </div>
          <h3 className="text-sm font-semibold text-[#f1f1f1] mb-1">
            No clips yet
          </h3>
          <p className="text-xs text-[#aaaaaa]">
            {isOwnProfile ? "You haven't submitted any clips yet." : "This user hasn't submitted any clips yet."}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClipsSection;
