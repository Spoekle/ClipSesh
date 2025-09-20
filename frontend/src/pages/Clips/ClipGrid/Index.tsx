import ClipItem from './components/ClipItem';
import Pagination from './components/Pagination';
import { motion } from 'framer-motion';
import { Clip, User, Rating } from '../../../types/adminTypes';
import { useEffect, useRef, useCallback } from 'react';

interface ClipGridProps {
  user: User | null;
  ratings: Record<string, Rating>;
  config: any;
  filterRatedClips: boolean;
  filterDeniedClips?: boolean;
  setExpandedClip: (clipId: string) => void;
  isLoading: boolean;
  filteredClips: Clip[];
  currentClips: Clip[];
  currentPage: number;
  totalPages: number;
  paginate: (pageNumber: number) => void;
  itemsPerPage: number;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  useInfiniteScroll?: boolean;
}

const ClipGrid: React.FC<ClipGridProps> = ({
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
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  useInfiniteScroll = false,
}) => {
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!useInfiniteScroll || !hasNextPage || isFetchingNextPage || isLoading) return;
    
    const checkAndLoadMore = () => {
      if (lastElementRef.current) {
        const rect = lastElementRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight + 500;
        
        if (isVisible && hasNextPage && fetchNextPage) {
          console.log('Loading more - element is visible');
          fetchNextPage();
        }
      }
    };

    checkAndLoadMore();
    
    const handleScroll = () => checkAndLoadMore();
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [useInfiniteScroll, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage, currentClips.length]);

  const lastClipElementRef = useCallback((node: HTMLDivElement | null) => {
    lastElementRef.current = node;
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 12
      }
    }
  };

  if (isLoading && currentClips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading clips...</p>
        </div>
      </div>
    );
  }

  if (filteredClips.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8">
        <div className="text-9xl mb-4 text-neutral-400">😢</div>
        <h2 className="text-2xl font-bold text-neutral-700 dark:text-neutral-300 mb-2">No Clips Found</h2>
        <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-lg mb-6">
          {filterRatedClips 
            ? "You've rated all available clips. Check back later for new content!"
            : "No clips match your current filters. Try adjusting your search or filter settings."}
        </p>
      </div>
    );
  }

  return (
    <div className="clip-grid">
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {currentClips.map((clip, index) => {
          const isLastItem = index === currentClips.length - 1;
          const shouldAttachRef = useInfiniteScroll && isLastItem;
          
          return (
            <motion.div 
              key={clip._id}
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              ref={shouldAttachRef ? lastClipElementRef : null}
            >
            <ClipItem
              clip={clip}
              user={user}
              ratings={ratings}
              config={config}
              filterRatedClips={filterRatedClips}
              setExpandedClip={setExpandedClip}
            />
          </motion.div>
          );
        })}
      </motion.div>
      
      {/* Loading indicator for infinite scroll */}
      {useInfiniteScroll && isFetchingNextPage && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-neutral-600 dark:text-neutral-400">Loading more clips...</span>
        </div>
      )}
      
      {/* End of content message for infinite scroll */}
      {useInfiniteScroll && !hasNextPage && currentClips.length > 0 && (
        <div className="text-center py-8">
          <p className="text-neutral-600 dark:text-neutral-400">You've reached the end of the clips!</p>
        </div>
      )}
      
      {/* Fallback load more button (only if automatic scroll doesn't work) */}
      {useInfiniteScroll && hasNextPage && !isFetchingNextPage && (
        <div className="flex justify-center mt-8">
          <button
            onClick={fetchNextPage}
            className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors opacity-70"
            title="Fallback - automatic scroll should handle this"
          >
            Load More
          </button>
        </div>
      )}
      
      {/* Empty placeholders for grid alignment when not full row */}
      {!useInfiniteScroll && currentClips.length > 0 && currentClips.length % 4 !== 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {[...Array(4 - (currentClips.length % 4))].map((_, i) => (
            <div key={i} className="hidden xl:block"></div>
          ))}
        </div>
      )}
      
      {/* Pagination component - only show if not using infinite scroll */}
      {!useInfiniteScroll && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={paginate}
          disabled={isLoading}
        />
      )}
    </div>
  );
};

export default ClipGrid;
