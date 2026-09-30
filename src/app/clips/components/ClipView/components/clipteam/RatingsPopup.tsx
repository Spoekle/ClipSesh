'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AiOutlineClose } from 'react-icons/ai';
import { getRatingById } from '@/services/ratingService';
import RatingDistributionGraph from './RatingDistributionGraph';

const RatingsPopup = ({ clip, ratings, setPopout }: any) => {
  const [localRatings, setLocalRatings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // If ratings prop is not provided or missing data, fetch them directly
  useEffect(() => {
    const fetchRatings = async () => {      if (!ratings || !ratings[clip._id]) {
        setIsLoading(true);
        try {
          const ratingData = await getRatingById(clip._id);
          const fetchedRatings = {
            [clip._id]: ratingData
          };
          setLocalRatings(fetchedRatings);
        } catch (error) {
          console.error('Error fetching ratings:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchRatings();
  }, [clip._id, ratings]);

  // Use either provided ratings or locally fetched ones
  const ratingsData = (ratings && ratings[clip._id]) || (localRatings && localRatings[clip._id]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-18 right-0 md:right-4 md:bottom-0 w-full md:w-96 z-30 bg-[#181818] border border-[#262626] text-[#f1f1f1] rounded-t-xl shadow-2xl"
      >
        <div className="flex justify-between items-center p-3.5 border-b border-[#262626]">
          <h3 className="text-lg font-bold text-[#f1f1f1]">Ratings</h3>
          <button
            className="text-[#aaaaaa] hover:text-white transition-colors p-1"
            onClick={() => setPopout('')}
          >
            <AiOutlineClose size={18} />
          </button>
        </div>
        <div className="p-10 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent border-[#f23030]"></div>
        </div>
      </motion.div>
    );
  }

  if (!ratingsData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-18 right-0 md:right-4 md:bottom-0 w-full md:w-96 z-30 bg-[#181818] border border-[#262626] text-[#f1f1f1] rounded-t-xl shadow-2xl"
      >
        <div className="flex justify-between items-center p-3.5 border-b border-[#262626]">
          <h3 className="text-lg font-bold text-[#f1f1f1]">Ratings</h3>
          <button
            className="text-[#aaaaaa] hover:text-white transition-colors p-1"
            onClick={() => setPopout('')}
          >
            <AiOutlineClose size={18} />
          </button>
        </div>
        <div className="p-8 text-center">
          <p className="text-[#aaaaaa] text-sm">No ratings data available for this clip.</p>
        </div>
      </motion.div>
    );
  }

  // Check if the ratings data is in the backend format (with ratings property)
  // or frontend format (with ratingCounts property)
  let ratingCounts;
  
  if (ratingsData.ratingCounts && Array.isArray(ratingsData.ratingCounts)) {
    // Data is already in the expected frontend format
    ratingCounts = ratingsData.ratingCounts;
  } else if (ratingsData.ratings) {
    // Transform backend format to frontend format
    ratingCounts = [
      { rating: '1', count: (ratingsData.ratings['1'] || []).length, users: ratingsData.ratings['1'] || [] },
      { rating: '2', count: (ratingsData.ratings['2'] || []).length, users: ratingsData.ratings['2'] || [] },
      { rating: '3', count: (ratingsData.ratings['3'] || []).length, users: ratingsData.ratings['3'] || [] },
      { rating: '4', count: (ratingsData.ratings['4'] || []).length, users: ratingsData.ratings['4'] || [] },
      { rating: 'deny', count: (ratingsData.ratings['deny'] || []).length, users: ratingsData.ratings['deny'] || [] }
    ];
  } else {
    // Fallback to empty ratings if the data structure is unexpected
    ratingCounts = [
      { rating: '1', count: 0, users: [] },
      { rating: '2', count: 0, users: [] },
      { rating: '3', count: 0, users: [] },
      { rating: '4', count: 0, users: [] },
      { rating: 'deny', count: 0, users: [] }
    ];
  }

  const totalRatings = ratingCounts.reduce((acc, curr) => acc + curr.count, 0);
  
  // Calculate average rating, excluding 'deny'
  const numericRatings = ratingCounts.filter(r => r.rating !== 'deny');
  const averageRating = numericRatings.length > 0 && numericRatings.reduce((acc, curr) => acc + curr.count, 0) > 0
    ? (numericRatings.reduce((acc, curr) => acc + (Number(curr.rating) * curr.count), 0) / 
       numericRatings.reduce((acc, curr) => acc + curr.count, 0)).toFixed(1)
    : 'N/A';



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-18 right-0 md:right-4 md:bottom-0 w-full md:w-96 z-30 bg-[#181818] text-[#f1f1f1] border border-[#262626] rounded-t-xl shadow-2xl"
    >
      <div className="flex justify-between items-center p-3.5 border-b border-[#262626]">
        <h3 className="text-lg font-bold text-[#f1f1f1]">Ratings</h3>
        <button
          className="text-[#aaaaaa] hover:text-white transition-colors p-1"
          onClick={() => setPopout('')}
        >
          <AiOutlineClose size={18} />
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-[#141414] border border-[#262626] p-3 rounded-xl text-center">
            <p className="text-xs text-[#aaaaaa]">Average Rating</p>
            <div className={`text-2xl font-bold mt-1 ${
              averageRating === 'N/A' ? 'text-[#717171]' : 'text-[#f1f1f1]'
            }`}>
              {averageRating}
            </div>
          </div>
          <div className="bg-[#141414] border border-[#262626] p-3 rounded-xl text-center">
            <p className="text-xs text-[#aaaaaa]">Total Ratings</p>
            <div className="text-2xl font-bold text-[#f23030] mt-1">{totalRatings}</div>
          </div>
        </div>

        <RatingDistributionGraph
          ratingCounts={ratingCounts}
          totalRatings={totalRatings}
          averageRating={averageRating}
          className="mt-2"
        />
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(107, 114, 128, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(107, 114, 128, 0.5) transparent;
        }
      `}</style>
    </motion.div>
  );
};

export default RatingsPopup;
