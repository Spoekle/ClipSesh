import React, { useState, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate, Link, useParams } from 'react-router-dom';
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
    FaEdit,
    FaFlag
} from 'react-icons/fa';
import { AiOutlineDelete, AiOutlineEdit } from 'react-icons/ai';
import MessageComponent from './components/clipteam/MessagesPopup';
import RatingsComponent from './components/clipteam/RatingsPopup';
import EditModal from './components/EditClipModal';
import ReportModal from './components/ReportModal';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import CustomPlayer from './components/CustomPlayer';
import { useNotification } from '../../../context/AlertContext';
import { Clip, User, Rating } from '../../../types/adminTypes';
import RatingPanel from './components/clipteam/RatingPanel';
import CommentSection from './components/CommentSection';
import TeamSidebar from './components/TeamSidebar';

// React Query hooks
import {
    useClip,
    useAdjacentClipsFromCache,
    useClipVoteStatus,
    useVoteOnClip,
    useDeleteClip
} from '../../../hooks/useClips';


interface ClipContentProps {
    clip: Clip;
    setExpandedClip: React.Dispatch<React.SetStateAction<string | null>>;
    user: User | null;
    fetchClipsAndRatings: (user: User | null) => Promise<void>;
    ratings: Record<string, Rating>;
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
    fetchClipsAndRatings,
    ratings
}) => {
    // Get clip ID from URL params to ensure we always have the current clip ID
    const { clipId } = useParams<{ clipId: string }>();
    const currentClipId = clipId || clip._id;

    console.log('🎬 ClipContent - URL clip ID:', clipId);
    console.log('🎬 ClipContent - Prop clip ID:', clip._id);
    console.log('🎬 ClipContent - Using clip ID:', currentClipId);

    // React Query hooks - get current clip data
    const { data: currentClip, isLoading: isClipLoading } = useClip(currentClipId);

    // Build params for adjacent clips based on current URL parameters
    const adjacentClipParams = useMemo(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const params: any = {
            sort: urlParams.get('sort') || 'newest',
        };

        // Add optional parameters only if they exist
        if (urlParams.get('streamer')) {
            params.streamer = urlParams.get('streamer');
        }
        if (urlParams.get('excludeRatedByUser')) {
            params.excludeRatedByUser = urlParams.get('excludeRatedByUser');
        }
        if (urlParams.get('q')) {
            params.search = urlParams.get('q');
        }

        // Add includeRatings for admin/clipteam users (matching main page logic)
        if (user && (user.roles?.includes('admin') || user.roles?.includes('clipteam'))) {
            params.includeRatings = true;
        }

        console.log('🎬 ClipView - Building adjacent clips params:', params);
        console.log('🎬 ClipView - Current clip ID:', currentClipId);
        console.log('🎬 ClipView - Full URL search:', window.location.search);
        console.log('🎬 ClipView - User roles:', user?.roles);
        return params;
    }, [currentClipId, user]);

    // Get adjacent clips from cached data using the current clip ID from URL
    const { data: adjacentClips, isLoading: loadingAdjacentClips } = useAdjacentClipsFromCache(currentClipId, adjacentClipParams);

    // Get vote status for current clip  
    const { data: voteStatus } = useClipVoteStatus(currentClipId);

    // Mutations
    const voteOnClipMutation = useVoteOnClip();
    const deleteClipMutation = useDeleteClip();

    // Local state
    const [popout, setPopout] = useState<string>('');
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

    // Extract adjacent clips for navigation
    const nextClip = adjacentClips?.next || null;
    const prevClip = adjacentClips?.previous || null;

    // Use the fetched clip data or fallback to prop
    const clipData = currentClip || clip;

    console.log('🎬 Adjacent clips state:');
    console.log('   Previous:', prevClip?._id || 'none');
    console.log('   Next:', nextClip?._id || 'none');
    console.log('   Current clip prop:', clip._id);
    console.log('   Current clip data:', clipData?._id);
    console.log('   URL clip ID:', currentClipId);

    // Set share URL
    const shareUrl = clipData ? `${window.location.origin}/clips/${clipData._id}` : '';

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
    // Handle message highlighting from navigation state
    React.useEffect(() => {
        const messageId = location.state?.messageId;
        if (messageId) {
            setHighlightedMessageId(messageId);
        }
    }, [location.state?.messageId]);

    // Set popout to 'chat' if navigating from team message notification
    React.useEffect(() => {
        if (openTeamChat && user && (user.roles.includes('admin') || user.roles.includes('clipteam'))) {
            setPopout('chat');
        }
    }, [openTeamChat, user]);



    // Navigate to adjacent clip with improved reliability
    const navigateToClip = useCallback((clipId: string) => {
        console.log('🎬 Navigating to clip:', clipId);
        console.log('🎬 Current clip:', currentClipId);
        console.log('🎬 Is loading:', isClipLoading);
        console.log('🎬 Target clipId type:', typeof clipId);
        console.log('🎬 Target clipId value:', JSON.stringify(clipId));

        // Prevent navigation if already loading
        if (isClipLoading) {
            console.log('🎬 Navigation blocked - already loading');
            return;
        }

        // Validate clip ID
        if (!clipId || typeof clipId !== 'string') {
            console.log('🎬 Navigation blocked - invalid clip ID:', clipId);
            return;
        }

        // Create a clean from state to avoid URL corruption
        // Only use the first path segment to prevent function code leaking into URLs
        const fromPathname = from.pathname.split('/').filter(Boolean);
        const basePath = fromPathname.length > 0 ? fromPathname[0] : 'clips';

        // Preserve current search parameters to maintain filters when navigating
        const currentSearchParams = new URLSearchParams(window.location.search);
        const searchString = currentSearchParams.toString();

        // Create a sanitized state object with current search params
        const cleanFromState = {
            pathname: `/${basePath}`,
            search: searchString ? `?${searchString}` : ''
        };

        console.log('🎬 Navigation details:');
        console.log('   Target clip:', clipId);
        console.log('   Search string:', searchString);
        console.log('   From state:', cleanFromState);
        console.log('   Full URL:', `/clips/${clipId}${searchString ? `?${searchString}` : ''}`);
        console.log('   Current window location:', window.location.href);

        // Update URL and let React Query handle the data fetching
        navigate(`/clips/${clipId}${searchString ? `?${searchString}` : ''}`, {
            state: { from: cleanFromState },
            replace: true // Replace current history entry to avoid back button issues
        });

        console.log('🎬 Navigation completed, new URL should be:', `/clips/${clipId}${searchString ? `?${searchString}` : ''}`);
    }, [isClipLoading, from.pathname, navigate, currentClipId]);

    if (!clipData) {
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

        // Use current search parameters to maintain filters when going back
        const currentSearchParams = new URLSearchParams(window.location.search);
        const searchString = currentSearchParams.toString();

        // Navigate back with a clean path and current search params
        navigate({
            pathname: `/${basePath}`,
            search: searchString ? `?${searchString}` : ''
        });
    };

    const toggleEditModal = (): void => {
        setIsEditModalOpen(!isEditModalOpen);
    };

    // Get current user vote from the vote status
    const userVote = voteStatus?.hasVoted ? voteStatus.voteType : null;

    const handleVote = async (voteType: 'upvote' | 'downvote'): Promise<void> => {
        if (!clipData?._id) return;

        try {
            // If user already voted the same way, remove the vote
            if (userVote === voteType) {
                await voteOnClipMutation.mutateAsync({
                    clipId: clipData._id,
                    voteType
                });
                showSuccess('Vote removed!');
            } else {
                // Vote on the clip using the mutation
                await voteOnClipMutation.mutateAsync({
                    clipId: clipData._id,
                    voteType
                });

                showSuccess(`Clip ${voteType}d successfully!`);
            }
        } catch (error: any) {
            showError(`Error ${voteType}ing clip: ${error.response?.data?.message || 'Unknown error'}`);
        }
    };

    const handleUpvote = (): Promise<void> => handleVote('upvote');
    const handleDownvote = (): Promise<void> => handleVote('downvote');

    const handleDeleteClip = async (): Promise<void> => {
        if (!clipData?._id) return;

        try {
            setIsLoading(true);
            await deleteClipMutation.mutateAsync(clipData._id);
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

    const toggleReportModal = (): void => {
        setIsReportModalOpen(!isReportModalOpen);
    };

    // Check if user has permission to report clips
    const canReportClip = useMemo((): boolean => {
        return !!(user && (
            user.roles.includes('admin') ||
            user.roles.includes('clipteam') ||
            user.roles.includes('editor')
        ));
    }, [user]);

    // Check if user is team member (for sidebar display)
    const isTeamMember = useMemo((): boolean => {
        return !!(user && (
            user.roles.includes('admin') ||
            user.roles.includes('clipteam') ||
            user.roles.includes('editor') ||
            user.roles.includes('uploader')
        ));
    }, [user]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col min-h-screen bg-neutral-100 dark:bg-neutral-900"
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
                    <title>{clipData && `${clipData.streamer} | ${clipData.title}`}</title>
                    <meta
                        name="description"
                        content={`${clipData.title} by ${clipData.streamer} on ${new Date(clipData.createdAt).toLocaleString()}. Watch the clip and rate it on ClipSesh! ${clipData.upvotes} upvotes and ${clipData.downvotes}. ${clipData.comments.length} comments. ${clipData.link}`}
                    />
                </Helmet>
            )}

            {/* Header */}
            <div className="sticky top-12 z-10 flex justify-between items-center bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm p-4 shadow-sm border-b border-neutral-200/80 dark:border-neutral-700/50 rounded-xl">
                <Link
                    className="bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium"
                    to={{
                        pathname: from.pathname,
                        search: from.search || ''
                    }}
                    onClick={(e) => {
                        e.preventDefault();
                        closeExpandedClip();
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

                    {canReportClip && (
                        <button
                            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200"
                            onClick={toggleReportModal}
                            disabled={isLoading}
                            title="Report this clip"
                        >
                            <FaFlag className="text-sm" />
                            <span className="hidden sm:inline">Report</span>
                        </button>
                    )}

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
                {/* Main content area */}
                <div className={`flex-grow relative ${isTeamMember ? 'lg:w-3/5' : 'lg:w-full'}`}>
                    {/* Video player container */}
                    <div className="flex items-center">
                        {/* Previous clip button - positioned outside the video */}
                        {prevClip && (
                            <button
                                onClick={() => {
                                    console.log('🎬 Previous button clicked:', prevClip._id);
                                    navigateToClip(prevClip._id);
                                }}
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

                        {/* Next clip button - positioned outside the video */}
                        {nextClip && (
                            <button
                                onClick={() => {
                                    console.log('🎬 Next button clicked:', nextClip._id);
                                    navigateToClip(nextClip._id);
                                }}
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

                        {/* For mobile - bottom navigation bar */}
                        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-20 flex justify-between items-center px-4 py-3 bg-neutral-100/90 dark:bg-neutral-800/90 backdrop-blur-sm">
                            <button
                                onClick={() => {
                                    console.log('🎬 Mobile previous button clicked:', prevClip?._id);
                                    prevClip && navigateToClip(prevClip._id);
                                }}
                                disabled={!prevClip || loadingAdjacentClips || isClipLoading}
                                className={`flex items-center justify-center rounded-full w-12 h-12 shadow-md ${!prevClip || loadingAdjacentClips || isClipLoading ?
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
                                    e.preventDefault();
                                    closeExpandedClip();
                                }}
                                className="bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                </svg>
                                <span>Home</span>
                            </Link>

                            <button
                                onClick={() => {
                                    console.log('🎬 Mobile next button clicked:', nextClip?._id);
                                    nextClip && navigateToClip(nextClip._id);
                                }}
                                disabled={!nextClip || loadingAdjacentClips || isClipLoading}
                                className={`flex items-center justify-center rounded-full w-12 h-12 shadow-md ${!nextClip || loadingAdjacentClips || isClipLoading ?
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

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-neutral-200/80 dark:border-neutral-700/50 overflow-hidden w-full"
                        >
                            <CustomPlayer currentClip={clipData} />

                            <div className="p-6">
                                <h1 className="text-2xl text-neutral-900 dark:text-white font-bold mb-2">
                                    {clipData.title}
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
                                                {clipData.upvotes}
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
                                                {clipData.downvotes}
                                                {userVote === 'downvote' && <span className="ml-1">✓</span>}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <a
                                            href={clipData.link}
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
                                                    {clipData.streamer}
                                                </span>
                                            </div>
                                        </div>

                                        {clipData.submitter !== 'Legacy(no data)' && (
                                            <div className="w-full sm:w-1/2">
                                                <div className="flex items-center gap-2">
                                                    <FaUser className="text-neutral-500 dark:text-neutral-400" />
                                                    <span className="text-neutral-600 dark:text-neutral-300">
                                                        Submitted by: <span className="font-medium">{clipData.submitter}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="w-full sm:w-1/2">
                                            <div className="flex items-center gap-2">
                                                <FaRegCalendarAlt className="text-neutral-500 dark:text-neutral-400" />
                                                <span
                                                    className="text-neutral-600 dark:text-neutral-300"
                                                    title={clipData.createdAt}
                                                >
                                                    {new Date(clipData.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            {clipData.updatedAt && (clipData.createdAt !== clipData.updatedAt && (
                                                <div className="flex items-center gap-2">
                                                    <FaEdit className="text-neutral-500 dark:text-neutral-400" />
                                                    <span
                                                        className="text-neutral-600 dark:text-neutral-300"
                                                        title={clipData.updatedAt}
                                                    >
                                                        {new Date(clipData.updatedAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>                                {/* Rating panel for non-team users, or always on mobile/tablet for team members (since sidebar is hidden there) */}
                                {user && !isTeamMember && (
                                    <RatingPanel
                                        clip={clipData}
                                        currentClip={clipData}
                                        user={user}
                                        isLoading={isLoading}
                                        ratings={ratings}
                                        fetchClipsAndRatings={fetchClipsAndRatings}
                                    />
                                )}
                                {/* Show rating panel on mobile/tablet for team members since sidebar is hidden */}
                                {user && isTeamMember && (
                                    <div className="lg:hidden">
                                        <RatingPanel
                                            clip={clipData}
                                            currentClip={clipData}
                                            user={user}
                                            isLoading={isLoading}
                                            ratings={ratings}
                                            fetchClipsAndRatings={fetchClipsAndRatings}
                                        />
                                    </div>
                                )}

                            </div>
                        </motion.div>
                    </div>                    {/* Comments section */}
                    <CommentSection
                        clipId={clipData._id}
                        comments={clipData.comments || []}
                        user={user}
                        fetchClipsAndRatings={fetchClipsAndRatings}
                        highlightedMessageId={highlightedMessageId}
                        setHighlightedMessageId={setHighlightedMessageId}
                        setPopout={setPopout}
                        isClipLoading={isClipLoading}
                        setIsClipLoading={() => {/* No-op since React Query handles loading state */ }}
                    />

                </div>

                {/* Team Sidebar - integrated panel for team members */}
                {isTeamMember && (
                    <div className="hidden lg:block lg:w-2/5">
                        <TeamSidebar
                            clip={clipData}
                            user={user}
                            ratings={ratings}
                            fetchClipsAndRatings={fetchClipsAndRatings}
                            highlightedMessageId={highlightedMessageId}
                        />
                    </div>
                )}
            </div>

            {/* Mobile: Floating buttons for team members (only on mobile where sidebar is hidden) */}
            {isTeamMember && popout === '' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:hidden fixed flex space-x-3 bottom-20 right-4 z-20"
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
                    setPopout={(value: string) => {
                        if (value === 'chat' || value === 'ratings') {
                            setPopout(value);
                        } else {
                            setPopout('');
                        }
                    }}
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
                    clip={clipData}
                    setCurrentClip={() => {/* Refetch handled by React Query */ }}
                />
            )}

            {/* Report Modal */}
            {isReportModalOpen && (
                <ReportModal
                    clip={clipData}
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
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
