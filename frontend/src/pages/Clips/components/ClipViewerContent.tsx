import { useMemo, useEffect, useState, useRef } from 'react';
import ClipSearch from '../../ClipSearch';
import ClipContent from '../ClipView/Index';
import ClipFilterBar from '../ClipGrid/components/ClipFilterBar';
import ClipGrid from '../ClipGrid/Index';
import { Clip, User, Rating } from '../../../types/adminTypes';
import { getClipFilterOptions } from '../../../services/clipService';

interface ClipViewerContentProps {
  expandedClip: string | 'new' | null;
  setExpandedClip: React.Dispatch<React.SetStateAction<string | null>>;
  isClipLoading: boolean;
  currentClip: Clip | null;
  isLoggedIn: boolean;
  user: User | null;
  fetchClipsAndRatings: (user: User | null) => Promise<void>;
  ratings: Record<string, Rating>;
  unratedClips: Clip[];
  sortOptionState: string;
  setSortOptionState: (option: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStreamer: string;
  setFilterStreamer: (streamer: string) => void;
  filterRatedClips: boolean;
  setFilterRatedClips: (rated: boolean) => void;
  filterDeniedClips: boolean;
  setFilterDeniedClips: (denied: boolean) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  setSearchParams: (params: URLSearchParams, options?: { replace?: boolean }) => void;
  isLoading: boolean;
  config: {
    clipAmount: number;
    itemsPerPage: number;
  };
  itemsPerPage: number;
  sortOption: string;
}

const ClipViewerContent: React.FC<ClipViewerContentProps> = ({
  expandedClip,
  setExpandedClip,
  isClipLoading,
  currentClip,
  isLoggedIn,
  user,
  fetchClipsAndRatings,
  ratings,
  unratedClips,
  sortOptionState,
  setSortOptionState,
  searchTerm,
  setSearchTerm,
  filterStreamer,
  setFilterStreamer,
  filterRatedClips,
  setFilterRatedClips,
  filterDeniedClips,
  setFilterDeniedClips,
  currentPage,
  setCurrentPage,
  setSearchParams,
  isLoading,
  config,
  itemsPerPage,
  sortOption,
}) => {
  const [allStreamers, setAllStreamers] = useState<string[]>([]);
  const fetchAttempted = useRef(false);
  
  // Fetch all unique streamers for the filter dropdown
  useEffect(() => {
    if (fetchAttempted.current) {
      return; // Prevent multiple attempts
    }
    
    const fetchStreamers = async () => {
      fetchAttempted.current = true;
      try {
        const filterOptions = await getClipFilterOptions();
        if (filterOptions && filterOptions.streamers) {
          setAllStreamers(filterOptions.streamers);
        }
      } catch (error) {
        console.error('Error fetching streamers:', error);
        // Fallback to current page streamers if API call fails
        const uniqueStreamers = [...new Set(unratedClips.map(clip => clip.streamer))];
        setAllStreamers(uniqueStreamers);
      }
    };

    fetchStreamers();
  }, []); // Only run once on component mount

  // Use all streamers for the dropdown, fallback to current page streamers if not loaded yet
  const streamers = useMemo(() => {
    if (allStreamers.length > 0) {
      return allStreamers;
    }
    // Fallback to streamers from current page while loading
    const uniqueStreamers = [...new Set(unratedClips.map(clip => clip.streamer))];
    return uniqueStreamers;
  }, [allStreamers, unratedClips]);
  // We're not filtering clips client-side anymore since it's done on the server
  const filteredClips = unratedClips;
  
  // Calculate total pages based on the clipAmount from config
  // This ensures pagination works correctly by using the total count of all clips, not just the current page
  const totalPages = useMemo(() => {
    // Get the clip amount from config, or fall back to calculating from the current page
    const totalClips = config.clipAmount || filteredClips.length;
    return Math.max(1, Math.ceil(totalClips / itemsPerPage));
  }, [config.clipAmount, filteredClips.length, itemsPerPage]);

  const handleFilterReset = () => {
    setSearchTerm('');
    setFilterStreamer('');
    setCurrentPage(1);
    
    // Trigger a new fetch with reset filters
    const userData = user;
    fetchClipsAndRatings(userData);
  };

  const handleSortChange = (newSortOption: string) => {
    setSortOptionState(newSortOption);
    
    // Update URL params
    setSearchParams(new URLSearchParams({ 
      sort: newSortOption, 
      page: '1', // Reset to page 1 when sorting changes
      ...(searchTerm && { q: searchTerm }),
      ...(filterStreamer && { streamer: filterStreamer }) 
    }), { replace: true });
    
    // Trigger new fetch with updated sort
    const userData = user;
    fetchClipsAndRatings(userData);
  };

  const paginate = (pageNumber: number) => {
    // Update URL params first
    const newParams = new URLSearchParams(); 
    newParams.append('sort', sortOption);
    newParams.append('page', pageNumber.toString());
    if (searchTerm) newParams.append('q', searchTerm);
    if (filterStreamer) newParams.append('streamer', filterStreamer);
    
    setSearchParams(newParams, { replace: true });
    
    // Update state - this will trigger the useEffect in the parent
    setCurrentPage(pageNumber);
    
    // Scroll to top of grid when paginating
    document.querySelector('.clip-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  if (expandedClip === 'new') {
    return <ClipSearch />;
  }

  if (expandedClip) {
    if (isClipLoading) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      );
    }    if (currentClip) {
      return (
        <ClipContent
          clip={currentClip}
          setExpandedClip={setExpandedClip}
          user={user}
          fetchClipsAndRatings={fetchClipsAndRatings}
          ratings={ratings}
        />
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-white dark:bg-neutral-800 p-8 rounded-xl shadow-lg">
        <div className="text-9xl mb-4 text-neutral-400">🤔</div>
        <h2 className="text-2xl font-bold text-neutral-700 dark:text-neutral-300 mb-2">Clip Not Found</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">The clip you're looking for may have been deleted or doesn't exist.</p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          onClick={() => setExpandedClip(null)}
        >
          Back to All Clips
        </button>
      </div>
    );  }

  // Default view - clip grid with filters
  return (
    <div className="animate-fade-in">      <ClipFilterBar
        sortOptionState={sortOptionState}
        setSortOptionState={setSortOptionState}
        handleSortChange={handleSortChange}
        filterRatedClips={filterRatedClips}
        setFilterRatedClips={setFilterRatedClips}
        filterDeniedClips={filterDeniedClips}
        setFilterDeniedClips={setFilterDeniedClips}
        user={user}
        setExpandedClip={setExpandedClip}
        isLoggedIn={isLoggedIn}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStreamer={filterStreamer}
        setFilterStreamer={setFilterStreamer}
        streamers={streamers}
        handleFilterReset={handleFilterReset}
        fetchClipsAndRatings={fetchClipsAndRatings}
        setSearchParams={setSearchParams}
      />
      
      <ClipGrid
        isLoading={isLoading}
        filteredClips={filteredClips}
        currentClips={filteredClips} // Remove slicing - backend already handles pagination
        user={user}
        ratings={ratings}
        config={config}
        filterRatedClips={filterRatedClips}
        filterDeniedClips={filterDeniedClips}
        setExpandedClip={setExpandedClip}
        currentPage={currentPage}
        totalPages={totalPages}
        paginate={paginate}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};

export default ClipViewerContent;
