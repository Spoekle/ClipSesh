import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import apiUrl from '../../../config/config';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    FaThumbsUp,
    FaThumbsDown,
    FaShare,
    FaRegCalendarAlt,
    FaUser,
    FaLink,
    FaChevronLeft,
    FaChevronRight,
    FaEdit
} from 'react-icons/fa';
import { AiOutlineDelete, AiOutlineEdit } from 'react-icons/ai';
import MessageComponent from './components/clipteam/MessagesPopup';
import RatingsComponent from './components/clipteam/RatingsPopup';
import EditModal from './components/EditClipModal';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import CustomPlayer from './components/CustomPlayer';
import { useNotification } from '../../../context/NotificationContext';
import { Clip, User, Rating, RatingUser } from '../../../types/adminTypes';
import RatingPanel from './components/clipteam/RatingPanel';
import CommentSection from './components/CommentSection';

interface ClipContentProps {
    clip: Clip;
    setExpandedClip: React.Dispatch<React.SetStateAction<string | null>>;
    user: User | null;
    token: string;
    fetchClipsAndRatings: (user: User | null) => Promise<void>;
    ratings: Record<string, Rating>;
    searchParams: URLSearchParams;
}

// Updated interface to handle different formats of the 'from' state
interface LocationState {
    from: {
        pathname: string;
        search?: string;
    } | string;
    highlightComment?: string;
    highlightReply?: string;
    openTeamChat?: boolean;
    messageId?: string;
}

