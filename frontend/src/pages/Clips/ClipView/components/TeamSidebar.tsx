import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaComments, FaAngleDown, FaTimes } from 'react-icons/fa';
import { AiOutlineSend, AiOutlineDelete } from 'react-icons/ai';
import { BiSmile } from 'react-icons/bi';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { format } from 'timeago.js';
import { IoMdInformationCircleOutline } from 'react-icons/io';

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
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
            const colors: Record<number, string> = {
                4: 'bg-red-500 text-white ring-2 ring-red-300',
                3: 'bg-orange-500 text-white ring-2 ring-orange-300',
                2: 'bg-yellow-600 text-white ring-2 ring-yellow-300',
                1: 'bg-green-600 text-white ring-2 ring-green-300',
            };
            return colors[rating] || 'bg-blue-500 text-white';
        }
        if (isUserStreamerOrSubmitter) {
            return 'bg-neutral-600 text-neutral-400 cursor-not-allowed';
        }
        return 'bg-neutral-700 text-white hover:bg-neutral-600';
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

    // Switch to chat tab when highlightedMessageId is provided (from notification)
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
                    // Add a highlight animation class
                    messageElement.classList.add('highlight-animation');
                    // Remove it after animation completes
                    setTimeout(() => {
                        messageElement.classList.remove('highlight-animation');
                    }, 2000);
                }, 500);
            }
        } else if (!highlightedMessageId) {
            // Only scroll to bottom if not highlighting a specific message
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
                message: newMessage,
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
        { id: 'rate' as TabType, label: 'Rate', icon: FaStar },
        { id: 'chat' as TabType, label: 'Chat', icon: FaComments }
    ];

    const isDisabled = isRatingLoading || isSubmitting || isUserStreamerOrSubmitter;

    return (
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-neutral-200/80 dark:border-neutral-700/50 overflow-hidden sticky top-20">
            {/* Tab Header */}
            <div className="flex border-b border-neutral-200/80 dark:border-neutral-700/50">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${activeTab === tab.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                            }`}
                    >
                        <tab.icon className="text-sm" />
                        {tab.label}
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-4"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <IoMdInformationCircleOutline className="text-white text-xl" />
                                </span>
                                <div>
                                    <h3 className="font-bold text-neutral-900 dark:text-white">Rate This Clip</h3>
                                    <p className="text-xs text-neutral-500">1 = Top Tier, 4 = Filler Material</p>
                                </div>
                            </div>

                            {isUserStreamerOrSubmitter && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4">
                                    <p className="text-amber-800 dark:text-amber-200 text-sm">
                                        ⚠️ You cannot rate your own clips.
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
                                            className={`flex items-center justify-center py-3 rounded-xl font-bold transition-all ${getButtonColors(rate, isSelected)} ${isSubmitting ? 'opacity-50' : ''}`}
                                        >
                                            <span className="text-xl">{rate}</span>
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => !isDisabled && rateOrDenyClip(null, true)}
                                    disabled={isDisabled}
                                    className={`flex items-center justify-center py-3 rounded-xl font-bold transition-all ${userCurrentRating === 'deny'
                                        ? 'bg-red-600 text-white ring-2 ring-red-300'
                                        : isUserStreamerOrSubmitter
                                            ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                                            : 'bg-neutral-700 text-white hover:bg-red-600'
                                        }`}
                                >
                                    <span className="text-xl"><FaTimes /></span>
                                </button>
                            </div>

                            {statsLoading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-neutral-300 border-t-blue-600"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-neutral-100/80 dark:bg-neutral-700/50 p-3 rounded-lg text-center border border-neutral-200/50 dark:border-neutral-600/30">
                                            <p className="text-xs text-neutral-500">Average</p>
                                            <div className={`text-2xl font-bold ${averageRating === 'N/A' ? 'text-neutral-400' :
                                                Number(averageRating) >= 4 ? 'text-red-500' :
                                                    Number(averageRating) >= 3 ? 'text-orange-500' :
                                                        Number(averageRating) >= 2 ? 'text-yellow-600' : 'text-green-600'
                                                }`}>
                                                {averageRating}
                                            </div>
                                        </div>
                                        <div className="bg-neutral-100/80 dark:bg-neutral-700/50 p-3 rounded-lg text-center border border-neutral-200/50 dark:border-neutral-600/30">
                                            <p className="text-xs text-neutral-500">Total</p>
                                            <div className="text-2xl font-bold text-blue-600">{totalRatings}</div>
                                        </div>
                                    </div>

                                    <div className="mb-4 space-y-2">
                                        {[1, 2, 3, 4].map(ratingValue => {
                                            const rateData = ratingCounts.find(r => Number(r.rating) === ratingValue) || { count: 0, users: [] };
                                            const percentage = totalRatings > 0 ? (rateData.count / totalRatings) * 100 : 0;
                                            const colors: Record<number, string> = { 4: 'bg-red-500', 3: 'bg-orange-500', 2: 'bg-yellow-600', 1: 'bg-green-600' };
                                            const textColors: Record<number, string> = { 4: 'text-red-500', 3: 'text-orange-500', 2: 'text-yellow-600', 1: 'text-green-600' };

                                            return (
                                                <div key={ratingValue} className="bg-neutral-100/80 dark:bg-neutral-700/50 rounded-lg p-2.5 border border-neutral-200/50 dark:border-neutral-600/30">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-bold ${textColors[ratingValue]}`}>{ratingValue}</span>
                                                            <div className="h-2 w-48 bg-neutral-300 dark:bg-neutral-600 rounded-full overflow-hidden">
                                                                <div className={`h-2 ${colors[ratingValue]}`} style={{ width: `${percentage}%` }} />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-neutral-500">{rateData.count}</span>
                                                            {rateData.count > 0 && (
                                                                <button onClick={() => setSelectedCategory(selectedCategory === ratingValue ? null : ratingValue)}>
                                                                    {selectedCategory === ratingValue ? <FaTimes className="text-neutral-400 text-xs" /> : <FaAngleDown className="text-neutral-400 text-xs" />}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {selectedCategory === ratingValue && rateData.users?.length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-600">
                                                            {rateData.users.map(u => (
                                                                <div key={u.userId} className="text-sm py-0.5 text-neutral-600 dark:text-neutral-300">{u.username}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {denyCount > 0 && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-red-600 dark:text-red-400">
                                                    {denyCount} Denial{denyCount !== 1 ? 's' : ''}
                                                </span>
                                                <button onClick={() => setSelectedCategory(selectedCategory === 'deny' ? null : 'deny')}>
                                                    {selectedCategory === 'deny' ? <FaTimes className="text-neutral-400" /> : <FaAngleDown className="text-neutral-400" />}
                                                </button>
                                            </div>
                                            {selectedCategory === 'deny' && denyData?.users && (
                                                <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                                                    {denyData.users.map(u => (
                                                        <div key={u.userId} className="text-sm py-0.5">{u.username}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* Chat Tab */}
                    {activeTab === 'chat' && (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col h-[500px]"
                        >
                            <div className="flex-1 overflow-y-auto p-4 bg-neutral-50/80 dark:bg-neutral-900/50">
                                {chatLoading ? (
                                    <div className="flex justify-center items-center h-full">
                                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-neutral-300 border-t-blue-600"></div>
                                    </div>
                                ) : messages.length > 0 ? (
                                    messages.map((msg) => {
                                        const isOwnMessage = user && msg.userId === user._id;
                                        return (
                                            <div key={msg._id} id={`message-${msg._id}`} className={`mb-4 flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <img
                                                        src={msg.profilePicture || `https://ui-avatars.com/api/?name=${msg.user}`}
                                                        alt={msg.user}
                                                        className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                                                    />
                                                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs text-neutral-500">{msg.user}</span>
                                                            <span className="text-xs text-neutral-400">{format(new Date(msg.timestamp))}</span>
                                                        </div>
                                                        <div className={`p-2.5 rounded-2xl text-sm ${isOwnMessage
                                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-tl-none'
                                                            }`}>
                                                            {msg.message}
                                                        </div>
                                                        {(user?.roles?.includes('admin') || user?._id === msg.userId) && (
                                                            <button
                                                                onClick={() => handleDeleteMessage(msg._id)}
                                                                className="text-neutral-400 hover:text-red-500 mt-1"
                                                            >
                                                                <AiOutlineDelete size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                                        <p>No messages yet</p>
                                        <p className="text-sm">Start the conversation!</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-3 border-t border-neutral-200/80 dark:border-neutral-700/50 bg-white/80 dark:bg-neutral-800/80">
                                <div className="relative">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        className="w-full p-2.5 pr-16 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Type a message..."
                                        rows={2}
                                    />
                                    <div className="absolute bottom-2 right-2 flex items-center gap-1">
                                        <button
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="text-neutral-400 hover:text-yellow-400 p-1"
                                        >
                                            <BiSmile size={20} />
                                        </button>
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim()}
                                            className={`p-1.5 rounded-full ${newMessage.trim()
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                                                }`}
                                        >
                                            <AiOutlineSend size={16} />
                                        </button>
                                    </div>
                                    {showEmojiPicker && (
                                        <div className="absolute bottom-12 right-0 z-10">
                                            <EmojiPicker onEmojiClick={(emojiData: EmojiClickData) => {
                                                setNewMessage((prev) => prev + emojiData.emoji);
                                                setShowEmojiPicker(false);
                                            }} />
                                        </div>
                                    )}
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
