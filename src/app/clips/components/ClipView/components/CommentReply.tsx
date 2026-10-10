'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaReply, FaTrash, FaAngleDown, FaAngleUp } from 'react-icons/fa';
import { format } from 'timeago.js';
import { useNotification } from '@/context/AlertContext';
import { User, Clip, Reply } from '@/types/adminTypes';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { addReplyToComment, deleteReplyFromComment } from '@/services/clipService';
import { Button } from '@/components/Button';

interface CommentReplyProps {
  clipId: string;
  commentId: string;
  user: User;
  onReplyAdded: (updatedClip: Clip) => void;
  replies: Reply[];
  highlightReplyId?: string;
}

export const CommentReply: React.FC<CommentReplyProps> = ({
  clipId,
  commentId,
  user,
  onReplyAdded,
  replies = [],
  highlightReplyId,
}) => {
  const [showReplyInput, setShowReplyInput] = useState<boolean>(false);
  const [showReplies, setShowReplies] = useState<boolean>(replies.length > 0);
  const [replyContent, setReplyContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [replyToDelete, setReplyToDelete] = useState<string | null>(null);

  const { showSuccess, showError } = useNotification();

  const handleSubmitReply = async (e: React.FormEvent) => {
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
    } catch (error) {
      console.error('Error submitting reply:', error);
      const msg = error instanceof Error ? error.message : 'Failed to add reply';
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteReply = async (replyId: string) => {
    try {
      const updatedClip = await deleteReplyFromComment(clipId, commentId, replyId);
      onReplyAdded(updatedClip);
      showSuccess('Reply deleted');
    } catch (error) {
      console.error('Error deleting reply:', error);
      const msg = error instanceof Error ? error.message : 'Failed to delete reply';
      showError(msg);
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
          type="button"
          onClick={() => setShowReplyInput(true)}
          className="text-sm text-primary hover:text-primary/90 flex items-center gap-1 mt-1 font-medium transition-colors cursor-pointer"
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
            <div className="border-l-2 border-border pl-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full p-2.5 bg-cc-card rounded-lg border border-border text-foreground placeholder-muted-foreground/60 text-xs sm:text-sm focus:outline-none focus:border-border/80"
                placeholder="Write your reply..."
                rows={2}
                maxLength={200}
              />

              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">
                  {replyContent.length}/200
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="card"
                    size="xs"
                    pill
                    onClick={() => setShowReplyInput(false)}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="xs"
                    pill
                    disabled={!replyContent.trim() || isSubmitting}
                    isLoading={isSubmitting}
                  >
                    {isSubmitting ? 'Replying...' : 'Reply'}
                  </Button>
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
            type="button"
            onClick={() => setShowReplies(!showReplies)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
          >
            {showReplies ? <FaAngleUp size={12} /> : <FaAngleDown size={12} />}
            <span>
              {showReplies ? 'Hide' : 'Show'} {replies.length}{' '}
              {replies.length === 1 ? 'reply' : 'replies'}
            </span>
          </button>

          <AnimatePresence>
            {showReplies && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2.5 space-y-2.5"
              >
                {replies.map((reply) => (
                  <motion.div
                    key={reply._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border-l-2 pl-3 py-1 ${
                      reply._id === highlightReplyId
                        ? 'border-primary bg-primary/10 rounded-r-lg'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">
                          @{reply.username}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {format(new Date(reply.createdAt))}
                        </span>
                      </div>

                      {(user.username === reply.username || user.roles?.includes('admin')) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(reply._id)}
                          className="text-muted-foreground hover:text-primary transition p-1 cursor-pointer"
                          title="Delete reply"
                        >
                          <FaTrash size={11} />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-foreground/90 mt-1 whitespace-pre-wrap leading-relaxed">
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
