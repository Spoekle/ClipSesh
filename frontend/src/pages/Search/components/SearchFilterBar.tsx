import { AnimatePresence, motion } from 'framer-motion';
import { FaSearch, FaTimes, FaFilter, FaSortAmountDown } from 'react-icons/fa';

type SortOption = 'newest' | 'oldest' | 'upvotes' | 'downvotes' | 'ratio';
type SearchType = 'all' | 'clips' | 'profiles';

interface SearchFilterBarProps {
    // Search
    searchInput: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClearSearch: () => void;

    // Search type
    searchType: SearchType;
    onSearchTypeChange: (type: SearchType) => void;

    // Filters
    filterOpen: boolean;
    onFilterToggle: () => void;
    streamerFilter: string;
    submitterFilter: string;
    seasonFilter: string;
    yearFilter: string;
    onStreamerChange: (value: string) => void;
    onSubmitterChange: (value: string) => void;
    onSeasonChange: (value: string) => void;
    onYearChange: (value: string) => void;
    onResetFilters: () => void;
    onApplyFilters: () => void;

    // Sort
    sortOption: SortOption;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;

    // Data
    streamers: string[];
    submitters: string[];

    // Results
    searchTerm: string;
    totalResults: number;
    loading: boolean;
}

const SearchFilterBar = ({
    searchInput,
    onSearchChange,
    onClearSearch,
    searchType,
    onSearchTypeChange,
    filterOpen,
    onFilterToggle,
    streamerFilter,
    submitterFilter,
    seasonFilter,
    yearFilter,
    onStreamerChange,
    onSubmitterChange,
    onSeasonChange,
    onYearChange,
    onResetFilters,
    onApplyFilters,
    sortOption,
    onSortChange,
    streamers,
    submitters,
    searchTerm,
    totalResults,
    loading
}: SearchFilterBarProps) => {
    const activeFiltersCount =
        (streamerFilter ? 1 : 0) +
        (submitterFilter ? 1 : 0) +
        (seasonFilter ? 1 : 0) +
        (yearFilter ? 1 : 0);

    return (
        <>
            {/* Main Filter Bar */}
            <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm z-20 shadow-lg border border-neutral-200/50 dark:border-neutral-700/50 rounded-xl">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        {/* Search Input */}
                        <div className="flex-1 max-w-2xl w-full">
                            <div className="relative">
                                <FaSearch className="absolute top-1/2 left-4 transform -translate-y-1/2 text-neutral-400" size={18} />
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={onSearchChange}
                                    placeholder="Search for clips, streamers, titles, or profiles..."
                                    className="w-full py-3 pl-12 pr-12 bg-neutral-100 dark:bg-neutral-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-600 focus:border-blue-500 transition-all duration-200"
                                />
                                {searchInput && (
                                    <button
                                        onClick={onClearSearch}
                                        className="absolute top-1/2 right-4 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1"
                                    >
                                        <FaTimes />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Search Type Toggle */}
                            <div className="flex bg-neutral-100 dark:bg-neutral-700/50 rounded-lg p-1 border border-neutral-200 dark:border-neutral-600">
                                {(['all', 'clips', 'profiles'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => onSearchTypeChange(type)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${searchType === type
                                                ? 'bg-blue-500 text-white shadow-sm'
                                                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-600'
                                            }`}
                                    >
                                        {type === 'all' ? 'All' : type === 'clips' ? 'Clips' : 'Profiles'}
                                    </button>
                                ))}
                            </div>

                            {/* Filter Toggle */}
                            {searchType !== 'profiles' && (
                                <button
                                    onClick={onFilterToggle}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${filterOpen || activeFiltersCount > 0
                                            ? 'bg-blue-500 text-white shadow-md'
                                            : 'bg-neutral-100 dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 border border-neutral-200 dark:border-neutral-600'
                                        }`}
                                >
                                    <FaFilter />
                                    <span>Filters</span>
                                    {activeFiltersCount > 0 && (
                                        <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                                            {activeFiltersCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            {/* Sort Dropdown */}
                            {searchType !== 'profiles' && (
                                <div className="relative">
                                    <select
                                        value={sortOption}
                                        onChange={onSortChange}
                                        className="appearance-none bg-neutral-100 dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 rounded-lg px-4 py-2.5 pr-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 border border-neutral-200 dark:border-neutral-600 transition-all duration-200"
                                    >
                                        <option value="newest">Newest</option>
                                        <option value="oldest">Oldest</option>
                                        <option value="upvotes">Most Upvotes</option>
                                        <option value="downvotes">Most Downvotes</option>
                                        <option value="ratio">Best Ratio</option>
                                    </select>
                                    <FaSortAmountDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-neutral-400" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Summary */}
                    {searchTerm && !loading && (
                        <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
                            Found <strong className="text-neutral-900 dark:text-white">{totalResults}</strong> result{totalResults !== 1 ? 's' : ''} for "<span className="font-medium text-blue-600 dark:text-blue-400">{searchTerm}</span>"
                            {activeFiltersCount > 0 && <span className="text-neutral-500"> with {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Expanded Filter Panel */}
            <AnimatePresence>
                {filterOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm border-b border-neutral-200/50 dark:border-neutral-700/50">
                            <div className="container mx-auto px-4 py-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                        Advanced Filters
                                    </h3>
                                    <button
                                        onClick={onFilterToggle}
                                        className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
                                    >
                                        <FaTimes size={16} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Streamer Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                            Streamer
                                        </label>
                                        <select
                                            value={streamerFilter}
                                            onChange={(e) => onStreamerChange(e.target.value)}
                                            className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                        >
                                            <option value="">All Streamers</option>
                                            {streamers.map((streamer) => (
                                                <option key={streamer} value={streamer}>{streamer}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Submitter Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                            Submitter
                                        </label>
                                        <select
                                            value={submitterFilter}
                                            onChange={(e) => onSubmitterChange(e.target.value)}
                                            className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                        >
                                            <option value="">All Submitters</option>
                                            {submitters.map((submitter) => (
                                                <option key={submitter} value={submitter}>{submitter}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Season Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                            Season
                                        </label>
                                        <select
                                            value={seasonFilter}
                                            onChange={(e) => onSeasonChange(e.target.value)}
                                            className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                        >
                                            <option value="">All Seasons</option>
                                            <option value="spring">🌸 Spring</option>
                                            <option value="summer">☀️ Summer</option>
                                            <option value="fall">🍂 Fall</option>
                                            <option value="winter">❄️ Winter</option>
                                        </select>
                                    </div>

                                    {/* Year Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                            Year
                                        </label>
                                        <select
                                            value={yearFilter}
                                            onChange={(e) => onYearChange(e.target.value)}
                                            className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                        >
                                            <option value="">All Years</option>
                                            <option value="2025">2025</option>
                                            <option value="2024">2024</option>
                                            <option value="2023">2023</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-6 gap-3">
                                    <button
                                        onClick={onResetFilters}
                                        className="px-5 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all duration-200 font-medium"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        onClick={onApplyFilters}
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SearchFilterBar;
