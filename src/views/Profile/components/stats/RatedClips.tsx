import { safeLocalStorage } from '@/utils/storage';
import React, { useState, useEffect } from 'react';
import { Link } from '@/lib/routerCompat';
import { motion } from 'framer-motion';
import { FaPlay, FaFilm } from 'react-icons/fa';
import { useNotification } from '../../../../context/AlertContext';
import { Rating, Clip } from '../../../../types/adminTypes';

interface ExtendedClip extends Clip {
  userRating?: string | number;
}

interface RatedClipsProps {
  ratingsData: Record<string, Rating>;
  clipsData: Clip[];
  location?: {
    pathname: string;
    state?: unknown;
  };
}

const RatedClips: React.FC<RatedClipsProps> = ({ ratingsData, clipsData, location }) => {
  const [ratedClips, setRatedClips] = useState<ExtendedClip[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [isLoading, setIsLoading] = useState(true);
  const { showError } = useNotification();

  useEffect(() => {
    const filterUserRatedClips = () => {
      try {
        setIsLoading(true);

        const token = safeLocalStorage.getItem('token');
        if (!token) {
          setRatedClips([]);
          return;
        }

        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const userId = tokenPayload.id;

        if (!userId) {
          setRatedClips([]);
          return;
        }

        const userRated: ExtendedClip[] = [];

        clipsData.forEach(clip => {
          const clipRatings = ratingsData[clip._id];
          if (!clipRatings || !clipRatings.ratingCounts) return;

          const userRatedThis = clipRatings.ratingCounts.some(
            ratingCount => ratingCount.users &&
              ratingCount.users.some(ratingUser => ratingUser.userId === userId)
          );

          if (userRatedThis) {
            let userRating: string | number | undefined = undefined;
            clipRatings.ratingCounts.forEach(ratingCount => {
              const userRatingObj = ratingCount.users.find(u => u.userId === userId);
              if (userRatingObj) {
                userRating = ratingCount.rating;
              }
            });

            userRated.push({
              ...clip,
              userRating
            });
          }
        });

        const sortedRated = [...userRated].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setRatedClips(sortedRated);
      } catch (error) {
        console.error('Error filtering rated clips:', error);
        showError('Could not load your rated clips');
        setRatedClips([]);
      } finally {
        setIsLoading(false);
      }
    };

    filterUserRatedClips();
  }, [clipsData, ratingsData, showError]);

  const indexOfLastClip = currentPage * itemsPerPage;
  const indexOfFirstClip = indexOfLastClip - itemsPerPage;
  const currentClips = ratedClips.slice(indexOfFirstClip, indexOfLastClip);
  const totalPages = Math.ceil(ratedClips.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const getRatingBadgeClass = (rating: string | number) => {
    switch (String(rating)) {
      case '4':
        return 'bg-cc-red text-white';
      case '3':
        return 'bg-[#f97316] text-white';
      case '2':
        return 'bg-[#eab308] text-black font-bold';
      case '1':
        return 'bg-[#38bdf8] text-black font-bold';
      case 'deny':
        return 'bg-[#717171] text-white';
      default:
        return 'bg-[#262626] text-[#aaaaaa]';
    }
  };

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div
              key={i}
              className="aspect-video bg-[#141414] animate-pulse rounded-2xl border border-[#262626]"
            />
          ))}
        </div>
      ) : ratedClips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center bg-[#141414] rounded-2xl border border-[#262626] p-6">
          <div className="w-12 h-12 bg-[#181818] rounded-xl flex items-center justify-center mb-4 border border-[#262626]">
            <FaFilm className="text-[#717171] text-xl" />
          </div>
          <h3 className="text-base font-bold text-[#f1f1f1] mb-1">
            No rated clips found
          </h3>
          <p className="text-xs text-[#aaaaaa] max-w-sm mb-6 leading-relaxed">
            You haven't rated any clips yet. Visit the clip browser to start reviewing submissions!
          </p>
          <Link
            to="/clips"
            className="bg-cc-red hover:bg-cc-red-hover text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            Browse Clips
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {currentClips.map((clip: ExtendedClip) => (
              <motion.div
                key={clip._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative group aspect-video rounded-2xl overflow-hidden border border-[#262626] bg-[#141414] hover:border-[#383838] transition-all shadow-sm cursor-pointer"
              >
                <Link
                  to={`/clips/${clip._id}`}
                  state={{ from: location }}
                  className="block w-full h-full"
                >
                  {/* Rating badge */}
                  <div className={`absolute z-30 top-2.5 right-2.5 text-[11px] px-2.5 py-1 rounded-lg flex items-center uppercase tracking-wider font-semibold shadow-md ${getRatingBadgeClass(clip.userRating || 'unknown')}`}>
                    {clip.userRating === 'deny' ? 'Denied' : `Tier ${clip.userRating}`}
                  </div>

                  {/* Streamer name */}
                  <div className="absolute z-30 top-2.5 left-2.5 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 font-medium rounded-lg text-xs border border-white/10 truncate max-w-[55%]">
                    {clip.streamer}
                  </div>

                  {/* Thumbnail */}
                  <div className="w-full h-full bg-[#121212] relative overflow-hidden">
                    {clip.thumbnail ? (
                      <img
                        src={clip.thumbnail}
                        alt={clip.title}
                        className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-[#717171] px-3 text-center">
                        {clip.title}
                      </div>
                    )}
                    {/* Play hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                      <div className="bg-cc-red text-white p-3 rounded-full shadow-xl">
                        <FaPlay className="text-xs ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Title overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/90 via-black/50 to-transparent">
                    <h3 className="text-[#f1f1f1] text-xs font-semibold line-clamp-1 leading-snug">{clip.title}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Modern Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="inline-flex items-center gap-1.5 bg-[#141414] rounded-xl p-1.5 border border-[#262626]">
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#aaaaaa] hover:text-[#f1f1f1] hover:bg-[#222222] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Prev
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(totalPages).keys()].map(number => (
                    <button
                      key={number + 1}
                      onClick={() => paginate(number + 1)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold transition-all cursor-pointer ${
                        currentPage === number + 1
                          ? 'bg-cc-red text-white shadow-sm'
                          : 'text-[#aaaaaa] hover:text-[#f1f1f1] hover:bg-[#222222]'
                      }`}
                    >
                      {number + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#aaaaaa] hover:text-[#f1f1f1] hover:bg-[#222222] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RatedClips;
