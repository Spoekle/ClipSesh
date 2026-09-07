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
    error: clipsError,
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
      className="bg-[#161d21] rounded-[10px] border border-[#263238] p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-bold text-[#e6e6e6] flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#f23030]/10 text-[#f23030] rounded-[8px] flex items-center justify-center">
            <FaGamepad size={14} />
          </div>
          <span>Submitted Clips</span>
          {totalClips > 0 && (
            <span className="px-2 py-0.5 bg-[#f23030]/10 text-[#f23030] text-xs font-semibold rounded-full">
              {totalClips}
            </span>
          )}
        </h2>
        {totalClips > 6 && !showAllClips && (
          <button
            onClick={onShowAllClick}
            className="btn btn-primary btn-sm rounded-xl shadow-xs"
          >
            View All
          </button>
        )}
      </div>

      {clipsLoading ? (
        <div className="flex justify-center items-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-8 h-8 border-2 border-[#263238] border-t-[#f23030] rounded-full"
          />
        </div>
      ) : userClips.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {userClips.map((clip, index) => (
            <motion.div
              key={clip._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
              className="rounded-[10px] overflow-hidden border border-[#263238] bg-[#0e1315] cursor-pointer group"
              onClick={() => navigate(`/clips/${clip._id}`)}
            >
              {clip.thumbnail ? (
                <div className="aspect-video bg-[#161d21] overflow-hidden">
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
                <div className="aspect-video bg-[#161d21] flex items-center justify-center">
                  <FaGamepad className="text-[#626262] text-2xl" />
                </div>
              )}

              <div className="p-3">
                <h3 className="text-xs font-semibold text-[#e6e6e6] mb-2 line-clamp-2 leading-snug group-hover:text-[#f23030] transition-colors">
                  {clip.title}
                </h3>

                <div className="flex items-center justify-between text-[11px] text-[#626262] mb-2">
                  <span className="truncate font-medium text-[#b3b3b3]">{clip.streamer}</span>
                  {clip.upvotes !== undefined && clip.downvotes !== undefined && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-emerald-500 font-semibold">↑{clip.upvotes}</span>
                      <span className="text-red-500 font-semibold">↓{clip.downvotes}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <p className="text-[#626262] text-[10px]">
                    {new Date(clip.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-14 h-14 bg-[#0e1315] rounded-[10px] flex items-center justify-center mx-auto mb-3 text-[#626262]">
            <FaGamepad size={22} />
          </div>
          <h3 className="text-sm font-bold text-[#b3b3b3] mb-1">
            No clips yet
          </h3>
          <p className="text-xs text-[#626262]">
            {isOwnProfile ? "You haven't submitted any clips yet." : "This user hasn't submitted any clips yet."}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ClipsSection;
