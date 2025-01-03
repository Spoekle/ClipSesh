import React, { useEffect, useState } from 'react';
import apiUrl from '../config/config';
import { useLocation, Link } from 'react-router-dom';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import axios from 'axios';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const ClipSearch = () => {
    const query = useQuery();
    const searchTerm = query.get('query') || '';
    const page = parseInt(query.get('page')) || 1;
    const streamerFilterParam = query.get('streamer') || '';
    const submitterFilterParam = query.get('submitter') || '';
    const sortOptionParam = query.get('sort') || 'newest';
    const [clips, setClips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const [streamerFilter, setStreamerFilter] = useState(streamerFilterParam);
    const [submitterFilter, setSubmitterFilter] = useState(submitterFilterParam);
    const [sortOption, setSortOption] = useState(sortOptionParam);

    const location = useLocation();

    useEffect(() => {
        const fetchClips = async () => {
            try {
                setLoading(true);
                setError('');
                const params = {
                    q: searchTerm,
                    page,
                    streamer: streamerFilter,
                    submitter: submitterFilter,
                    sort: sortOption
                };

                const response = await axios.get(`${apiUrl}/api/clips/search`, { params });
                setClips(response.data.clips);
                setTotalPages(response.data.totalPages);
            } catch (err) {
                console.error('Error fetching search results:', err);
                setError(err.response?.data?.message || 'An error occurred while fetching clips.');
            } finally {
                setLoading(false);
            }
        };

        if (searchTerm.trim() !== '') {
            fetchClips();
        } else {
            setClips([]);
            setLoading(false);
        }
    }, [searchTerm, page, streamerFilter, submitterFilter, sortOption]);

    useEffect(() => {
        const params = new URLSearchParams({
            query: searchTerm,
            page: 1,
            streamer: streamerFilter,
            submitter: submitterFilter,
            sort: sortOption
        });
        window.history.pushState({}, '', `/search?${params.toString()}`);
        window.dispatchEvent(new Event('popstate'));
    }, [streamerFilter, submitterFilter, sortOption]);

    const handlePageChange = (newPage) => {
        const params = new URLSearchParams({
            query: searchTerm,
            page: newPage,
            streamer: streamerFilter,
            submitter: submitterFilter,
            sort: sortOption
        });
        window.history.pushState({}, '', `/search?${params.toString()}`);
        window.dispatchEvent(new Event('popstate'));
    };

    return (
        <div className="min-h-screen w-full overflow-hidden text-neutral-950 dark:text-white bg-neutral-200 dark:bg-neutral-900 transition duration-200 p-4">
            <h1 className="container mx-auto text-2xl font-bold mb-4">Search Results for "{searchTerm}"</h1>
            {loading ? (
                <p className="container mx-auto text-2xl font-bold mb-4">Loading...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : clips.length > 0 ? (
                <div className="container mx-auto justify-center justify-items-center">
                    <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 w-full">
                        <div className="flex-col bg-white dark:bg-neutral-800 rounded-md p-4 shadow-md animate-fade-right animate-delay-300">
                            <h2 className="text-xl font-semibold mb-2">Filters</h2>
                            <div className="flex-col flex-wrap">
                                <div className="mb-2">
                                    <label className="block text-sm">Streamer</label>
                                    <select
                                        value={streamerFilter}
                                        onChange={e => setStreamerFilter(e.target.value)}
                                        className="mt-1 block py-2 px-4 min-w-full bg-neutral-200 dark:bg-neutral-700 rounded-md border-neutral-300 dark:border-neutral-600"
                                    >
                                        <option value="">All Streamers</option>
                                        {Array.from(new Set(clips.map(clip => clip.streamer))).map(streamer => (
                                            <option key={streamer} value={streamer}>
                                                {streamer}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-2">
                                    <label className="block text-sm">Submitter</label>
                                    <select
                                        value={submitterFilter}
                                        onChange={e => setSubmitterFilter(e.target.value)}
                                        className="mt-1 block py-2 px-4 min-w-full bg-neutral-200 dark:bg-neutral-700 rounded-md border-neutral-300 dark:border-neutral-600"
                                    >
                                        <option value="">All Submitters</option>
                                        {Array.from(new Set(clips.map(clip => clip.submitter))).map(submitter => (
                                            <option key={submitter} value={submitter}>
                                                {submitter}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className='my-2 border-t border-neutral-300 dark:border-neutral-600'></div>
                                <div className="mb-2">
                                    <label className="block text-sm">Sort By</label>
                                    <select
                                        value={sortOption}
                                        onChange={e => setSortOption(e.target.value)}
                                        className="mt-1 block py-2 px-4 min-w-full bg-neutral-200 dark:bg-neutral-700 rounded-md border-neutral-300 dark:border-neutral-600"
                                    >
                                        <option value="newest">Newest</option>
                                        <option value="oldest">Oldest</option>
                                        <option value="upvotes">Upvotes</option>
                                        <option value="downvotes">Downvotes</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <ul className="space-y-4 w-full">
                            {clips
                                .filter(clip => {
                                    if (streamerFilter && clip.streamer !== streamerFilter) {
                                        return false;
                                    }
                                    if (submitterFilter && clip.submitter !== submitterFilter) {
                                        return false;
                                    }
                                    return true;
                                })
                                .sort((a, b) => {
                                    if (sortOption === 'upvotes') {
                                        return b.upvotes - a.upvotes;
                                    } else if (sortOption === 'downvotes') {
                                        return b.downvotes - a.downvotes;
                                    } else if (sortOption === 'newest') {
                                        return new Date(b.createdAt) - new Date(a.createdAt);
                                    } else if (sortOption === 'oldest') {
                                        return new Date(a.createdAt) - new Date(b.createdAt);
                                    } else {
                                        return 0;
                                    }
                                })
                                .map((clip, index) => (
                                    <Link
                                        key={clip._id}
                                        to={`/clips/${clip._id}`}
                                        state={{ from: location }}
                                        className={`flex min-w-full items-center bg-white hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-md p-4 shadow-md animate-fade-left overflow-hidden`}
                                        style={{ animationDelay: `${index * 70}ms` }}
                                    >
                                        <video
                                            src={clip.url}
                                            className="h-24 aspect-video object-cover rounded-md mr-4"
                                        />
                                        <div className="flex-1">
                                            <h1 className="text-xl font-semibold">{clip.title}</h1>
                                            <p className="text-sm mt-1">Streamer: {clip.streamer}</p>
                                            {clip.submitter !== 'Legacy(no data)' && (
                                                <p className="text-sm mt-1">Submitted by: {clip.submitter}</p>
                                            )}
                                            <div className="flex mt-2 space-x-2 text-sm">
                                                <p className='flex items-center text-green-500'><FaArrowUp className='mr-1' /> {clip.upvotes}</p>
                                                <p className='flex items-center text-red-500'><FaArrowDown className='mr-1' /> {clip.downvotes}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            }
                        </ul>
                    </div>
                    <div className="flex justify-center mt-6 space-x-4">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page <= 1}
                            className={`px-4 py-2 rounded-md ${page <= 1 ? 'bg-neutral-400 cursor-not-allowed' : 'bg-neutral-500 hover:bg-neutral-600'}`}
                        >
                            Previous
                        </button>
                        <span>Page {page} of {totalPages}</span>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= totalPages}
                            className={`px-4 py-2 rounded-md ${page >= totalPages ? 'bg-neutral-400 cursor-not-allowed' : 'bg-neutral-500 hover:bg-neutral-600'}`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            ) : (
                <p>No clips found for "{searchTerm}".</p>
            )}
        </div>
    );
};

export default ClipSearch;
