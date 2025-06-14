import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaAngleDown, FaTimes } from 'react-icons/fa';
import { AiOutlineClose } from 'react-icons/ai';
import axios from 'axios';
import apiUrl from '../../../../../config/config';

const RatingsPopup = ({ clip, ratings, setPopout }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [localRatings, setLocalRatings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // If ratings prop is not provided or missing data, fetch them directly
  useEffect(() => {
    const fetchRatings = async () => {
      if (!ratings || !ratings[clip._id]) {
        setIsLoading(true);
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${apiUrl}/api/ratings/${clip._id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
          });
          
          if (response.data) {
            const fetchedRatings = {
              [clip._id]: response.data
            };
            setLocalRatings(fetchedRatings);
          }
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
        className="fixed bottom-0 right-4 w-96 z-30 bg-neutral-900 text-white rounded-t-xl shadow-2xl"
      >
        <div className="flex justify-between items-center p-3 border-b border-neutral-700">
          <h3 className="text-xl font-bold">Ratings</h3>
          <button
            className="text-neutral-400 hover:text-white transition-colors"
            onClick={() => setPopout('')}
          >
            <AiOutlineClose size={22} />
          </button>
        </div>
        <div className="p-10 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
        className="fixed bottom-0 right-4 w-96 z-30 bg-neutral-900 text-white rounded-t-xl shadow-2xl"
      >
        <div className="flex justify-between items-center p-3 border-b border-neutral-700">
          <h3 className="text-xl font-bold">Ratings</h3>
          <button
            className="text-neutral-400 hover:text-white transition-colors"
            onClick={() => setPopout('')}
          >
            <AiOutlineClose size={22} />
          </button>
        </div>
        <div className="p-8 text-center">
          <p>No ratings data available for this clip.</p>
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

  // Get deny count
  const denyData = ratingCounts.find(r => r.rating === 'deny');
  const denyCount = denyData ? denyData.count : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-0 right-4 w-96 z-30 bg-neutral-900 text-white rounded-t-xl shadow-2xl"
    >
      <div className="flex justify-between items-center p-3 border-b border-neutral-700">
        <h3 className="text-xl font-bold">Ratings</h3>
        <button
          className="text-neutral-400 hover:text-white transition-colors"
          onClick={() => setPopout('')}
        >
          <AiOutlineClose size={22} />
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-neutral-800 p-3 rounded-lg text-center">
            <p className="text-sm text-neutral-400">Average Rating</p>
            <div className={`text-3xl font-bold ${
              averageRating === 'N/A' ? 'text-neutral-400' :
              Number(averageRating) >= 4 ? 'text-red-500' :
              Number(averageRating) >= 3 ? 'text-orange-500' :
              Number(averageRating) >= 2 ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {averageRating}
            </div>
          </div>
          <div className="bg-neutral-800 p-3 rounded-lg text-center">
            <p className="text-sm text-neutral-400">Total Ratings</p>
            <div className="text-3xl font-bold text-blue-500">{totalRatings}</div>
          </div>
        </div>

        {denyCount > 0 && (
          <div className="mb-4 bg-red-900/30 border border-red-700 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-lg font-bold text-red-400">Denied</span>
                <span className="ml-2 text-sm text-neutral-400">by {denyCount} user{denyCount !== 1 ? 's' : ''}</span>
              </div>
              <button
                onClick={() => setSelectedCategory(selectedCategory === 'deny' ? null : 'deny')}
                className="text-neutral-400 hover:text-white"
              >
                {selectedCategory === 'deny' ? <FaTimes /> : <FaAngleDown />}
              </button>
            </div>
            
            <AnimatePresence>
              {selectedCategory === 'deny' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-red-800">
                    <p className="font-semibold mb-2">Users who denied:</p>
                    <div className="max-h-32 overflow-y-auto custom-scrollbar">
                      {denyData?.users?.map(user => (
                        <div key={user.userId} className="flex items-center py-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          <span>{user.username}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <h4 className="text-lg font-semibold mb-3">Rating Distribution</h4>
        <div className="space-y-3">
          {[4, 3, 2, 1].map(ratingValue => {
            const rateData = ratingCounts.find(r => Number(r.rating) === ratingValue) || { count: 0, users: [] };
            const percentage = totalRatings > 0 ? (rateData.count / totalRatings) * 100 : 0;
            
            return (
              <div key={ratingValue} className="bg-neutral-800 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className={`text-lg font-bold ${
                      ratingValue === 4 ? 'text-red-500' : 
                      ratingValue === 3 ? 'text-orange-500' : 
                      ratingValue === 2 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>{ratingValue}</span>
                    <div className="ml-3 h-2 w-40 bg-neutral-700 rounded-full">
                      <div 
                        className={`h-2 rounded-full ${
                          ratingValue === 4 ? 'bg-red-500' : 
                          ratingValue === 3 ? 'bg-orange-500' : 
                          ratingValue === 2 ? 'bg-yellow-600' : 
                          'bg-green-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-neutral-400 mr-3">{rateData.count} user{rateData.count !== 1 ? 's' : ''}</span>
                    <button
                      onClick={() => setSelectedCategory(selectedCategory === ratingValue ? null : ratingValue)}
                      className="text-neutral-400 hover:text-white"
                    >
                      {selectedCategory === ratingValue ? <FaTimes /> : <FaAngleDown />}
                    </button>
                  </div>
                </div>
                
                <AnimatePresence>
                  {selectedCategory === ratingValue && rateData.users?.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-neutral-700">
                        <p className="font-semibold mb-2">Users who rated {ratingValue}:</p>
                        <div className="max-h-32 overflow-y-auto custom-scrollbar">
                          {rateData.users?.map(user => (
                            <div key={user.userId} className="flex items-center py-1">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                ratingValue === 4 ? 'bg-red-500' : 
                                ratingValue === 3 ? 'bg-orange-500' : 
                                ratingValue === 2 ? 'bg-yellow-600' : 
                                'bg-green-600'
                              }`}></div>
                              <span>{user.username}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
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
