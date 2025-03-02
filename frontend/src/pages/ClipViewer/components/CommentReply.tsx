import React, { useState } from 'react';
import { FaReply, FaTrash, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';
import apiUrl from '../../../config/config';
import { useNotification } from '../../../context/NotificationContext';
import { format } from 'timeago.js';
import { Clip, Reply, User } from '../../../types/adminTypes';

interface CommentReplyProps {
  clipId: string;
  commentId: string;
  user: User | null;
  onReplyAdded: (updatedClip: Clip) => void;
  replies: Reply[];
  highlightReplyId?: string;
}

const CommentReply: React.FC<CommentReplyProps> = ({ 
  clipId, 
  commentId, 
  user, 
  onReplyAdded,
  replies,
  highlightReplyId
}) => {
  const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { showSuccess, showError } = useNotification();

  const handleSubmitReply = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!replyText.trim()) {
      return;
    }
    
    if (!user) {
      showError('You must be logged in to reply');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      showError('Authentication error. Please login again.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await axios.post<Clip>(
        `${apiUrl}/api/clips/${clipId}/comment/${commentId}/reply`,
        { replyText: replyText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showSuccess('Reply added successfully');
      setReplyText('');
      setShowReplyForm(false);
      onReplyAdded(response.data);
    } catch (error: any) {
      showError('Failed to add reply: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteReply = async (replyId: string): Promise<void> => {
    if (!user) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    if (window.confirm('Are you sure you want to delete this reply?')) {
      try {
        setIsSubmitting(true);
        const response = await axios.delete<Clip>(
          `${apiUrl}/api/clips/${clipId}/comment/${commentId}/reply/${replyId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        showSuccess('Reply deleted successfully');
        onReplyAdded(response.data);
      } catch (error: any) {
        showError('Failed to delete reply: ' + (error.response?.data?.message || 'Unknown error'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="mt-3 space-y-3">
      {/* Reply Button */}
      {user && !showReplyForm && (
        <button
          onClick={() => setShowReplyForm(true)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
        >
          <FaReply className="mr-1" size={12} />
          Reply
        </button>
      )}
      
      {/* Reply Form */}
      {showReplyForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-neutral-100 dark:bg-neutral-700 p-3 rounded-lg mb-3"
        >
          <form onSubmit={handleSubmitReply}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Reply as {user?.username}
              </label>
              <button
                type="button"
                onClick={() => setShowReplyForm(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                <FaTimes size={14} />
              </button>
            </div>
            
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply..."
              className="w-full p-2 bg-white dark:bg-neutral-600 text-neutral-900 dark:text-white rounded border border-neutral-300 dark:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={2}
              maxLength={500}
              disabled={isSubmitting}
            />
            
            <div className="flex justify-between items-center mt-2">
              <span className={`text-xs ${replyText.length >= 450 ? "text-red-500" : "text-neutral-500 dark:text-neutral-400"}`}>
                {replyText.length}/500
              </span>
              
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="px-3 py-1 text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-600 rounded hover:bg-neutral-300 dark:hover:bg-neutral-500 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !replyText.trim()}
                >
                  {isSubmitting ? "Submitting..." : "Post Reply"}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      )}
      
      {/* Replies List */}
      {replies.length > 0 && (
        <div className="pl-4 border-l-2 border-neutral-200 dark:border-neutral-700 space-y-3">
          {replies.map((reply) => (
            <motion.div
              key={reply._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-3 rounded-lg ${
                reply._id === highlightReplyId
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 animate-pulse'
                  : 'bg-neutral-100 dark:bg-neutral-700'
              }`}
              id={reply._id}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-xs mr-2">
                    {reply.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-neutral-900 dark:text-white">
                      {reply.username}
                    </p>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {format(new Date(reply.createdAt))}
                    </span>
                  </div>
                </div>
                
                {/* Delete button (for reply owner or admin) */}
                {user && (user.username === reply.username || user.roles.includes('admin')) && (
                  <button
                    onClick={() => handleDeleteReply(reply._id)}
                    className="text-neutral-400 hover:text-red-500 transition"
                    disabled={isSubmitting}
                  >
                    <FaTrash size={12} />
                  </button>
                )}
              </div>
              
              <div className="mt-2">
                <p className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                  {reply.replyText}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentReply;
