import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaReply, FaTrash, FaAngleDown, FaAngleUp } from 'react-icons/fa';
import { format } from 'timeago.js';
import { useNotification } from '../../../../context/AlertContext';
import { User, Clip, Reply } from '../../../../types/adminTypes';
import ConfirmationDialog from '../../../../components/common/ConfirmationDialog';
import { addReplyToComment, deleteReplyFromComment } from '../../../../services/clipService';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [replyToDelete, setReplyToDelete] = useState<string | null>(null);
  
  const { showSuccess, showError } = useNotification();  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const updatedClip = await addReplyToComment(clipId, commentId, replyContent);
      
      setReplyContent('');
      setShowReplyInput(false);
      setShowReplies(true);
      
      onReplyAdded(updatedClip);
      showSuccess('Reply added successfully');
      
    } catch (error: any) {
      console.error('Error submitting reply:', error);
      showError(error.response?.data?.message || 'Failed to add reply');
    } finally {
      setIsSubmitting(false);
    }
  };
  const deleteReply = async (replyId: string) => {
    try {
      const updatedClip = await deleteReplyFromComment(clipId, commentId, replyId);
      onReplyAdded(updatedClip);
      showSuccess('Reply deleted');
    } catch (error: any) {
      console.error('Error deleting reply:', error);
      showError(error.response?.data?.message || 'Failed to delete reply');
    }
  };

  const handleDeleteClick = (replyId: string) => {
    setReplyToDelete(replyId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (replyToDelete) {
      deleteReply(replyToDelete);
    }
    setShowDeleteConfirm(false);
    setReplyToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setReplyToDelete(null);
  };

  return (
    <div className="mt-4">
      {/* Reply button */}
      {!showReplyInput && (
        <button
          onClick={() => setShowReplyInput(true)}
          className="text-sm text-[#f23030] hover:text-[#d92626] flex items-center gap-1 mt-1 font-medium transition-colors"
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
            <div className="border-l-2 border-[#262626] pl-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full p-2.5 bg-[#181818] rounded-lg border border-[#262626] text-[#f1f1f1] placeholder-[#717171] text-xs sm:text-sm focus:outline-none focus:border-[#3a3a3a]"
                placeholder="Write your reply..."
                rows={2}
                maxLength={200}
              ></textarea>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-[#717171]">
                  {replyContent.length}/200
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReplyInput(false)}
                    className="px-3 py-1 text-xs rounded-full bg-[#202020] hover:bg-[#262626] text-[#aaaaaa] hover:text-[#f1f1f1] transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={!replyContent.trim() || isSubmitting}
                    className="px-3.5 py-1 text-xs rounded-full bg-[#f23030] hover:bg-[#d92626] text-white disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {isSubmitting ? 'Replying...' : 'Reply'}
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
            className="text-xs text-[#aaaaaa] hover:text-[#f1f1f1] flex items-center gap-1.5 transition-colors font-medium"
          >
            {showReplies ? <FaAngleUp size={12} /> : <FaAngleDown size={12} />}
            <span>{showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
          </button>
          
          <AnimatePresence>
            {showReplies && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2.5 space-y-2.5"
              >
                {replies.map(reply => (
                  <motion.div
                    key={reply._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border-l-2 pl-3 py-1 ${
                      reply._id === highlightReplyId 
                        ? 'border-[#f23030] bg-[#f23030]/10 rounded-r-lg' 
                        : 'border-[#262626]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#f1f1f1]">
                          @{reply.username}
                        </span>
                        <span className="text-[11px] text-[#717171]">
                          {format(new Date(reply.createdAt))}
                        </span>
                      </div>
                      
                      {(user.username === reply.username || user.roles.includes('admin')) && (
                        <button
                          onClick={() => handleDeleteClick(reply._id)}
                          className="text-[#717171] hover:text-[#f23030] transition p-1"
                          title="Delete reply"
                        >
                          <FaTrash size={11} />
                        </button>
                      )}
                    </div>
                    
                    <p className="text-xs text-[#d4d4d4] mt-1 whitespace-pre-wrap leading-relaxed">
                      {reply.content}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Reply"
        message="Are you sure you want to delete this reply? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default CommentReply;
