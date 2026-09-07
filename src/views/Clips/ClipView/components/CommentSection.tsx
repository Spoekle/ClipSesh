import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineDelete } from 'react-icons/ai';
import { format } from 'timeago.js';
import CommentReply from './CommentReply';
import { useNotification } from '../../../../context/AlertContext';
import { User, Clip } from '../../../../types/adminTypes';
import { useLocation } from '@/lib/routerCompat';
import { getClipById, addCommentToClip, deleteCommentFromClip } from '../../../../services/clipService';

interface CommentSectionProps {
    clipId: string;
    comments: any[];
    user: User | null;
    fetchClipsAndRatings: (user: User | null) => Promise<void>;
    highlightedMessageId?: string | null;
    setHighlightedMessageId: (id: string | null) => void;
    setPopout: (popout: string) => void;
    isClipLoading: boolean;
    setIsClipLoading: (loading: boolean) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
    clipId,
    user,
    fetchClipsAndRatings
}) => {
    const [currentClip, setCurrentClip] = useState<Clip | null>(null);
    const [newComment, setNewComment] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { showSuccess, showError } = useNotification();
    const location = useLocation();
    
    const highlightCommentId = location.state?.highlightComment;    // Fetch the current clip data
    useEffect(() => {
        const fetchClip = async () => {
            try {
                const clipData = await getClipById(clipId);
                setCurrentClip(clipData);
            } catch (error) {
                console.error('Error fetching clip:', error);
            }
        };

        if (clipId) {
            fetchClip();
        }
    }, [clipId]);    const handleAddComment = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setIsLoading(true);
            const updatedClip = await addCommentToClip(clipId, newComment);
            setCurrentClip(updatedClip);
            setNewComment('');
            showSuccess('Comment added successfully!');
            
            // Refresh the parent component's data if needed
            if (fetchClipsAndRatings && user) {
                await fetchClipsAndRatings(user);
            }
        } catch (error: any) {
            showError('Failed to add comment: ' + (error.message || 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };    const handleDeleteComment = async (commentId: string): Promise<void> => {
        try {
            const updatedClip = await deleteCommentFromClip(clipId, commentId);
            setCurrentClip(updatedClip);

            showSuccess('Comment deleted successfully!');
            
            // Refresh the parent component's data if needed
            if (fetchClipsAndRatings && user) {
                await fetchClipsAndRatings(user);
            }
        } catch (error: any) {
            showError('Error deleting comment: ' + (error.message || 'Unknown error'));
        }
    };

    const handleReplyAdded = (updatedClip: Clip) => {
        setCurrentClip(updatedClip);
        if (fetchClipsAndRatings && user) {
            fetchClipsAndRatings(user);
        }
    };

    if (!currentClip) {
        return (
            <div className="mt-6 bg-[#181818] rounded-xl border border-[#262626] p-6 mb-16 sm:mb-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-[#262626] rounded-lg mb-4 w-1/4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-[#262626] rounded-lg"></div>
                        <div className="h-4 bg-[#262626] rounded-lg w-3/4"></div>
                    </div>
                </div>
            </div>
        );
    }

    const isLoggedIn = !!user;

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-[#181818] rounded-xl border border-[#262626] p-5 sm:p-6 mb-16 sm:mb-6 text-[#f1f1f1]"
        >
            <h3 className="text-lg sm:text-xl font-bold text-[#f1f1f1] mb-5 flex items-center gap-2.5">
                <span>Comments</span>
                {currentClip.comments && currentClip.comments.length > 0 && (
                    <span className="px-2.5 py-0.5 bg-[#262626] text-[#aaaaaa] text-xs font-semibold rounded-full border border-[#333333]">
                        {currentClip.comments.length}
                    </span>
                )}
            </h3>

            {/* Add comment form for logged in users */}
            {isLoggedIn ? (
                <form className="mb-6" onSubmit={handleAddComment}>
                    <div className="bg-[#141414] rounded-xl p-3.5 border border-[#262626] focus-within:border-[#3a3a3a] transition-colors">
                        <textarea
                            placeholder="Add a comment..."
                            className="w-full p-2.5 rounded-lg resize-none bg-transparent text-[#f1f1f1] placeholder-[#717171] text-sm focus:outline-none focus:ring-0 border-0"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                            maxLength={300}
                            disabled={isLoading}
                        ></textarea>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#202020]">
                            <p className={`text-xs ${newComment.length === 300 ? 'text-[#f23030] font-semibold animate-pulse' : 'text-[#717171]'}`}>
                                {newComment.length}/300
                            </p>
                            <div className="flex items-center gap-2">
                                {newComment.trim() && (
                                    <button
                                        type="button"
                                        onClick={() => setNewComment('')}
                                        className="px-3 py-1.5 text-xs text-[#aaaaaa] hover:text-[#f1f1f1] rounded-full hover:bg-[#202020] transition-colors"
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#f23030] hover:bg-[#d92626] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                                    disabled={!newComment.trim() || isLoading}
                                >
                                    {isLoading ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : null}
                                    <span>Comment</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="mb-6 p-4 bg-[#141414] rounded-xl border border-[#262626] text-center">
                    <p className="text-[#aaaaaa] text-xs sm:text-sm">
                        You must be logged in to add a comment.
                    </p>
                </div>
            )}

            {/* Comments display */}
            <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                {currentClip.comments && currentClip.comments.length > 0 ? (
                    <AnimatePresence>
                        {currentClip.comments.slice().reverse().map((comment: any, index: number) => (
                            <motion.div
                                key={comment._id || index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`p-4 bg-[#141414] rounded-xl border transition-all ${comment._id === highlightCommentId
                                    ? 'border-[#f23030] ring-1 ring-[#f23030]/30'
                                    : 'border-[#262626]'
                                    }`}
                                id={comment._id}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#242424] border border-[#333333] flex items-center justify-center text-[#f1f1f1] font-semibold text-xs shrink-0">
                                            {comment.username?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-[#f1f1f1] text-xs sm:text-sm">
                                                    @{comment.username || 'Anonymous'}
                                                </span>
                                                <span className="text-[11px] text-[#717171]">
                                                    {format(new Date(comment.createdAt))}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-[#d4d4d4] text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                                                {comment.comment}
                                            </p>
                                        </div>
                                    </div>
                                    {user && (user.username === comment.username || user.roles.includes('admin')) && (
                                        <button
                                            className="text-[#717171] hover:text-[#f23030] transition p-1"
                                            onClick={() => handleDeleteComment(comment._id)}
                                            title="Delete comment"
                                        >
                                            <AiOutlineDelete size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="mt-2 pl-11">
                                    {/* Add the CommentReply component here */}
                                    {user && (
                                        <CommentReply
                                            clipId={clipId}
                                            commentId={comment._id}
                                            user={user}
                                            onReplyAdded={handleReplyAdded}
                                            replies={comment.replies || []}
                                            highlightReplyId={location.state?.highlightReply}
                                        />
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-[#717171] text-sm">
                            No comments yet. Be the first to share your thoughts!
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default CommentSection;
