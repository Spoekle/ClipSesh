import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ClipItem from './ClipItem';
import Pagination from './Pagination';

const ClipGrid = ({
  isLoading,
  filteredClips,
  currentClips,
  user,
  ratings,
  config,
  filterRatedClips,
  setExpandedClip,
  currentPage,
  totalPages,
  paginate,
  itemsPerPage,
}) => {
  const [previousClips, setPreviousClips] = useState([]);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const [gridHeight, setGridHeight] = useState(null);
  const [direction, setDirection] = useState(0); // -1 for backward, 1 for forward

  // Store grid height to maintain consistent size during page transitions
  useEffect(() => {
    const gridElement = document.querySelector('.clips-container');
    if (gridElement && !isLoading) {
      setGridHeight(gridElement.offsetHeight);
    }
  }, [isLoading]);

  // Handle page transition animations smoothly
  useEffect(() => {
    if (!isLoading && currentClips.length > 0) {
      setPreviousClips(currentClips);
    }
  }, [currentClips, isLoading]);

  const handlePageChange = (newPage) => {
    // Detect direction for animation
    setDirection(newPage > currentPage ? 1 : -1);
    
    // Set changing page state to trigger animation
    setIsChangingPage(true);
    
    // Store grid height before page change
    const gridElement = document.querySelector('.clips-container');
    if (gridElement) {
      setGridHeight(gridElement.offsetHeight);
    }
    
    // Small timeout to allow animation to start before actual page change
    setTimeout(() => {
      paginate(newPage);
      // Reset changing state after a bit to allow new items to animate in
      setTimeout(() => setIsChangingPage(false), 100);
    }, 200);
  };

  // Loading state placeholders with animation
  if (isLoading) {
    return (
      <div className="clip-grid">
        <div 
          className="clips-container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4"
          style={gridHeight ? { minHeight: gridHeight } : {}}
        >
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <motion.div
              key={`loading-${index}`}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative bg-neutral-800/20 aspect-video rounded-lg overflow-hidden shadow-lg"
            />
          ))}
        </div>
        
        <div className="flex justify-center mt-6">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={handlePageChange}
            disabled={true}
          />
        </div>
      </div>
    );
  }

  // Empty state
  if (filteredClips.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <div className="text-5xl mb-4">🎬</div>
        <h3 className="text-xl font-medium text-neutral-800 dark:text-neutral-200 mb-2">No clips found</h3>
        <p className="text-neutral-500 dark:text-neutral-400">
          Try adjusting your filters or check back later
        </p>
      </motion.div>
    );
  }

  // Filter clips based on conditions
  const displayedClips = currentClips
    .filter((clip) => {
      if (filterRatedClips && user && (user.roles.includes('admin') || user.roles.includes('clipteam'))) {
        const ratingData = ratings[clip._id];
        return (
          !ratingData || 
          !ratingData.ratingCounts.some(
            (rateData) => rateData.rating === 'deny' && rateData.count >= config.denyThreshold
          )
        );
      }
      return true;
    });

  // Page transition animations
  const pageTransition = {
    in: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    out: (direction) => ({
      opacity: 0,
      x: direction * 40,
      transition: { duration: 0.2, ease: "easeIn" }
    }),
    initial: (direction) => ({
      opacity: 0,
      x: direction * -40,
    })
  };

  return (
    <div className="clip-grid">
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={`page-${currentPage}`}
          className="clips-container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4"
          custom={direction}
          variants={pageTransition}
          initial="initial"
          animate="in"
          exit="out"
          style={gridHeight ? { minHeight: gridHeight } : {}}
        >
          {displayedClips.map((clip, index) => {
            const hasUserRated =
              user &&
              ratings[clip._id] &&
              ratings[clip._id].ratingCounts?.some((rateData) =>
                rateData.users.some((u) => u.userId === user._id)
              );

            return (
              <motion.div
                key={clip._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                layout
              >
                <ClipItem
                  clip={clip}
                  hasUserRated={hasUserRated}
                  setExpandedClip={setExpandedClip}
                  index={index}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center mt-6">
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={handlePageChange}
          disabled={isChangingPage}
        />
      </div>
    </div>
  );
};

export default ClipGrid;
