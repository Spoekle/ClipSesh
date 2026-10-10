'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AiOutlineClose } from 'react-icons/ai';
import { getRatingById } from '@/services/ratingService';
import { Clip, Rating, User } from '@/types/adminTypes';
import RatingDistributionGraph, { RatingCountItem } from './RatingDistributionGraph';

interface RatingsPopupProps {
  clip: Clip;
  ratings?: Record<string, Rating>;
  setPopout: (value: string) => void;
  user?: User | null;
  fetchClipsAndRatings?: (user: User | null) => Promise<void>;
}

const RatingsPopup: React.FC<RatingsPopupProps> = ({ clip, ratings, setPopout }) => {
  const [localRatings, setLocalRatings] = useState<Record<string, Rating> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // If ratings prop is not provided or missing data, fetch them directly
  useEffect(() => {
    const fetchRatings = async () => {
      if (!ratings || !ratings[clip._id]) {
        setIsLoading(true);
        try {
          const ratingData = await getRatingById(clip._id);
          if (ratingData) {
            setLocalRatings({
              [clip._id]: ratingData,
            });
          }
        } catch (error: unknown) {
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
        className="fixed bottom-15 right-0 md:right-4 md:bottom-0 w-full md:w-96 z-30 bg-cc-card border border-border text-foreground rounded-t-xl shadow-2xl"
      >
        <div className="flex justify-between items-center p-3.5 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Ratings</h3>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            onClick={() => setPopout('')}
          >
            <AiOutlineClose size={18} />
          </button>
        </div>
        <div className="p-10 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent border-primary"></div>
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
        className="fixed bottom-18 right-0 md:right-4 md:bottom-0 w-full md:w-96 z-30 bg-cc-card border border-border text-foreground rounded-t-xl shadow-2xl"
      >
        <div className="flex justify-between items-center p-3.5 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Ratings</h3>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            onClick={() => setPopout('')}
          >
            <AiOutlineClose size={18} />
          </button>
        </div>
        <div className="p-8 text-center">
          <p className="text-muted-foreground text-sm">No ratings data available for this clip.</p>
        </div>
      </motion.div>
    );
  }

  let ratingCounts: RatingCountItem[];
  
  if (ratingsData.ratingCounts && Array.isArray(ratingsData.ratingCounts)) {
    ratingCounts = ratingsData.ratingCounts.map((rc) => ({
      rating: rc.rating.toString(),
      count: rc.count,
      users: rc.users || [],
    }));
  } else if (ratingsData.ratings) {
    ratingCounts = [
      { rating: '1', count: (ratingsData.ratings['1'] || []).length, users: ratingsData.ratings['1'] || [] },
      { rating: '2', count: (ratingsData.ratings['2'] || []).length, users: ratingsData.ratings['2'] || [] },
      { rating: '3', count: (ratingsData.ratings['3'] || []).length, users: ratingsData.ratings['3'] || [] },
      { rating: '4', count: (ratingsData.ratings['4'] || []).length, users: ratingsData.ratings['4'] || [] },
      { rating: 'deny', count: (ratingsData.ratings['deny'] || []).length, users: ratingsData.ratings['deny'] || [] },
    ];
  } else {
    ratingCounts = [
      { rating: '1', count: 0, users: [] },
      { rating: '2', count: 0, users: [] },
      { rating: '3', count: 0, users: [] },
      { rating: '4', count: 0, users: [] },
      { rating: 'deny', count: 0, users: [] },
    ];
  }

  const totalRatings = ratingCounts.reduce((acc, curr) => acc + curr.count, 0);
  
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
      className="fixed bottom-18 right-0 md:right-4 md:bottom-0 w-full md:w-96 z-30 bg-cc-card text-foreground border border-border rounded-t-xl shadow-2xl"
    >
      <div className="flex justify-between items-center p-3.5 border-b border-border">
        <h3 className="text-lg font-bold text-foreground">Ratings</h3>
        <button
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          onClick={() => setPopout('')}
        >
          <AiOutlineClose size={18} />
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-cc-ground border border-border p-3 rounded-xl text-center">
            <p className="text-xs text-muted-foreground">Average Rating</p>
            <div className={`text-2xl font-bold mt-1 ${
              averageRating === 'N/A' ? 'text-muted-foreground' : 'text-foreground'
            }`}>
              {averageRating}
            </div>
          </div>
          <div className="bg-cc-ground border border-border p-3 rounded-xl text-center">
            <p className="text-xs text-muted-foreground">Total Ratings</p>
            <div className="text-2xl font-bold text-primary mt-1">{totalRatings}</div>
          </div>
        </div>

        <RatingDistributionGraph
          ratingCounts={ratingCounts}
          totalRatings={totalRatings}
          averageRating={averageRating}
          className="mt-2"
        />
      </div>
    </motion.div>
  );
};

export default RatingsPopup;
