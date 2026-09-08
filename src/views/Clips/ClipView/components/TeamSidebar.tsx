import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaComments, FaAngleDown, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { AiOutlineSend, AiOutlineDelete } from 'react-icons/ai';
import { format } from 'timeago.js';
import { useNotification } from '../../../../context/AlertContext';
import { User, Clip, Rating, RatingUser } from '../../../../types/adminTypes';
import { getRatingById, submitRating } from '../../../../services/ratingService';
import {
    getMessagesForClip,
    sendMessage,
    deleteMessage,
    Message as MessageType,
    SendMessageData
} from '../../../../services/messageService';
import { getUserAvatarUrl, handleAvatarError } from '../../../../utils/generateAvatar';

interface TeamSidebarProps {
    clip: Clip;
    user: User | null;
    ratings: Record<string, Rating>;
    fetchClipsAndRatings: (user: User | null) => Promise<void>;
    highlightedMessageId?: string | null;
}

type TabType = 'rate' | 'chat';

const TeamSidebar: React.FC<TeamSidebarProps> = ({
    clip,
    user,
    ratings,
    fetchClipsAndRatings,
    highlightedMessageId = null,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('rate');

    // Rating state
    const [isRatingLoading, setIsRatingLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localRatings, setLocalRatings] = useState<Record<string, Rating> | null>(null);
    const [userCurrentRating, setUserCurrentRating] = useState<string | null>(null);

    // Chat state
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatLoading, setChatLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Stats state
    const [selectedCategory, setSelectedCategory] = useState<number | 'deny' | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const { showError, showSuccess } = useNotification();

    // --- Rating Logic ---
    const currentRatingsData = (ratings && ratings[clip._id]) || (localRatings && localRatings[clip._id]);

    useEffect(() => {
        const fetchRatings = async () => {
            if (!ratings || !ratings[clip._id]) {
                setIsRatingLoading(true);
                setStatsLoading(true);
                try {
                    const ratingsData = await getRatingById(clip._id);
                    if (ratingsData) {
                        setLocalRatings({ [clip._id]: ratingsData });
                    }
                } catch (error) {
                    console.error('Error fetching ratings:', error);
                } finally {
                    setIsRatingLoading(false);
                    setStatsLoading(false);
                }
            } else {
                setStatsLoading(false);
            }
        };
        fetchRatings();
    }, [clip._id, ratings]);

    useEffect(() => {
        if (!user || !currentRatingsData) {
            setUserCurrentRating(null);
            return;
        }

        if (currentRatingsData.ratingCounts) {
            for (const ratingGroup of currentRatingsData.ratingCounts) {
                const users = ratingGroup.users || [];
                if (users.some((u: RatingUser) => u && u.userId === user._id)) {
                    setUserCurrentRating(ratingGroup.rating.toString());
                    return;
                }
            }
        } else if (currentRatingsData.ratings) {
            const ratingCategories = ['1', '2', '3', '4', 'deny'] as const;
            for (const category of ratingCategories) {
                const ratingUsers = currentRatingsData.ratings[category] || [];
                if (ratingUsers.some((u: RatingUser) => u && u.userId === user._id)) {
                    setUserCurrentRating(category);
                    return;
                }
            }
        }
        setUserCurrentRating(null);
    }, [user, currentRatingsData]);

    const rateOrDenyClip = async (rating: number | null = null, isDeny: boolean = false) => {
        if (isSubmitting || !user) return;

        setIsSubmitting(true);
        try {
            const ratingValue = rating !== null ? rating.toString() as '1' | '2' | '3' | '4' : 'deny';
            const isRemovingRating = userCurrentRating === ratingValue;

            await submitRating(clip._id, ratingValue);

            if (isRemovingRating) {
                setUserCurrentRating(null);
                showSuccess('Rating removed!');
            } else {
                setUserCurrentRating(ratingValue);
                showSuccess('Rating submitted!');
            }

            await fetchClipsAndRatings(user);
        } catch (error: any) {
            showError('Error rating clip: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const isUserStreamerOrSubmitter = !!(user && (
        user.username.toLowerCase() === clip.submitter.toLowerCase() ||
        user.username.toLowerCase() === clip.streamer.toLowerCase()
    ));

    const getButtonColors = (rating: number, selected: boolean) => {
        if (selected) {
            return 'bg-[#f23030] text-white ring-2 ring-[#f23030]/50 shadow-md shadow-[#f23030]/20';
        }
        if (isUserStreamerOrSubmitter) {
            return 'bg-[#121212]/50 border border-[#2a2a2a] text-neutral-600 cursor-not-allowed';
        }
        return 'bg-[#181818] border border-[#2c2c2c] text-neutral-200 hover:border-[#f23030] hover:text-[#f23030] transition-colors';
    };

    // --- Chat Logic ---
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                setChatLoading(true);
                const messagesData = await getMessagesForClip(clip._id);
                setMessages(messagesData);
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            } finally {
                setChatLoading(false);
            }
        };

        fetchMessages();
        const intervalId = setInterval(fetchMessages, 10000);
        return () => clearInterval(intervalId);
    }, [clip._id]);

    // Switch to chat tab when highlightedMessageId is provided
    useEffect(() => {
        if (highlightedMessageId) {
            setActiveTab('chat');
        }
    }, [highlightedMessageId]);

    // Scroll to highlighted message when messages are loaded
    useEffect(() => {
        if (highlightedMessageId && messages.length > 0) {
            const messageElement = document.getElementById(`message-${highlightedMessageId}`);
            if (messageElement) {
                setTimeout(() => {
                    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    messageElement.classList.add('highlight-animation');
                    setTimeout(() => {
                        messageElement.classList.remove('highlight-animation');
                    }, 2000);
                }, 500);
            }
        } else if (!highlightedMessageId) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, highlightedMessageId]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user) return;

        try {
            const messageData: SendMessageData = {
                clipId: clip._id,
                userId: user._id,
                user: user.username,
                message: newMessage.trim(),
                profilePicture: user.profilePicture,
            };

            const newMessageData = await sendMessage(messageData);
            setMessages((prev) => [newMessageData, ...prev]);
            setNewMessage('');
        } catch (error) {
            showError('Failed to send message');
        }
    };

    const handleDeleteMessage = async (id: string) => {
        if (!user) return;
        try {
            await deleteMessage(id, user._id, user.roles);
            setMessages((prev) => prev.filter((msg) => msg._id !== id));
        } catch (error) {
            showError('Failed to delete message');
        }
    };

    // --- Stats Logic ---
    let ratingCounts: Array<{ rating: string; count: number; users: RatingUser[] }> = [];

    if (currentRatingsData?.ratingCounts) {
        ratingCounts = currentRatingsData.ratingCounts;
    } else if (currentRatingsData?.ratings) {
        ratingCounts = [
            { rating: '1', count: (currentRatingsData.ratings['1'] || []).length, users: currentRatingsData.ratings['1'] || [] },
            { rating: '2', count: (currentRatingsData.ratings['2'] || []).length, users: currentRatingsData.ratings['2'] || [] },
            { rating: '3', count: (currentRatingsData.ratings['3'] || []).length, users: currentRatingsData.ratings['3'] || [] },
            { rating: '4', count: (currentRatingsData.ratings['4'] || []).length, users: currentRatingsData.ratings['4'] || [] },
            { rating: 'deny', count: (currentRatingsData.ratings['deny'] || []).length, users: currentRatingsData.ratings['deny'] || [] },
        ];
    }

    const totalRatings = ratingCounts.reduce((acc, curr) => acc + curr.count, 0);
    const numericRatings = ratingCounts.filter(r => r.rating !== 'deny');
    const averageRating = numericRatings.reduce((acc, curr) => acc + curr.count, 0) > 0
        ? (numericRatings.reduce((acc, curr) => acc + (Number(curr.rating) * curr.count), 0) /
            numericRatings.reduce((acc, curr) => acc + curr.count, 0)).toFixed(1)
        : 'N/A';
    const denyData = ratingCounts.find(r => r.rating === 'deny');
    const denyCount = denyData?.count || 0;

    const tabs = [
        { id: 'rate' as TabType, label: 'Rate Clip', icon: FaStar },
        { id: 'chat' as TabType, label: 'Team Chat', icon: FaComments }
    ];

    const isDisabled = isRatingLoading || isSubmitting || isUserStreamerOrSubmitter;

    return (
        <div className="bg-[#181818] rounded-2xl shadow-sm border border-[#2a2a2a] overflow-hidden sticky top-20 text-[#f1f1f1] select-none">
            {/* Tab Header */}
            <div className="flex border-b border-[#2a2a2a] p-1.5 bg-[#121212]">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
                            activeTab === tab.id
                                ? 'bg-white text-black shadow-xs'
                                : 'text-neutral-400 hover:text-white'
                        }`}
                    >
                        <tab.icon className="text-xs" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="overflow-y-auto">
                <AnimatePresence mode="wait">
                    {/* Rate Tab */}
                    {activeTab === 'rate' && (
                        <motion.div
                            key="rate"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="p-4"
                        >
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#262626]">
                                <div>
                                    <h3 className="font-bold text-white text-sm">Rating Score</h3>
                                    <p className="text-[11px] text-neutral-400">1 = Top Tier · 4 = Filler Material</p>
                                </div>
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#f23030] bg-[#f23030]/10 border border-[#f23030]/20 px-2.5 py-0.5 rounded-full">
                                    Clip Team
                                </span>
                            </div>

                            {isUserStreamerOrSubmitter && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                                    <p className="text-amber-400 text-xs font-medium flex items-center gap-1.5">
                                        <FaExclamationTriangle className="shrink-0" />
                                        <span>You cannot rate your own clips.</span>
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-5 gap-2 mb-4">
                                {[1, 2, 3, 4].map((rate) => {
                                    const isSelected = userCurrentRating === rate.toString();
                                    return (
                                        <button
                                            key={rate}
                                            onClick={() => !isDisabled && rateOrDenyClip(rate)}
                                            disabled={isDisabled}
                                            className={`flex items-center justify-center py-2.5 rounded-xl font-bold text-base transition-all ${getButtonColors(rate, isSelected)} ${isSubmitting ? 'opacity-50' : ''}`}
                                        >
                                            <span>{rate}</span>
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => !isDisabled && rateOrDenyClip(null, true)}
                                    disabled={isDisabled}
                                    title="Deny clip"
                                    className={`flex items-center justify-center py-2.5 rounded-xl font-bold text-sm transition-all ${
                                        userCurrentRating === 'deny'
                                            ? 'bg-red-600 text-white ring-2 ring-red-500/50 shadow-md'
                                            : isUserStreamerOrSubmitter
                                                ? 'bg-[#121212]/50 border border-[#2a2a2a] text-neutral-600 cursor-not-allowed'
                                                : 'bg-[#181818] border border-[#2c2c2c] text-neutral-300 hover:border-red-500/60 hover:text-red-400'
                                    } ${isSubmitting ? 'opacity-50' : ''}`}
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Ratings Stats breakdown */}
                            <div className="space-y-3 pt-3 border-t border-[#262626]">
                                <div className="flex items-center justify-between text-xs text-neutral-400">
                                    <span>Average Rating</span>
                                    <span className="font-bold text-white font-mono">{averageRating} / 4.0</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-neutral-400">
                                    <span>Total Ratings</span>
                                    <span className="font-bold text-white font-mono">{totalRatings}</span>
                                </div>

                                <div className="space-y-1.5 pt-2">
                                    {[1, 2, 3, 4].map((ratingValue) => {
                                        const rateData = ratingCounts.find(r => r.rating === ratingValue.toString()) || { count: 0, users: [] };
                                        const percentage = totalRatings > 0 ? (rateData.count / totalRatings) * 100 : 0;

                                        return (
                                            <div key={ratingValue} className="p-2 bg-[#121212] rounded-xl border border-[#242424] text-xs">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-neutral-300">{ratingValue}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-neutral-400 font-mono">{rateData.count}</span>
                                                        {rateData.count > 0 && (
                                                            <button
                                                                onClick={() => setSelectedCategory(selectedCategory === ratingValue ? null : ratingValue)}
                                                                className="text-neutral-500 hover:text-white"
                                                            >
                                                                {selectedCategory === ratingValue ? <FaTimes size={10} /> : <FaAngleDown size={10} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Visual bar */}
                                                <div className="w-full bg-[#1c1c1c] h-1.5 rounded-full overflow-hidden mt-1.5">
                                                    <div
                                                        className="h-full bg-neutral-400 rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>

                                                {selectedCategory === ratingValue && rateData.users?.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-[#222222] space-y-1">
                                                        {rateData.users.map(u => (
                                                            <div key={u.userId} className="text-[11px] text-neutral-400 flex items-center justify-between">
                                                                <span>{u.username}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {denyCount > 0 && (
                                    <div className="bg-[#241818] border border-[#442222] p-2.5 rounded-xl text-xs">
                                        <div className="flex justify-between items-center text-red-400 font-medium">
                                            <span>{denyCount} Denial{denyCount !== 1 ? 's' : ''}</span>
                                            <button onClick={() => setSelectedCategory(selectedCategory === 'deny' ? null : 'deny')}>
                                                {selectedCategory === 'deny' ? <FaTimes size={10} /> : <FaAngleDown size={10} />}
                                            </button>
                                        </div>
                                        {selectedCategory === 'deny' && denyData?.users && (
                                            <div className="mt-2 pt-2 border-t border-[#442222] space-y-1">
                                                {denyData.users.map(u => (
                                                    <div key={u.userId} className="text-[11px] text-neutral-300">{u.username}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Chat Tab - Proper Clean Chat Stream (Discord / YouTube Live style) */}
                    {activeTab === 'chat' && (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="flex flex-col h-[520px]"
                        >
                            {/* Message Stream */}
                            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#101010] select-text">
                                {chatLoading ? (
                                    <div className="flex justify-center items-center h-full">
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2a2a2a] border-t-[#f23030]" />
                                    </div>
                                ) : messages.length > 0 ? (
                                    messages.map((msg) => {
                                        const isOwnMessage = user && msg.userId === user._id;
                                        const avatarUrl = getUserAvatarUrl(msg.user, msg.profilePicture, 64);

                                        return (
                                            <div
                                                key={msg._id}
                                                id={`message-${msg._id}`}
                                                className="group flex items-start gap-2.5 hover:bg-white/[0.02] p-1.5 rounded-xl transition-colors"
                                            >
                                                {/* Author Avatar */}
                                                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-[#1e1e1e] border border-[#2e2e2e] mt-0.5">
                                                    <img
                                                        src={avatarUrl}
                                                        alt={msg.user}
                                                        onError={(e) => handleAvatarError(e, msg.user, 64)}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                {/* Message Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <span className="text-xs font-bold text-white truncate">
                                                                {msg.user}
                                                            </span>
                                                            <span className="text-[10px] text-neutral-500 font-mono">
                                                                {format(new Date(msg.timestamp))}
                                                            </span>
                                                        </div>

                                                        {(user?.roles?.includes('admin') || user?._id === msg.userId) && (
                                                            <button
                                                                onClick={() => handleDeleteMessage(msg._id)}
                                                                className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 p-1 transition-opacity"
                                                                title="Delete message"
                                                            >
                                                                <AiOutlineDelete size={13} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className={`mt-1 text-xs sm:text-sm leading-relaxed p-2.5 rounded-xl break-words ${
                                                        isOwnMessage
                                                            ? 'bg-[#242424] border border-[#363636] text-white'
                                                            : 'bg-[#1a1a1a] border border-[#262626] text-neutral-200'
                                                    }`}>
                                                        {msg.message}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-xs">
                                        <p>No messages yet in this clip.</p>
                                        <p className="text-neutral-600 mt-1">Start the team conversation!</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input - Fixed Bottom Bar without emoji package */}
                            <div className="p-3 border-t border-[#262626] bg-[#141414]">
                                <div className="flex items-end gap-2 bg-[#1b1b1b] border border-[#2c2c2c] focus-within:border-neutral-500 rounded-xl p-2 transition-colors">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        className="w-full bg-transparent resize-none text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none max-h-24 py-1 px-1"
                                        placeholder="Message team... (Enter to send)"
                                        rows={1}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim()}
                                        className={`p-2 rounded-lg transition-all shrink-0 ${
                                            newMessage.trim()
                                                ? 'bg-white text-black hover:bg-neutral-200 shadow-xs'
                                                : 'text-neutral-600 cursor-not-allowed'
                                        }`}
                                        title="Send message"
                                    >
                                        <AiOutlineSend size={15} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TeamSidebar;
