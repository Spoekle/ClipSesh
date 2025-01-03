import React, { useState, useEffect } from 'react';
import apiUrl from '../../../config/config';
import placeholder from '../../../media/placeholder.png';
import { useParams, useSearchParams, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import Pagination from '@mui/material/Pagination';

const RatedClips = ({ ratingsData, clipsData }) => {
    const { clipId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const sortOption = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page')) || 1;
    const location = useLocation();
    const token = localStorage.getItem('token');

    const [ratedClips, setRatedClips] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState();
    const [currentClip, setCurrentClip] = useState(null);
    const [expandedClip, setExpandedClip] = useState(clipId || null);
    const [sortOptionState, setSortOptionState] = useState(sortOption);
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [currentPage, setCurrentPage] = useState(page);
    const [itemsPerPage] = useState(6);
    const [isClipLoading, setIsClipLoading] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, [location.search]);

    useEffect(() => {
        if (expandedClip && expandedClip !== 'new') {
            setIsClipLoading(true);
            axios
                .get(`${apiUrl}/api/clips/${expandedClip}`)
                .then((response) => {
                    setCurrentClip(response.data);
                    setIsClipLoading(false);
                })
                .catch((error) => {
                    console.error('Error fetching post:', error);
                    setIsClipLoading(false);
                });
        }
    }, [expandedClip]);

    const fetchInitialData = async () => {
        try {
            const userData = await fetchUser();
            setProgress(50);
            await filterRatedClips(userData);
            setProgress(100);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    const fetchUser = async () => {
        if (token) {
            try {
                const response = await axios.get(`${apiUrl}/api/users/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setIsLoggedIn(true);
                setUser(response.data);
                return response.data;
            } catch (error) {
                console.error('Error fetching user:', error);
                return null;
            }
        } else {
            setIsLoggedIn(false);
            setUser(null);
            return null;
        }
    };

    const filterRatedClips = async (userData) => {
        try {
            setIsLoading(true);
            if (userData && (userData.role === 'clipteam' || userData.role === 'admin')) {

                const rated = [];
                clipsData.forEach((clip) => {
                    const ratingData = ratingsData[clip._id];
                    if (
                        ratingData &&
                        ratingData.ratingCounts.some((rateData) =>
                            rateData.users.some((ratingUser) => ratingUser.userId === userData._id)
                        )
                    ) {
                        rated.push(clip);
                    }
                });
                console.log('Rated Clips:', rated.length);
                const sortedRated = sortClips(rated, sortOption);

                // Set State
                setRatedClips(sortedRated);
            }
        } catch (error) {
            console.error('Error fetching clips and ratings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sortClips = (clipsToSort, option) => {
        let sortedClips = [...clipsToSort];
        switch (option) {
            case 'newest':
                sortedClips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                sortedClips.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'highestUpvotes':
                sortedClips.sort((a, b) => b.upvotes - a.upvotes);
                break;
            case 'highestDownvotes':
                sortedClips.sort((a, b) => b.downvotes - a.downvotes);
                break;
            case 'highestRatio':
                sortedClips.sort((a, b) => {
                    const ratioA = a.upvotes / (a.downvotes || 1);
                    const ratioB = b.upvotes / (b.downvotes || 1);
                    return ratioB - ratioA;
                });
                break;
            case 'lowestRatio':
                sortedClips.sort((a, b) => {
                    const ratioA = a.upvotes / (a.downvotes || 1);
                    const ratioB = b.upvotes / (b.downvotes || 1);
                    return ratioA - ratioB;
                });
                break;
            default:
                break;
        }
        return sortedClips;
    };

    // Pagination and sorting
    const indexOfLastClip = currentPage * itemsPerPage;
    const indexOfFirstClip = indexOfLastClip - itemsPerPage;

    const currentClips = ratedClips.slice(indexOfFirstClip, indexOfLastClip);

    const totalPages = Math.ceil(ratedClips.length / itemsPerPage);

    const paginate = (event, pageNumber) => {
        setCurrentPage(pageNumber);
        setSearchParams({ sort: sortOption, page: pageNumber });
    };

    return (
        isLoggedIn && (
            <div
                className="grid justify-items-center text-white bg-neutral-200 dark:bg-neutral-900 transition duration-200 rounded-xl justify-center items-center animate-fade"
            >
                <div className="text-center py-4 justify-center items-center z-30">
                    <div className="flex justify-center">
                        <select
                            value={sortOptionState}
                            onChange={(e) => {
                                const newSortOption = e.target.value;
                                setSortOptionState(newSortOption);
                                const sorted = sortClips(ratedClips, newSortOption);
                                setRatedClips(sorted);
                                setSearchParams({ sort: newSortOption, page: currentPage });
                            }}
                            className="bg-white text-neutral-900 dark:bg-neutral-800 dark:text-white transition duration-200 py-2 px-4 rounded-md border-2 border-neutral-800 dark:border-white"
                        >
                            <option value="newest">Newest Clips</option>
                            <option value="oldest">Oldest Clips</option>
                            <option value="highestUpvotes">Highest Upvotes</option>
                            <option value="highestDownvotes">Highest Downvotes</option>
                            <option value="highestRatio">Highest Upvote/Downvote Ratio</option>
                            <option value="lowestRatio">Lowest Upvote/Downvote Ratio</option>
                        </select>
                    </div>
                </div>
                <div className="container w-full min-w-full justify-center items-center rounded-xl animate-fade animate-delay-500">
                    <div className="h-full w-full min-w-full bg-white dark:bg-black/30 dark:text-white transition duration-200 backdrop-blur-lg rounded-2xl">
                        <div className="p-4 w-full min-w-full justify-center gap-4 grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {isLoading ? (
                                Array.from({ length: itemsPerPage }).map((_, index) => (
                                    <div key={index} className="shadow-2xl relative animate-pulse drop-shadow-md">
                                        <div className="overflow-hidden w-full text-center relative shadow-2xl">
                                            <div className="rounded-lg bg-white dark:bg-neutral-800 transition duration-200 p-2">
                                                <img src={placeholder} alt="Loading..." className="w-full rounded-lg border-white opacity-50" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : currentClips.length > 0 ? (
                                currentClips
                                    .map((clip) => (
                                        <Link key={clip._id}
                                            className="relative animate-fade hover:scale-105 transition duration-200"
                                            to={`/clips/${clip._id}`}
                                            state={{ from: location }}
                                            onClick={() => setExpandedClip(clip._id)}
                                        >
                                            <div className="overflow-hidden w-full text-center relative shadow-2xl">
                                                <div className="absolute flex justify-center top-0 left-0 z-30 text-lg font-bold bg-white text-neutral-900 dark:bg-neutral-800 dark:text-white transition duration-200 p-2 rounded-md text-center">
                                                    <a href={clip.link} className="cursor-pointer">
                                                        {clip.streamer}
                                                    </a>
                                                </div>
                                                <div className="rounded-lg bg-white dark:bg-neutral-800 transition duration-200 p-2">
                                                    <video
                                                        className="w-full rounded-lg border-white dark:border-neutral-800 transition duration-200 opacity-50 hover:opacity-100"
                                                        src={`${clip.url}`}
                                                        onMouseEnter={(e) => e.target.play()}
                                                        onMouseLeave={(e) => e.target.pause()}
                                                    >
                                                    </video>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                            ) : (
                                <div className="my-2 mx-4 text-center bg-black/30 p-4 rounded-md font-semibold text-xl text-white col-span-full">
                                    No clips available.
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center">
                            <div className="items-center bg-white justify-center rounded-md mb-4 py-2 px-4">
                                <Pagination
                                    showFirstButton
                                    showLastButton
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={paginate}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    );
};

export default RatedClips;
