import React, { useMemo } from 'react';
import ClipSearch from '../../ClipSearch';
import ClipContent from './ClipContent';
import ClipFilterBar from './ClipFilterBar';
import ClipGrid from './ClipGrid';

const ClipViewerContent = ({
  expandedClip,
  setExpandedClip,
  isClipLoading,
  currentClip,
  isLoggedIn,
  user,
  token,
  fetchClipsAndRatings,
  ratings,
  searchParams,
  unratedClips,
  setUnratedClips,
  sortClips,
  sortOptionState,
  setSortOptionState,
  searchTerm,
  setSearchTerm,
  filterStreamer,
  setFilterStreamer,
  filterRatedClips,
  setFilterRatedClips,
  currentPage,
  setCurrentPage,
  setSearchParams,
  isLoading,
  config,
  itemsPerPage,
  sortOption,
}) => {
  // Create a list of unique streamers for the dropdown
  const streamers = useMemo(() => {
    const uniqueStreamers = [...new Set(unratedClips.map(clip => clip.streamer))];
    return uniqueStreamers.sort();
  }, [unratedClips]);

  // We're not filtering clips client-side anymore since it's done on the server
  const filteredClips = unratedClips;
  
  // Calculate total pages based on the clipAmount from config
  // This ensures pagination works correctly by using the total count of all clips, not just the current page
  const totalPages = useMemo(() => {
    // Get the clip amount from config, or fall back to calculating from the current page
    const totalClips = config.clipAmount || filteredClips.length;
    console.log(`Total clips: ${totalClips}, itemsPerPage: ${itemsPerPage}, calculated pages: ${Math.ceil(totalClips / itemsPerPage)}`);
    return Math.max(1, Math.ceil(totalClips / itemsPerPage));
  }, [config.clipAmount, filteredClips.length, itemsPerPage]);

  const handleFilterReset = () => {
    setSearchTerm('');
    setFilterStreamer('');
    setCurrentPage(1);
    
    // Trigger a new fetch with reset filters
    const userData = user;
    fetchClipsAndRatings(userData, filterRatedClips);
  };

  const handleSortChange = (newSortOption) => {
    setSortOptionState(newSortOption);
    
    // Update URL params
    setSearchParams({ 
      sort: newSortOption, 
      page: 1, // Reset to page 1 when sorting changes
      ...(searchTerm && { q: searchTerm }),
      ...(filterStreamer && { streamer: filterStreamer }) 
    }, { replace: true });
    
    // Trigger new fetch with updated sort
    const userData = user;
    fetchClipsAndRatings(userData, filterRatedClips);
  };

  const paginate = (pageNumber) => {
    // Update URL and state
    setCurrentPage(pageNumber);
    setSearchParams({ 
      sort: sortOption, 
      page: pageNumber,
      ...(searchTerm && { q: searchTerm }),
      ...(filterStreamer && { streamer: filterStreamer }) 
    }, { replace: true });
    
    // Scroll to top of grid when paginating
    document.querySelector('.clip-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Trigger new fetch with updated page
    const userData = user;
    fetchClipsAndRatings(userData, filterRatedClips);
  };

  if (expandedClip === 'new') {
    return <ClipSearch setExpandedPost={setExpandedClip} fetchClips={fetchClipsAndRatings} />;
  }

  if (expandedClip) {
    if (isClipLoading) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      );
    } 
    
    if (currentClip) {
      return (
        <ClipContent
          clip={currentClip}
          setExpandedClip={setExpandedClip}
          isLoggedIn={isLoggedIn}
          user={user}
          token={token}
          fetchClipsAndRatings={fetchClipsAndRatings}
          ratings={ratings}
          searchParams={searchParams}
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
    );
  }

  // Debug output for pagination
  console.log(`Rendering pagination: currentPage=${currentPage}, totalPages=${totalPages}, clipAmount=${config.clipAmount}`);

  // Default view - clip grid with filters
  return (
    <div className="animate-fade-in">
      <ClipFilterBar
        sortOptionState={sortOptionState}
        setSortOptionState={setSortOptionState}
        handleSortChange={handleSortChange}
        filterRatedClips={filterRatedClips}
        setFilterRatedClips={setFilterRatedClips}
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
        token={token}
        setSearchParams={setSearchParams}
      />
      
      <ClipGrid
        isLoading={isLoading}
        filteredClips={filteredClips}
        currentClips={filteredClips} // Just pass all clips since they're already paginated from the server
        user={user}
        ratings={ratings}
        config={config}
        filterRatedClips={filterRatedClips}
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