const ClipContent: React.FC<ClipContentProps> = ({
    clip,
    setExpandedClip,
    user,
    token,
    fetchClipsAndRatings,
    ratings,
    searchParams
}) => {
    const [currentClip, setCurrentClip] = useState<Clip>(clip);
    const [popout, setPopout] = useState<string>('');
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [shareUrl, setShareUrl] = useState<string>('');
    const [nextClip, setNextClip] = useState<Clip | null>(null);
    const [prevClip, setPrevClip] = useState<Clip | null>(null);
    const [loadingAdjacentClips, setLoadingAdjacentClips] = useState<boolean>(false);
    const [isClipLoading, setIsClipLoading] = useState<boolean>(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

    // Use our custom notification hook instead of toast
    const { showSuccess, showError } = useNotification();

    const navigate = useNavigate();
    const location = useLocation();

    // Ensure we have a clean, safe 'from' state object that won't break navigation
    const from = useMemo(() => {
        // Get the from state if it exists
        const locationState = location.state as LocationState;

        // Default return value if no from state
        const defaultPath = { pathname: '/clips', search: '' };

        if (!locationState || !locationState.from) {
            return defaultPath;
        }

        // Check if locationFrom is a string (handles older format or corrupted state)
        if (typeof locationState.from === 'string') {
            try {
                // Extract pathname and search from the string
                const fromString = String(locationState.from);
                const parts = fromString.split('?');
                const pathPart = parts[0] || '/clips';
                const searchPart = parts.length > 1 ? `?${parts[1]}` : '';

                // Clean pathname to ensure no function code is included
                // Extract just the first segment of the path
                const pathSegments = pathPart.split('/').filter(Boolean);
                const cleanPathname = pathSegments.length > 0
                    ? `/${pathSegments[0]}`
                    : '/clips';

                return { pathname: cleanPathname, search: searchPart };
            } catch (err) {
                console.error('Error parsing from state (string):', err);
                return defaultPath;
            }
        }

        // Handle object case
        try {
            if (locationState.from.pathname) {
                // Clean up the pathname to ensure it doesn't contain any function code
                const pathSegments = String(locationState.from.pathname).split('/').filter(Boolean);
                const cleanPathname = pathSegments.length > 0
                    ? `/${pathSegments[0]}`
                    : '/clips';

                return {
                    pathname: cleanPathname,
                    search: locationState.from.search || ''
                };
            }
        } catch (err) {
            console.error('Error parsing from state (object):', err);
        }

        return defaultPath;
    }, [location.state]);

    const openTeamChat = location.state?.openTeamChat;

    // Set highlighted message from location state
    useEffect(() => {
        const messageId = location.state?.messageId;
        if (messageId) {
            setHighlightedMessageId(messageId);
        }
    }, [location.state?.messageId]);

    // Set popout to 'chat' if navigating from team message notification
    useEffect(() => {
        if (openTeamChat && user && (user.roles.includes('admin') || user.roles.includes('clipteam'))) {
            setPopout('chat');
        }
    }, [openTeamChat, user]);

    // Set share URL and fetch adjacent clips when current clip changes
    useEffect(() => {
        if (currentClip && currentClip._id) {
            console.log(`Setting share URL and fetching adjacent clips for: ${currentClip._id}`);
            setShareUrl(`${window.location.origin}/clips/${currentClip._id}`);
            fetchAdjacentClips(currentClip._id);

            // Log the current from state to help with debugging
            console.log('Current from state:', from);
        }
    }, [currentClip?._id, from]);

    // Update currentClip when clip prop changes
    useEffect(() => {
        if (clip && (!currentClip || clip._id !== currentClip._id)) {
            console.log(`Updating current clip from prop: ${clip._id}`);
            setCurrentClip(clip);
        }
    }, [clip?._id]);

    // Update the fetchAdjacentClips function to call the correct API endpoint
    const fetchAdjacentClips = async (specificClipId?: string) => {
        if (!specificClipId && !currentClip?._id && !clip?._id) {
            console.warn('No clip ID available to fetch adjacent clips');
            return;
        }

        setLoadingAdjacentClips(true);
        try {
            // Build the search parameters based on the current search params
            const queryParams = new URLSearchParams();

            // Copy over sort parameter if it exists
            const currentSort = searchParams.get('sort');
            if (currentSort) {
                queryParams.append('sort', currentSort);
            }

            // Use the specificClipId if provided, otherwise use current clip id or fallback to prop clip id
            const clipIdToUse = specificClipId || currentClip?._id || clip._id;
            console.log(`Fetching adjacent clips for: ${clipIdToUse}`);

            queryParams.append('currentClipId', clipIdToUse);
            queryParams.append('getAdjacent', 'true');

            // Add streamer filter if present in URL
            const streamerFilter = searchParams.get('streamer');
            if (streamerFilter) {
                queryParams.append('streamer', streamerFilter);
            }

            // Make a single API call to get both previous and next clips
            const response = await axios.get(`${apiUrl}/api/clips/clip-navigation/adjacent`, {
                params: queryParams,
                headers: token ? { Authorization: `Bearer ${token}` } : undefined
            });

            console.log("Adjacent clips response:", response.data);

            // Set the prev and next clips from response
            if (response.data) {
                setPrevClip(response.data.prevClip || null);
                setNextClip(response.data.nextClip || null);
            }
        } catch (error) {
            console.error('Error fetching adjacent clips:', error);
            // Don't clear existing nav clips on error
        } finally {
            setLoadingAdjacentClips(false);
        }
    };

    // Navigate to adjacent clip with improved reliability
    const navigateToClip = (clipId: string) => {
        // Prevent navigation if already loading
        if (isClipLoading) return;

        // Show loading state
        setIsClipLoading(true);

        // Reset adjacent clips to prevent confusion when navigating
        setPrevClip(null);
        setNextClip(null);

        // Create a clean from state to avoid URL corruption
        // Only use the first path segment to prevent function code leaking into URLs
        const fromPathname = from.pathname.split('/').filter(Boolean);
        const basePath = fromPathname.length > 0 ? fromPathname[0] : 'clips';

        // Create a sanitized state object
        const cleanFromState = {
            pathname: `/${basePath}`,
            search: from.search || ''
        };

        // Update URL first so the navigation happens immediately
        navigate(`/clips/${clipId}`, {
            state: { from: cleanFromState },
            replace: true // Replace current history entry to avoid back button issues
        });

        // Fetch the new clip data
        const fetchNewClip = async () => {
            try {
                // Fetch the new clip directly
                const response = await axios.get(`${apiUrl}/api/clips/${clipId}`);

                if (response.data) {
                    // Update current clip with the new data
                    setCurrentClip(response.data);

                    // After setting the current clip, update expandedClip in parent component
                    setExpandedClip(clipId);

                    // Fetch adjacent clips for the new clip
                    await fetchAdjacentClips(clipId);
                }
            } catch (error) {
                console.error('Error fetching new clip:', error);
                showError('Error loading clip. Please try again.');
            } finally {
                setIsClipLoading(false);
            }
        };

        // Execute the fetch operation
        fetchNewClip();
    };

    if (!currentClip) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-100 dark:bg-neutral-900">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            </div>
        );
    }

    const closeExpandedClip = (): void => {
        setExpandedClip(null);

        // Sanitize the base URL path to prevent URL corruption
        // Extract only the first segment of the path to avoid any function code
        const pathSegments = from.pathname.split('/').filter(Boolean);
        const basePath = pathSegments.length > 0 ? pathSegments[0] : 'clips';

        // Navigate back with a clean path
        navigate({
            pathname: `/${basePath}`,
            search: from.search || ''
        });
    };

    const toggleEditModal = (): void => {
        setIsEditModalOpen(!isEditModalOpen);
    };

    // Add a state to track the user's current vote
    const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);

    // Check user's current vote status when clip changes
    useEffect(() => {
        const checkVoteStatus = async () => {
            if (!currentClip?._id) return;

            try {
                const response = await axios.get(`${apiUrl}/api/clips/${currentClip._id}/vote/status`);
                if (response.data.hasVoted) {
                    setUserVote(response.data.voteType);
                } else {
                    setUserVote(null);
                }
            } catch (error) {
                console.error('Error fetching vote status:', error);
            }
        };

        checkVoteStatus();
    }, [currentClip?._id]);

    const handleVote = async (voteType: 'upvote' | 'downvote'): Promise<void> => {
        try {
            const response = await axios.post<Clip>(
                `${apiUrl}/api/clips/${currentClip._id}/vote/${voteType}`
            );
            setCurrentClip(prev => ({
                ...prev,
                upvotes: response.data.upvotes,
                downvotes: response.data.downvotes,
            }));

            if (userVote === voteType) {
                setUserVote(null);
            } else {
                // New vote or changed vote
                setUserVote(voteType);
            }
        } catch (error: any) {
            showError(`Error ${voteType}ing clip: ${error.response?.data?.message || 'Unknown error'}`);
        }
    };

    const handleUpvote = (): Promise<void> => handleVote('upvote');
    const handleDownvote = (): Promise<void> => handleVote('downvote');



    const handleDeleteClip = async (): Promise<void> => {
        const token = localStorage.getItem('token');
        try {
            setIsLoading(true);
            await axios.delete(`${apiUrl}/api/clips/${currentClip._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showSuccess('Clip deleted successfully!');
            closeExpandedClip();
        } catch (error: any) {
            showError('Error deleting clip: ' + (error.response?.data?.message || 'Unknown error'));
            setIsLoading(false);
        }
    };

    const handleDeleteClick = (): void => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = (): void => {
        setShowDeleteConfirm(false);
        handleDeleteClip();
    };

    const handleCancelDelete = (): void => {
        setShowDeleteConfirm(false);
    };

    const handleCopyShareLink = (): void => {
        showSuccess('Share link copied to clipboard!');
    };

    // Updated code to get user's current rating from the ratings object structure
    const getUserCurrentRating = () => {
        if (!ratings || !ratings[clip._id] || !user) return null;

        // Handle case where ratings structure might have changed or is different from expected
        const ratingData = ratings[clip._id];
        if (!ratingData.ratings) return null;

        // Get the rating categories
        const ratingCategories = ratingData.ratings;

        // Check each rating category (1-4) to see if the user is in it
        for (const rating of ['1', '2', '3', '4'] as const) {
            const usersInRating = ratingCategories[rating] || [];
            if (usersInRating.some((u: RatingUser) => u.userId === user._id)) {
                return rating;
            }
        }

        return null;
    };

    const userCurrentRating = getUserCurrentRating();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col min-h-screen bg-gray-50 dark:bg-neutral-900"
        >
            {/* Loading overlay */}
            {isClipLoading && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                        <p className="text-neutral-900 dark:text-white font-medium">Loading clip...</p>
                    </div>
                </div>
            )}

            {clip && (
                <Helmet>
                    <title>{currentClip && `${currentClip.streamer} | ${currentClip.title}`}</title>
                    <meta
                        name="description"
                        content={`${currentClip.title} by ${currentClip.streamer} on ${new Date(currentClip.createdAt).toLocaleString()}. Watch the clip and rate it on ClipSesh! ${currentClip.upvotes} upvotes and ${currentClip.downvotes}. ${currentClip.comments.length} comments. ${currentClip.link}`}
                    />
                </Helmet>
            )}

            {/* Header */}
            <div className="sticky top-14 z-10 flex justify-between items-center bg-white dark:bg-neutral-800 p-4 shadow-md rounded-b-xl">
                <Link
                    className="bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium"
                    to={{
                        pathname: from.pathname,
                        search: from.search || ''
                    }}
                    onClick={(e) => {
                        e.preventDefault(); // Prevent default Link behavior
                        closeExpandedClip(); // Use our sanitized function instead
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back
                </Link>

                <div className="flex items-center space-x-2">
                    <button
                        className="flex items-center gap-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white px-4 py-2 rounded-lg transition"
                        onClick={() => {
                            navigator.clipboard.writeText(shareUrl)
                                .then(() => handleCopyShareLink())
                                .catch(err => console.error('Failed to copy text: ', err));
                        }}
                    >
                        <FaShare className="text-sm" />
                        <span className="hidden sm:inline">Share</span>
                    </button>

                    {user && user.roles.includes('admin') && (
                        <>
                            <button
                                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
                                onClick={toggleEditModal}
                                disabled={isLoading}
                            >
                                <AiOutlineEdit />
                                <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
                                onClick={handleDeleteClick}
                                disabled={isLoading}
                            >
                                <AiOutlineDelete />
                                <span className="hidden sm:inline">Delete</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
                {/* Main content area with side navigation buttons */}
                <div className="flex-grow lg:w-2/3 relative">
                    {/* Video player container */}
                    <div className="flex items-center">
                        {/* Previous clip button - positioned outside the video */}
                        {nextClip && (
                            <button
                                onClick={() => navigateToClip(nextClip._id)}
                                disabled={loadingAdjacentClips || isClipLoading}
                                className={`hidden sm:flex fixed left-4 top-1/2 transform -translate-y-1/2 z-20 ${loadingAdjacentClips || isClipLoading
                                    ? 'bg-neutral-200/90 dark:bg-neutral-600/90 cursor-not-allowed'
                                    : 'bg-white/90 dark:bg-neutral-800/90 hover:bg-white dark:hover:bg-neutral-700 hover:scale-110'
                                    } text-neutral-800 dark:text-white h-16 w-16 items-center justify-center rounded-full shadow-lg transition`}
                                aria-label="Previous clip"
                            >
                                {isClipLoading ? (
                                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                ) : (
                                    <FaChevronLeft size={24} />
                                )}
                            </button>
                        )}

                        {/* For mobile - bottom navigation bar */}
                        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-20 flex justify-between items-center px-4 py-3 bg-neutral-100/90 dark:bg-neutral-800/90 backdrop-blur-sm">
                            <button
                                onClick={() => nextClip && navigateToClip(nextClip._id)}
                                disabled={!nextClip || loadingAdjacentClips || isClipLoading}
                                className={`flex items-center justify-center rounded-full w-12 h-12 shadow-md ${!nextClip || loadingAdjacentClips || isClipLoading ?
                                    'bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-500' :
                                    'bg-white dark:bg-neutral-700 text-neutral-800 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-600'}`}
                                aria-label="Previous clip"
                            >
                                {isClipLoading ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                ) : (
                                    <FaChevronLeft size={20} />
                                )}
                            </button>

                            <Link
                                to={{
                                    pathname: from.pathname,
                                    search: from.search || ''
                                }}
                                onClick={(e) => {
                                    e.preventDefault(); // Prevent default Link behavior
                                    closeExpandedClip(); // Use our sanitized function instead
                                }}
                                className="bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                </svg>
                                <span>Home</span>
                            </Link>

                            <button
                                onClick={() => prevClip && navigateToClip(prevClip._id)}
                                disabled={!prevClip || loadingAdjacentClips || isClipLoading}
                                className={`flex items-center justify-center rounded-full w-12 h-12 shadow-md ${!prevClip || loadingAdjacentClips || isClipLoading ?
                                    'bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-500' :
                                    'bg-white dark:bg-neutral-700 text-neutral-800 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-600'}`}
                                aria-label="Next clip"
                            >
                                {isClipLoading ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                ) : (
                                    <FaChevronRight size={20} />
                                )}
                            </button>
                        </div>

                        {/* Video and content */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden w-full"
                        >
                            <CustomPlayer currentClip={currentClip} />

                            <div className="p-6">
                                <h1 className="text-2xl text-neutral-900 dark:text-white font-bold mb-2">
                                    {currentClip.title}
                                </h1>

                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex space-x-2 items-center">
                                            <button
                                                className={`flex items-center px-4 py-2 rounded-full shadow transition transform hover:scale-105 ${userVote === 'upvote'
                                                    ? 'bg-green-500 hover:bg-green-600 text-white ring-2 ring-green-300 dark:ring-green-700'
                                                    : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-green-500 dark:hover:bg-green-500 text-neutral-700 dark:text-white hover:text-white'
                                                    }`}
                                                onClick={handleUpvote}
                                                disabled={isLoading}
                                                title={userVote === 'upvote' ? 'Remove your upvote' : 'Upvote this clip'}
                                            >
                                                <FaThumbsUp className={`mr-2 ${userVote === 'upvote' ? 'text-white animate-pulse' : ''}`} />
                                                {currentClip.upvotes}
                                                {userVote === 'upvote' && <span className="ml-1">✓</span>}
                                            </button>
                                            <button
                                                className={`flex items-center px-4 py-2 rounded-full shadow transition transform hover:scale-105 ${userVote === 'downvote'
                                                    ? 'bg-red-500 hover:bg-red-600 text-white ring-2 ring-red-300 dark:ring-red-700'
                                                    : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-red-500 dark:hover:bg-red-500 text-neutral-700 dark:text-white hover:text-white'
                                                    }`}
                                                onClick={handleDownvote}
                                                disabled={isLoading}
                                                title={userVote === 'downvote' ? 'Remove your downvote' : 'Downvote this clip'}
                                            >
                                                <FaThumbsDown className={`mr-2 ${userVote === 'downvote' ? 'text-white animate-pulse' : ''}`} />
                                                {currentClip.downvotes}
                                                {userVote === 'downvote' && <span className="ml-1">✓</span>}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <a
                                            href={currentClip.link}
                                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <FaLink className="text-sm" />
                                            <span>Original clip</span>
                                        </a>
                                    </div>
                                </div>

                                <div className="border-t border-b dark:border-neutral-700 py-4 my-4">
                                    <div className="flex flex-wrap gap-y-3">
                                        <div className="w-full sm:w-1/2">
                                            <div className="flex items-center gap-2">
                                                <FaUser className="text-neutral-500 dark:text-neutral-400" />
                                                <span className="text-lg text-neutral-900 dark:text-white font-semibold">
                                                    {currentClip.streamer}
                                                </span>
                                            </div>
                                        </div>

                                        {currentClip.submitter !== 'Legacy(no data)' && (
                                            <div className="w-full sm:w-1/2">
                                                <div className="flex items-center gap-2">
                                                    <FaUser className="text-neutral-500 dark:text-neutral-400" />
                                                    <span className="text-neutral-600 dark:text-neutral-300">
                                                        Submitted by: <span className="font-medium">{currentClip.submitter}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="w-full sm:w-1/2">
                                            <div className="flex items-center gap-2">
                                                <FaRegCalendarAlt className="text-neutral-500 dark:text-neutral-400" />
                                                <span
                                                    className="text-neutral-600 dark:text-neutral-300"
                                                    title={currentClip.createdAt}
                                                >
                                                    {new Date(currentClip.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            {currentClip.updatedAt && (currentClip.createdAt !== currentClip.updatedAt && (
                                                <div className="flex items-center gap-2">
                                                    <FaEdit className="text-neutral-500 dark:text-neutral-400" />
                                                    <span
                                                        className="text-neutral-600 dark:text-neutral-300"
                                                        title={currentClip.updatedAt}
                                                    >
                                                        {new Date(currentClip.updatedAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Team rating buttons */}
                                {user && (user.roles.includes('admin') || user.roles.includes('clipteam')) && (
                                    <RatingPanel
                                        clip={currentClip}
                                        currentClip={currentClip}
                                        user={user}
                                        token={token}
                                        isLoading={isLoading}
                                        userCurrentRating={userCurrentRating}
                                        ratings={ratings}
                                        fetchClipsAndRatings={fetchClipsAndRatings}
                                    />
                                )}
                                
                            </div>
                        </motion.div>


                        {/* Next clip button - positioned outside the video */}
                        {prevClip && (
                            <button
                                onClick={() => navigateToClip(prevClip._id)}
                                disabled={loadingAdjacentClips || isClipLoading}
                                className={`hidden sm:flex fixed right-4 top-1/2 transform -translate-y-1/2 z-20 ${loadingAdjacentClips || isClipLoading
                                    ? 'bg-neutral-200/90 dark:bg-neutral-600/90 cursor-not-allowed'
                                    : 'bg-white/90 dark:bg-neutral-800/90 hover:bg-white dark:hover:bg-neutral-700 hover:scale-110'
                                    } text-neutral-800 dark:text-white h-16 w-16 items-center justify-center rounded-full shadow-lg transition`}
                                aria-label="Next clip"
                            >
                                {isClipLoading ? (
                                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                ) : (
                                    <FaChevronRight size={24} />
                                )}
                            </button>
                        )}
                    </div>

                    {/* Comments section */}
                    <CommentSection
                        clipId={currentClip._id}
                        comments={currentClip.comments || []}
                        user={user}
                        token={token}
                        fetchClipsAndRatings={fetchClipsAndRatings}
                        highlightedMessageId={highlightedMessageId}
                        setHighlightedMessageId={setHighlightedMessageId}
                        setPopout={setPopout}
                        isClipLoading={isClipLoading}
                        setIsClipLoading={setIsClipLoading}
                    />
                    
                </div>
            </div>

            {/* Floating buttons for team members */}
            {user && (user.roles.includes('admin') || user.roles.includes('clipteam') || user.roles.includes('editor') || user.roles.includes('uploader')) && popout === '' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed flex space-x-3 bottom-20 md:bottom-6 right-6 z-20"
                >
                    <button
                        className="flex items-center gap-2 bg-indigo-600/90 hover:bg-indigo-700/90 backdrop-blur text-white px-4 py-3 rounded-full shadow-lg transition transform hover:scale-105"
                        onClick={() => setPopout('chat')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        Team Chat
                    </button>
                    <button
                        className="flex items-center gap-2 bg-amber-600/90 hover:bg-amber-700/90 backdrop-blur text-white px-4 py-3 rounded-full shadow-lg transition transform hover:scale-105"
                        onClick={() => setPopout('ratings')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        View Ratings
                    </button>
                </motion.div>
            )}

            {/* Popouts */}
            {popout === 'chat' ? (
                <MessageComponent
                    clipId={clip._id}
                    setPopout={setPopout}
                    user={user}
                    highlightedMessageId={highlightedMessageId}
                />
            ) : popout === 'ratings' ? (
                <RatingsComponent clip={clip} ratings={ratings} setPopout={setPopout} />
            ) : null}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <EditModal
                    isEditModalOpen={isEditModalOpen}
                    setIsEditModalOpen={toggleEditModal}
                    clip={currentClip}
                    setCurrentClip={setCurrentClip}
                    token={token}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={showDeleteConfirm}
                title="Delete Clip"
                message="Are you sure you want to delete this clip? This action cannot be undone."
                confirmText="Delete"
                confirmVariant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />

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

export default ClipContent;
