import ClipItem from './components/ClipItem';
import Pagination from './components/Pagination';
import { motion } from 'framer-motion';
import { Clip, User, Rating } from '../../../types/adminTypes';

interface ClipGridProps {
  user: User | null;
  ratings: Record<string, Rating>;
  config: any;
  filterRatedClips: boolean;
  filterDeniedClips?: boolean; // Make optional for backward compatibility
  setExpandedClip: (clipId: string) => void;
  isLoading: boolean;
  filteredClips: Clip[];
  currentClips: Clip[];
  currentPage: number;
  totalPages: number;
  paginate: (pageNumber: number) => void;
  itemsPerPage: number;
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
}) => {
  // Animation settings for staggered appearance
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading clips...</p>
        </div>
      </div>
    );
  }

  if (filteredClips.length === 0) {
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
        {currentClips.map((clip) => (
          <motion.div 
            key={clip._id}
            variants={itemVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
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
        ))}
      </motion.div>
      
      {/* Empty placeholders for grid alignment when not full row */}
      {currentClips.length > 0 && currentClips.length % 4 !== 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {[...Array(4 - (currentClips.length % 4))].map((_, i) => (
            <div key={i} className="hidden xl:block"></div>
          ))}
        </div>
      )}
      
      {/* Pagination component */}
      {totalPages > 1 && (
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
