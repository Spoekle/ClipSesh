import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineDelete } from 'react-icons/ai';
import { format } from 'timeago.js';
import CommentReply from './CommentReply';
import { useNotification } from '../../../../context/AlertContext';
import { User, Clip } from '../../../../types/adminTypes';
import { useLocation } from 'react-router-dom';
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
            <div className="mt-6 bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 mb-16 sm:mb-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
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
            className="mt-6 bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 mb-16 sm:mb-6"
        >
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center">
                Comments
                {currentClip.comments && currentClip.comments.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-sm rounded-full">
                        {currentClip.comments.length}
                    </span>
                )}
            </h3>

            {/* Add comment form for logged in users */}
            {isLoggedIn ? (
                <form className="mb-8" onSubmit={handleAddComment}>
                    <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                        <textarea
                            placeholder="Write your comment here..."
                            className="w-full p-3 bg-white dark:bg-neutral-600 text-neutral-900 dark:text-white rounded-lg border border-neutral-300 dark:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                            maxLength={300}
                            disabled={isLoading}
                        ></textarea>
                        <div className="flex justify-between items-center mt-3">
                            <p className={`text-sm ${newComment.length === 300 ? 'text-red-500 animate-pulse' : 'text-gray-500 dark:text-gray-400'}`}>
                                {newComment.length}/300
                            </p>
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow transition transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!newComment.trim() || isLoading}
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : null}
                                Post Comment
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="mb-8 p-4 bg-neutral-100 dark:bg-neutral-700 rounded-lg text-center">
                    <p className="text-neutral-700 dark:text-neutral-300">
                        You must be logged in to add a comment.
                    </p>
                </div>
            )}

            {/* Comments display */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {currentClip.comments && currentClip.comments.length > 0 ? (
                    <AnimatePresence>
                        {currentClip.comments.slice().reverse().map((comment: any, index: number) => (
                            <motion.div
                                key={comment._id || index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg border ${comment._id === highlightCommentId
                                    ? 'border-yellow-500 dark:border-yellow-500 animate-pulse'
                                    : 'border-neutral-200 dark:border-neutral-600'
                                    }`}
                                id={comment._id}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-lg">
                                            {comment.username?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-neutral-900 dark:text-white">
                                                {comment.username || 'Anonymous'}
                                            </p>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {format(new Date(comment.createdAt))}
                                            </span>
                                        </div>
                                    </div>
                                    {user && (user.username === comment.username || user.roles.includes('admin')) && (
                                        <button
                                            className="text-neutral-400 hover:text-red-500 transition"
                                            onClick={() => handleDeleteComment(comment._id)}
                                            title="Delete comment"
                                        >
                                            <AiOutlineDelete size={20} />
                                        </button>
                                    )}
                                </div>
                                <div className="mt-3 pl-12">
                                    <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                                        {comment.comment}
                                    </p>

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
                        <p className="text-neutral-500 dark:text-neutral-400">
                            No comments yet. Be the first to share your thoughts!
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default CommentSection;
