import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaReply, FaTrash, FaAngleDown, FaAngleUp } from 'react-icons/fa';
import { format } from 'timeago.js';
import apiUrl from '../../../../config/config';
import { useNotification } from '../../../../context/NotificationContext';
import { User, Clip, Reply } from '../../../../types/adminTypes';

interface CommentReplyProps {
  clipId: string;
  commentId: string;
  user: User;
  onReplyAdded: (updatedClip: Clip) => void;
  replies: Reply[];
  highlightReplyId?: string;
}

const CommentReply: React.FC<CommentReplyProps> = ({
  clipId,
  commentId,
  user,
  onReplyAdded,
  replies = [],
  highlightReplyId
}) => {
  const [showReplyInput, setShowReplyInput] = useState<boolean>(false);
  const [showReplies, setShowReplies] = useState<boolean>(replies.length > 0);
  const [replyContent, setReplyContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const { showSuccess, showError } = useNotification();

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post<Clip>(
        `${apiUrl}/api/clips/${clipId}/comment/${commentId}/reply`,
        { 
          replyText: replyContent, // Changed from 'content' to 'replyText' to match backend schema
          userId: user._id,
          username: user.username
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setReplyContent('');
      setShowReplyInput(false);
      setShowReplies(true);
      
      onReplyAdded(response.data);
      showSuccess('Reply added successfully');
      
    } catch (error: any) {
      console.error('Error submitting reply:', error);
      showError(error.response?.data?.message || 'Failed to add reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteReply = async (replyId: string) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete<Clip>(
        `${apiUrl}/api/clips/${clipId}/comment/${commentId}/reply/${replyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onReplyAdded(response.data);
      showSuccess('Reply deleted');
    } catch (error: any) {
      console.error('Error deleting reply:', error);
      showError(error.response?.data?.message || 'Failed to delete reply');
    }
  };

  return (
    <div className="mt-4">
      {/* Reply button */}
      {!showReplyInput && (
        <button
          onClick={() => setShowReplyInput(true)}
          className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 mt-1"
        >
          <FaReply size={12} /> Reply
        </button>
      )}
      
      {/* Reply form */}
      <AnimatePresence>
        {showReplyInput && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
            onSubmit={handleSubmitReply}
          >
            <div className="border-l-2 border-neutral-300 dark:border-neutral-600 pl-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full p-2 bg-neutral-100 dark:bg-neutral-600 rounded-md border border-neutral-300 dark:border-neutral-500 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Write your reply..."
                rows={2}
                maxLength={200}
              ></textarea>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {replyContent.length}/200
                </span>
                
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowReplyInput(false)}
                    className="px-3 py-1 text-sm rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={!replyContent.trim() || isSubmitting}
                    className="px-3 py-1 text-sm rounded-md bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Reply'}
                  </button>
                </div>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
      
      {/* Replies section */}
      {replies.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1"
          >
            {showReplies ? <FaAngleUp size={14} /> : <FaAngleDown size={14} />}
            {showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </button>
          
          <AnimatePresence>
            {showReplies && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-3"
              >
                {replies.map(reply => (
                  <motion.div
                    key={reply._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border-l-2 pl-3 ${
                      reply._id === highlightReplyId 
                        ? 'border-yellow-500 bg-yellow-50/20 dark:bg-yellow-900/10' 
                        : 'border-neutral-300 dark:border-neutral-600'
                    }`}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm text-neutral-900 dark:text-white">
                          {reply.username}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {format(new Date(reply.createdAt))}
                        </span>
                      </div>
                      
                      {(user.username === reply.username || user.roles.includes('admin')) && (
                        <button
                          onClick={() => deleteReply(reply._id)}
                          className="text-neutral-400 hover:text-red-500 transition"
                          title="Delete reply"
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                    
                    <p className="text-sm text-neutral-800 dark:text-neutral-200 mt-1 whitespace-pre-wrap">
                      {reply.content}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CommentReply;
