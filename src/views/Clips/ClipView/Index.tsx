import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Helmet } from '@/lib/helmetCompat';
import { useLocation, useNavigate, Link, useParams } from '@/lib/routerCompat';
import { motion } from 'framer-motion';
import {
    FaThumbsUp,
    FaThumbsDown,
    FaShare,
    FaRegCalendarAlt,
    FaLink,
    FaChevronLeft,
    FaChevronRight,
    FaFlag,
    FaHome,
    FaArrowLeft,
    FaPlay,
    FaCommentAlt,
    FaEye,
    FaTv
} from 'react-icons/fa';
import { AiOutlineDelete, AiOutlineEdit } from 'react-icons/ai';
import { format } from 'timeago.js';
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
import Breadcrumbs, { BreadcrumbItem } from '../../../components/common/Breadcrumbs';

// React Query hooks
import {
    useClip,
    useAdjacentClipsFromCache,
    useClipVoteStatus,
    useVoteOnClip,
    useDeleteClip,
    useRecordClipView
} from '../../../hooks/useClips';


interface ClipContentProps {
    clip: Clip;
    setExpandedClip?: React.Dispatch<React.SetStateAction<string | null>> | ((clipId: string | null) => void);
    user?: User | null;
    fetchClipsAndRatings?: (user: User | null) => Promise<void>;
    ratings?: Record<string, Rating>;
    fromContext?: {
        label: string;
        path: string;
        season?: string;
        year?: number;
    };
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
    user = null,
    fetchClipsAndRatings = async () => {},
    ratings = {},
    fromContext,
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
    // This must match the format used by the main clips page to find clips in cache
    const adjacentClipParams = useMemo(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const sortOption = urlParams.get('sort') || 'newest';

        // Build params matching the main page's buildClipParams format
        const params: any = {
            sortOption: sortOption,
        };

        // Parse sortOption into sortBy and sortOrder (matching main page logic)
        if (sortOption.includes('_')) {
            const [field, direction] = sortOption.split('_');
            params.sortBy = field;
            params.sortOrder = direction;
        } else {
            switch (sortOption) {
                case 'newest':
                    params.sortBy = 'createdAt';
                    params.sortOrder = 'desc';
                    break;
                case 'oldest':
                    params.sortBy = 'createdAt';
                    params.sortOrder = 'asc';
                    break;
                case 'highestUpvotes':
                    params.sortBy = 'upvotes';
                    params.sortOrder = 'desc';
                    break;
                case 'highestDownvotes':
                    params.sortBy = 'downvotes';
                    params.sortOrder = 'desc';
                    break;
                case 'lowestRatio':
                    params.sortBy = 'ratio';
                    params.sortOrder = 'asc';
                    break;
                case 'highestRatio':
                    params.sortBy = 'ratio';
                    params.sortOrder = 'desc';
                    break;
                case 'highestAverageRating':
                    params.sortBy = 'averageRating';
                    params.sortOrder = 'desc';
                    break;
                case 'mostRated':
                    params.sortBy = 'ratingCount';
                    params.sortOrder = 'desc';
                    break;
                case 'mostDenied':
                    params.sortBy = 'denyCount';
                    params.sortOrder = 'desc';
                    break;
                default:
                    params.sortBy = 'createdAt';
                    params.sortOrder = 'desc';
            }
        }

        // Add optional parameters matching the main page format
        if (urlParams.get('streamer')) {
            params.streamer = urlParams.get('streamer');
        }
        if (urlParams.get('excludeRatedByUser')) {
            params.excludeRatedByUser = urlParams.get('excludeRatedByUser');
        }
        if (urlParams.get('excludeDeniedClips') === 'true') {
            params.excludeDeniedClips = true;
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
    const recordClipViewMutation = useRecordClipView();

    // Record view once when clip is loaded
    useEffect(() => {
        if (currentClipId && currentClipId !== 'new') {
            recordClipViewMutation.mutate(currentClipId);
        }
    }, [currentClipId]);

    // Local state
    const [popout, setPopout] = useState<string>('');
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);

    // Extract adjacent clips for navigation
    const nextClip = adjacentClips?.next || null;
    const prevClip = adjacentClips?.previous || null;

    // Use the fetched clip data or fallback to prop
    const clipData = currentClip || clip;

    // Set share URL
    const shareUrl = clipData ? `${window.location.origin}/clips/${clipData._id}` : '';

    // Use our custom notification hook instead of toast
    const { showSuccess, showError } = useNotification();

    const navigate = useNavigate();
    const location = useLocation();

    // Ensure we have a clean, safe 'from' state object that won't break navigation
    const from = useMemo(() => {
        if (fromContext) {
            return {
                pathname: fromContext.path.split('?')[0] || '/archive',
                search: fromContext.path.includes('?') ? `?${fromContext.path.split('?')[1]}` : '',
                label: fromContext.label,
                season: fromContext.season,
                year: fromContext.year,
            };
        }

        // Get the from state if it exists
        const locationState = location.state as LocationState;

        // Determine sensible fallback based on window.location
        const curPath = typeof window !== 'undefined' ? window.location.pathname : (location.pathname || '/clips');
        const curSearch = typeof window !== 'undefined' ? window.location.search : (location.search || '');

        let defaultPathname = '/clips';
        let defaultLabel = 'Clips';
        if (curPath.includes('archive') || curPath.includes('search')) {
            defaultPathname = '/archive';
            defaultLabel = 'Archive';
        } else if (curPath.includes('admin')) {
            defaultPathname = '/admin';
            defaultLabel = 'Admin';
        } else if (curPath.includes('profile')) {
            defaultPathname = '/profile';
            defaultLabel = 'Profile';
        }

        const curSp = new URLSearchParams(curSearch);
        const curSeason = curSp.get('season') || undefined;
        const curYear = curSp.get('year') ? parseInt(curSp.get('year')!, 10) : undefined;

        const defaultPath = {
            pathname: defaultPathname,
            search: curSearch,
            label: defaultLabel,
            season: curSeason,
            year: curYear,
        };

        if (!locationState || !locationState.from) {
            return defaultPath;
        }

        // Check if locationFrom is a string (handles older format or corrupted state)
        if (typeof locationState.from === 'string') {
            try {
                const fromString = String(locationState.from);
                const parts = fromString.split('?');
                const pathPart = parts[0] || defaultPathname;
                const searchPart = parts.length > 1 ? `?${parts[1]}` : '';

                const searchParams = new URLSearchParams(searchPart);
                const season = searchParams.get('season') || undefined;
                const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;

                let label = 'Clips';
                if (pathPart.includes('archive') || pathPart.includes('search')) {
                    label = 'Archive';
                } else if (pathPart.includes('admin')) {
                    label = 'Admin';
                } else if (pathPart.includes('profile')) {
                    label = 'Profile';
                }

                return {
                    pathname: pathPart,
                    search: searchPart,
                    label,
                    season,
                    year,
                };
            } catch (err) {
                console.error('Error parsing from state (string):', err);
                return defaultPath;
            }
        }

        // Handle object case
        try {
            if (locationState.from.pathname) {
                const pathPart = String(locationState.from.pathname);
                const searchPart = locationState.from.search || '';

                const searchParams = new URLSearchParams(searchPart);
                const season = searchParams.get('season') || undefined;
                const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;

                let label = 'Clips';
                if (pathPart.includes('archive') || pathPart.includes('search')) {
                    label = 'Archive';
                } else if (pathPart.includes('admin')) {
                    label = 'Admin';
                } else if (pathPart.includes('profile')) {
                    label = 'Profile';
                }

                return {
                    pathname: pathPart,
                    search: searchPart,
                    label,
                    season,
                    year,
                };
            }
        } catch (err) {
            console.error('Error parsing from state (object):', err);
        }

        return defaultPath;
    }, [fromContext, location.state, location.pathname, location.search]);

    const openTeamChat = location.state?.openTeamChat;

    // Set highlighted message from location state
    React.useEffect(() => {
        const messageId = location.state?.messageId;
        if (messageId) {
            setHighlightedMessageId(messageId);
        }
    }, [location.state?.messageId]);

    // Set popout to 'chat' if navigating from team message notification
    React.useEffect(() => {
        if (openTeamChat && user && (user.roles?.includes('admin') || user.roles?.includes('clipteam'))) {
            setPopout('chat');
        }
    }, [openTeamChat, user]);

    // Navigate to adjacent clip with improved reliability
    const navigateToClip = useCallback((targetClipId: string) => {
        // Prevent navigation if already loading
        if (isClipLoading) {
            return;
        }

        // Validate clip ID
        if (!targetClipId || typeof targetClipId !== 'string') {
            return;
        }

        if (setExpandedClip) {
            setExpandedClip(targetClipId);
            return;
        }

        const currentSearchParams = new URLSearchParams(window.location.search);
        const searchString = currentSearchParams.toString();

        const cleanFromState = {
            pathname: from.pathname,
            search: from.search || (searchString ? `?${searchString}` : '')
        };

        // Update URL and let React Query handle the data fetching
        navigate(`/clips/${targetClipId}${searchString ? `?${searchString}` : ''}`, {
            state: { from: cleanFromState },
            replace: true
        });
    }, [isClipLoading, setExpandedClip, from, navigate]);

    // Keyboard arrow navigation between clips
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return;
            }
            if (e.key === 'ArrowRight' && nextClip?._id) {
                navigateToClip(nextClip._id);
            } else if (e.key === 'ArrowLeft' && prevClip?._id) {
                navigateToClip(prevClip._id);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextClip, prevClip, navigateToClip]);

    if (!clipData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
                <div className="animate-spin rounded-full h-14 w-14 border-2 border-t-transparent border-[#f23030]"></div>
            </div>
        );
    }

    const closeExpandedClip = (): void => {
        if (setExpandedClip) {
            setExpandedClip(null);
            return;
        }

        const targetPath = from.pathname || '/clips';
        const searchString = from.search ? (from.search.startsWith('?') ? from.search : `?${from.search}`) : '';

        navigate({
            pathname: targetPath,
            search: searchString
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
            if (userVote === voteType) {
                await voteOnClipMutation.mutateAsync({
                    clipId: clipData._id,
                    voteType
                });
                showSuccess('Vote removed!');
            } else {
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
            user.roles?.includes('admin') ||
            user.roles?.includes('clipteam') ||
            user.roles?.includes('editor')
        ));
    }, [user]);

    // Check if user is team member (for sidebar display)
    const isTeamMember = useMemo((): boolean => {
        return !!(user && (
            user.roles?.includes('admin') ||
            user.roles?.includes('clipteam') ||
            user.roles?.includes('editor') ||
            user.roles?.includes('uploader')
        ));
    }, [user]);

    // Build rich, context-aware breadcrumb navigation items
    const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [
            { label: 'Home', path: '/', icon: <FaHome className="w-3.5 h-3.5" /> }
        ];

        const isArchive = from.label === 'Archive' || from.pathname.includes('archive') || from.pathname.includes('search');

        if (isArchive) {
            // Archive overview root
            items.push({
                label: 'Archive',
                path: '/archive',
                onClick: () => {
                    if (setExpandedClip) {
                        setExpandedClip(null);
                    }
                }
            });

            // If coming from a specific season view, add the season level breadcrumb
            if (from.season && from.year) {
                const seasonSearch = `?season=${encodeURIComponent(from.season)}&year=${from.year}`;
                items.push({
                    label: `${from.season} ${from.year}`,
                    path: `/archive${seasonSearch}`,
                    onClick: () => {
                        if (setExpandedClip) {
                            setExpandedClip(null);
                        }
                    }
                });
            }
        } else if (from.pathname.includes('admin')) {
            items.push({
                label: 'Admin',
                path: from.pathname + (from.search ? from.search : ''),
                onClick: () => {
                    if (setExpandedClip) {
                        setExpandedClip(null);
                    }
                }
            });
        } else if (from.pathname.includes('profile')) {
            items.push({
                label: 'Profile',
                path: from.pathname + (from.search ? from.search : ''),
                onClick: () => {
                    if (setExpandedClip) {
                        setExpandedClip(null);
                    }
                }
            });
        } else {
            // Default: Clips
            items.push({
                label: 'Clips',
                path: from.pathname + (from.search ? from.search : ''),
                onClick: () => {
                    if (setExpandedClip) {
                        setExpandedClip(null);
                    }
                }
            });
        }

        // Current clip title
        items.push({
            label: clipData?.title || 'Clip'
        });

        return items;
    }, [from, clipData?.title, setExpandedClip]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col min-h-screen bg-[#0f0f0f] text-[#f1f1f1]"
        >
            {/* Loading overlay */}
            {isClipLoading && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-xs">
                    <div className="bg-[#181818] border border-[#262626] rounded-2xl p-6 shadow-2xl flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#f23030] border-t-transparent mb-3"></div>
                        <p className="text-[#f1f1f1] text-xs font-semibold">Loading clip...</p>
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

            {/* YouTube Compact Page Header Bar */}
            <div className="border-b border-[#262626] bg-[#141414] py-3 sticky top-0 z-30 backdrop-blur-md">
                <div className="max-w-[1720px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Back button + Breadcrumbs */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={closeExpandedClip}
                            className="px-3 py-1.5 rounded-full bg-[#202020] hover:bg-[#262626] border border-[#2a2a2a] text-[#aaaaaa] hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold shrink-0"
                            title={from.label === 'Archive' || from.pathname.includes('archive') ? 'Back to archive' : 'Back to clips'}
                        >
                            <FaArrowLeft size={10} />
                            <span>Back</span>
                        </button>

                        <Breadcrumbs items={breadcrumbItems} />
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#202020] hover:bg-[#262626] border border-[#2a2a2a] text-[#aaaaaa] hover:text-white text-xs font-semibold transition-colors"
                            onClick={() => {
                                navigator.clipboard.writeText(shareUrl)
                                    .then(() => handleCopyShareLink())
                                    .catch(err => console.error('Failed to copy text: ', err));
                            }}
                        >
                            <FaShare size={11} />
                            <span>Share</span>
                        </button>

                        {canReportClip && (
                            <button
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#202020] hover:bg-[#262626] border border-[#2a2a2a] text-[#aaaaaa] hover:text-[#f23030] text-xs font-semibold transition-colors"
                                onClick={toggleReportModal}
                                disabled={isLoading}
                                title="Report this clip"
                            >
                                <FaFlag size={11} />
                                <span>Report</span>
                            </button>
                        )}

                        {user && user.roles?.includes('admin') && (
                            <>
                                <button
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#202020] hover:bg-[#262626] border border-[#2a2a2a] text-[#aaaaaa] hover:text-white text-xs font-semibold transition-colors"
                                    onClick={toggleEditModal}
                                    disabled={isLoading}
                                >
                                    <AiOutlineEdit size={13} />
                                    <span>Edit</span>
                                </button>
                                <button
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f23030]/15 hover:bg-[#f23030]/25 border border-[#f23030]/30 text-[#f23030] text-xs font-semibold transition-colors"
                                    onClick={handleDeleteClick}
                                    disabled={isLoading}
                                >
                                    <AiOutlineDelete size={13} />
                                    <span>Delete</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop Side Chevron Navigation */}
            {prevClip && (
                <button
                    onClick={() => navigateToClip(prevClip._id)}
                    disabled={loadingAdjacentClips || isClipLoading}
                    className={`hidden 2xl:flex fixed left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full items-center justify-center shadow-2xl border transition-all ${
                        loadingAdjacentClips || isClipLoading
                            ? 'bg-[#181818]/50 border-[#262626] opacity-50 cursor-not-allowed'
                            : 'bg-[#181818]/90 hover:bg-[#242424] text-[#f1f1f1] border-[#2a2a2a] hover:scale-110 active:scale-95'
                    }`}
                    title={`Previous: ${prevClip.title}`}
                    aria-label="Previous clip"
                >
                    {isClipLoading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-[#f23030] border-t-transparent rounded-full" />
                    ) : (
                        <FaChevronLeft size={16} />
                    )}
                </button>
            )}

            {nextClip && (
                <button
                    onClick={() => navigateToClip(nextClip._id)}
                    disabled={loadingAdjacentClips || isClipLoading}
                    className={`hidden 2xl:flex fixed right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full items-center justify-center shadow-2xl border transition-all ${
                        loadingAdjacentClips || isClipLoading
                            ? 'bg-[#181818]/50 border-[#262626] opacity-50 cursor-not-allowed'
                            : 'bg-[#181818]/90 hover:bg-[#242424] text-[#f1f1f1] border-[#2a2a2a] hover:scale-110 active:scale-95'
                    }`}
                    title={`Next: ${nextClip.title}`}
                    aria-label="Next clip"
                >
                    {isClipLoading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-[#f23030] border-t-transparent rounded-full" />
                    ) : (
                        <FaChevronRight size={16} />
                    )}
                </button>
            )}

            {/* Main Watch Layout Container */}
            <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col lg:flex-row gap-6">
                {/* Left / Main Watch Column */}
                <div className="flex-1 min-w-0 flex flex-col gap-4">
                    {/* 16:9 Video Player */}
                    <div className="w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-[#262626]">
                        <CustomPlayer currentClip={clipData} />
                    </div>

                    {/* Video Details */}
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#f1f1f1] tracking-tight leading-snug">
                            {clipData.title}
                        </h1>

                        {/* Streamer Channel Row + Action Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-[#262626]">
                            {/* Left: Streamer info */}
                            <div className="flex items-center gap-3">
                                <Link
                                    to={`/clips?streamer=${encodeURIComponent(clipData.streamer)}`}
                                    className="w-10 h-10 rounded-xl bg-[#202020] border border-[#2a2a2a] flex items-center justify-center text-cc-red hover:border-[#3a3a3a] transition-all shrink-0"
                                    title={clipData.streamer}
                                >
                                    <FaTv size={16} />
                                </Link>
                                <div>
                                    <Link
                                        to={`/clips?streamer=${encodeURIComponent(clipData.streamer)}`}
                                        className="font-bold text-[#f1f1f1] text-base hover:text-white transition-colors block leading-tight"
                                    >
                                        {clipData.streamer}
                                    </Link>
                                    <div className="text-xs text-[#aaaaaa] mt-0.5 flex items-center gap-1.5">
                                        {clipData.submitter !== 'Legacy(no data)' && (
                                            <span>submitted by <span className="text-[#d4d4d4] font-medium">{clipData.submitter}</span></span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Segmented Like / Dislike Pill */}
                                <div className="flex items-center bg-[#202020] border border-[#2a2a2a] rounded-full overflow-hidden shadow-xs">
                                    <button
                                        onClick={handleUpvote}
                                        disabled={isLoading}
                                        className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-colors ${
                                            userVote === 'upvote'
                                                ? 'bg-[#f23030]/20 text-[#f23030]'
                                                : 'text-[#f1f1f1] hover:bg-[#2c2c2c]'
                                        }`}
                                        title={userVote === 'upvote' ? 'Remove upvote' : 'Upvote'}
                                    >
                                        <FaThumbsUp size={12} className={userVote === 'upvote' ? 'text-[#f23030]' : 'text-[#aaaaaa]'} />
                                        <span>{clipData.upvotes}</span>
                                    </button>
                                    <div className="w-px h-4 bg-[#333333]" />
                                    <button
                                        onClick={handleDownvote}
                                        disabled={isLoading}
                                        className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition-colors ${
                                            userVote === 'downvote'
                                                ? 'bg-[#f23030]/20 text-[#f23030]'
                                                : 'text-[#f1f1f1] hover:bg-[#2c2c2c]'
                                        }`}
                                        title={userVote === 'downvote' ? 'Remove downvote' : 'Downvote'}
                                    >
                                        <FaThumbsDown size={12} className={userVote === 'downvote' ? 'text-[#f23030]' : 'text-[#aaaaaa]'} />
                                        {clipData.downvotes > 0 && <span>{clipData.downvotes}</span>}
                                    </button>
                                </div>

                                {/* Share Pill */}
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(shareUrl).then(handleCopyShareLink);
                                    }}
                                    className="flex items-center gap-1.5 bg-[#202020] hover:bg-[#2c2c2c] border border-[#2a2a2a] text-[#f1f1f1] px-4 py-2 rounded-full text-xs font-semibold transition-colors"
                                >
                                    <FaShare size={11} className="text-[#aaaaaa]" />
                                    <span>Share</span>
                                </button>

                                {/* Source / Link Pill */}
                                <a
                                    href={clipData.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 bg-[#202020] hover:bg-[#2c2c2c] border border-[#2a2a2a] text-[#f1f1f1] px-4 py-2 rounded-full text-xs font-semibold transition-colors"
                                    title="View original clip source"
                                >
                                    <FaLink size={11} className="text-[#aaaaaa]" />
                                    <span>Source</span>
                                </a>
                            </div>
                        </div>

                        {/* Expandable Description Box */}
                        <div
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="mt-4 bg-[#1a1a1a] hover:bg-[#202020] transition-colors rounded-xl p-4 border border-[#262626] cursor-pointer"
                        >
                            <div className="flex flex-wrap items-center gap-2 font-semibold text-xs text-[#f1f1f1] mb-1">
                                <span className="flex items-center gap-1.5 text-[#f1f1f1]">
                                    <FaEye size={12} className="text-[#aaaaaa]" />
                                    <span>{clipData.views || 0} views</span>
                                </span>
                                <span>•</span>
                                <span>{clipData.upvotes + clipData.downvotes} total votes</span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-[#aaaaaa]">
                                    <FaRegCalendarAlt size={10} />
                                    {new Date(clipData.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })} ({format(new Date(clipData.createdAt))})
                                </span>
                                {clipData.comments && clipData.comments.length > 0 && (
                                    <>
                                        <span>•</span>
                                        <span className="text-[#aaaaaa]">{clipData.comments.length} comments</span>
                                    </>
                                )}
                            </div>

                            <div className="text-xs text-[#aaaaaa] space-y-1 mt-2">
                                <p>Streamer: <span className="text-[#f1f1f1] font-medium">{clipData.streamer}</span></p>
                                {clipData.submitter && (
                                    <p>Submitted by: <span className="text-[#f1f1f1] font-medium">{clipData.submitter}</span></p>
                                )}
                                {isDescriptionExpanded && (
                                    <div className="pt-2 mt-2 border-t border-[#262626] text-[11px] text-[#717171] space-y-1">
                                        <p>Original Link: <a href={clipData.link} target="_blank" rel="noreferrer" className="text-[#f23030] hover:underline break-all">{clipData.link}</a></p>
                                        <p>Clip ID: <span className="font-mono text-[#888888]">{clipData._id}</span></p>
                                    </div>
                                )}
                            </div>
                            <span className="text-[11px] font-semibold text-[#f1f1f1] mt-2 inline-block">
                                {isDescriptionExpanded ? 'Show less' : '...more'}
                            </span>
                        </div>

                        {/* Rating panel for non-team users */}
                        {user && !isTeamMember && (
                            <div className="mt-4">
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

                        {/* Show rating panel on mobile/tablet for team members since sidebar is hidden */}
                        {user && isTeamMember && (
                            <div className="lg:hidden mt-4">
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

                        {/* Comments section */}
                        <CommentSection
                            clipId={clipData._id}
                            comments={clipData.comments || []}
                            user={user}
                            fetchClipsAndRatings={fetchClipsAndRatings}
                            highlightedMessageId={highlightedMessageId}
                            setHighlightedMessageId={setHighlightedMessageId}
                            setPopout={setPopout}
                            isClipLoading={isClipLoading}
                            setIsClipLoading={() => {}}
                        />
                    </div>
                </div>

                {/* Right / Sidebar Column */}
                <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col gap-5">
                    {/* Team Sidebar */}
                    {isTeamMember && (
                        <div className="hidden lg:block">
                            <TeamSidebar
                                clip={clipData}
                                user={user}
                                ratings={ratings}
                                fetchClipsAndRatings={fetchClipsAndRatings}
                                highlightedMessageId={highlightedMessageId}
                            />
                        </div>
                    )}

                    {/* Up Next Queue Section (YouTube style) */}
                    <div className="bg-[#181818] rounded-xl border border-[#262626] p-4 flex flex-col gap-3 shadow-sm">
                        <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#f1f1f1]">
                                Queue Navigation
                            </h3>
                            <span className="text-[10px] text-[#717171]">← → arrow keys</span>
                        </div>

                        {nextClip ? (
                            <div
                                onClick={() => navigateToClip(nextClip._id)}
                                className="flex gap-3 group cursor-pointer p-2 rounded-xl hover:bg-[#202020] transition-colors"
                                title={`Play Next: ${nextClip.title}`}
                            >
                                <div className="w-36 aspect-video rounded-lg overflow-hidden bg-black shrink-0 relative border border-[#2a2a2a]">
                                    {nextClip.thumbnail ? (
                                        <img
                                            src={nextClip.thumbnail}
                                            alt={nextClip.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#717171]">
                                            <FaPlay size={14} />
                                        </div>
                                    )}
                                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#f23030] text-[9px] font-bold text-white uppercase tracking-wider">
                                        Next
                                    </span>
                                </div>
                                <div className="flex flex-col justify-between py-0.5 min-w-0">
                                    <div>
                                        <p className="text-xs font-semibold text-[#f1f1f1] group-hover:text-white line-clamp-2 leading-snug">
                                            {nextClip.title}
                                        </p>
                                        <p className="text-[11px] text-[#aaaaaa] mt-1 truncate">
                                            {nextClip.streamer}
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-[#717171] flex items-center gap-1.5 mt-1">
                                        <FaThumbsUp size={9} />
                                        <span>{nextClip.upvotes}</span>
                                        <span>•</span>
                                        <span>{format(new Date(nextClip.createdAt))}</span>
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        {prevClip ? (
                            <div
                                onClick={() => navigateToClip(prevClip._id)}
                                className="flex gap-3 group cursor-pointer p-2 rounded-xl hover:bg-[#202020] transition-colors"
                                title={`Play Previous: ${prevClip.title}`}
                            >
                                <div className="w-36 aspect-video rounded-lg overflow-hidden bg-black shrink-0 relative border border-[#2a2a2a]">
                                    {prevClip.thumbnail ? (
                                        <img
                                            src={prevClip.thumbnail}
                                            alt={prevClip.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#717171]">
                                            <FaPlay size={14} />
                                        </div>
                                    )}
                                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 border border-white/10 text-[9px] font-bold text-white uppercase tracking-wider">
                                        Prev
                                    </span>
                                </div>
                                <div className="flex flex-col justify-between py-0.5 min-w-0">
                                    <div>
                                        <p className="text-xs font-semibold text-[#f1f1f1] group-hover:text-white line-clamp-2 leading-snug">
                                            {prevClip.title}
                                        </p>
                                        <p className="text-[11px] text-[#aaaaaa] mt-1 truncate">
                                            {prevClip.streamer}
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-[#717171] flex items-center gap-1.5 mt-1">
                                        <FaThumbsUp size={9} />
                                        <span>{prevClip.upvotes}</span>
                                        <span>•</span>
                                        <span>{format(new Date(prevClip.createdAt))}</span>
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        {!nextClip && !prevClip && (
                            <p className="text-xs text-[#717171] py-2 text-center">
                                No other clips found in current view.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 flex justify-between items-center px-4 py-2.5 bg-[#141414]/95 backdrop-blur-md border-t border-[#262626]">
                {/* Previous button */}
                <button
                    onClick={() => {
                        prevClip && navigateToClip(prevClip._id);
                    }}
                    disabled={!prevClip || loadingAdjacentClips || isClipLoading}
                    className={`flex items-center justify-center rounded-full w-10 h-10 transition-all ${
                        !prevClip || loadingAdjacentClips || isClipLoading
                            ? 'bg-[#181818] text-[#555555] opacity-50'
                            : 'bg-[#202020] border border-[#2a2a2a] text-[#f1f1f1] hover:scale-105 active:scale-95'
                    }`}
                    aria-label="Previous clip"
                >
                    {isClipLoading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-[#f23030] border-t-transparent rounded-full"></div>
                    ) : (
                        <FaChevronLeft size={14} />
                    )}
                </button>

                {/* Center section */}
                {isTeamMember ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPopout('chat')}
                            className="px-3.5 py-1.5 rounded-full bg-[#f23030] text-white text-xs font-semibold flex items-center gap-1.5"
                        >
                            <FaCommentAlt size={11} />
                            <span>Chat</span>
                        </button>
                        <button
                            onClick={() => setPopout('ratings')}
                            className="px-3.5 py-1.5 rounded-full bg-[#202020] border border-[#2a2a2a] text-[#f1f1f1] text-xs font-semibold flex items-center gap-1.5"
                        >
                            <span>Ratings</span>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={closeExpandedClip}
                        className="px-3.5 py-1.5 rounded-full bg-[#202020] border border-[#2a2a2a] text-[#f1f1f1] text-xs font-semibold flex items-center gap-1.5"
                    >
                        <FaHome size={12} />
                        <span>{from.label || 'Clips'}</span>
                    </button>
                )}

                {/* Next button */}
                <button
                    onClick={() => {
                        nextClip && navigateToClip(nextClip._id);
                    }}
                    disabled={!nextClip || loadingAdjacentClips || isClipLoading}
                    className={`flex items-center justify-center rounded-full w-10 h-10 transition-all ${
                        !nextClip || loadingAdjacentClips || isClipLoading
                            ? 'bg-[#181818] text-[#555555] opacity-50'
                            : 'bg-[#202020] border border-[#2a2a2a] text-[#f1f1f1] hover:scale-105 active:scale-95'
                    }`}
                    aria-label="Next clip"
                >
                    {isClipLoading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-[#f23030] border-t-transparent rounded-full"></div>
                    ) : (
                        <FaChevronRight size={14} />
                    )}
                </button>
            </div>

            {/* Popouts */}
            {popout === 'chat' ? (
                <MessageComponent
                    clipId={clipData._id}
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
                <RatingsComponent clip={clipData} ratings={ratings} setPopout={setPopout} />
            ) : null}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <EditModal
                    isEditModalOpen={isEditModalOpen}
                    setIsEditModalOpen={toggleEditModal}
                    clip={clipData}
                    setCurrentClip={() => {}}
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
          background-color: rgba(107, 114, 128, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(107, 114, 128, 0.4) transparent;
        }
      `}</style>
        </motion.div>
    );
};

export default ClipContent;
