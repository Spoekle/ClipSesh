'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Loader2, MessageSquare } from 'lucide-react';
import { format } from 'timeago.js';
import CommentReply from './CommentReply';
import { useNotification } from '@/context/AlertContext';
import { User, Clip, Reply } from '@/types/adminTypes';
import { useSearchParams } from 'next/navigation';
import { getClipById, addCommentToClip, deleteCommentFromClip } from '@/services/clipService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CommentItem {
  _id: string;
  username: string;
  comment: string;
  createdAt: string;
  replies?: Reply[];
}

interface CommentSectionProps {
  clipId: string;
  comments?: CommentItem[];
  user: User | null;
  fetchClipsAndRatings: (user: User | null) => Promise<void>;
  highlightedMessageId?: string | null;
  setHighlightedMessageId?: (id: string | null) => void;
  setPopout?: (popout: string) => void;
  isClipLoading?: boolean;
  setIsClipLoading?: (loading: boolean) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  clipId,
  user,
  fetchClipsAndRatings,
}) => {
  const [currentClip, setCurrentClip] = useState<Clip | null>(null);
  const [newComment, setNewComment] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { showSuccess, showError } = useNotification();
  const searchParams = useSearchParams();

  const highlightCommentId = searchParams?.get('highlightComment') ?? undefined;
  const highlightReplyId = searchParams?.get('highlightReply') ?? undefined;

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
  }, [clipId]);

  const handleAddComment = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsLoading(true);
      const updatedClip = await addCommentToClip(clipId, newComment);
      setCurrentClip(updatedClip);
      setNewComment('');
      showSuccess('Comment added successfully!');

      if (fetchClipsAndRatings && user) {
        await fetchClipsAndRatings(user);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      showError('Failed to add comment: ' + msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string): Promise<void> => {
    try {
      const updatedClip = await deleteCommentFromClip(clipId, commentId);
      setCurrentClip(updatedClip);
      showSuccess('Comment deleted successfully!');

      if (fetchClipsAndRatings && user) {
        await fetchClipsAndRatings(user);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      showError('Error deleting comment: ' + msg);
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
      <Card className="mt-6 p-6 mb-16 sm:mb-6 bg-card border-border">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded-lg mb-4 w-1/4" />
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded-lg" />
            <div className="h-4 bg-muted rounded-lg w-3/4" />
          </div>
        </div>
      </Card>
    );
  }

  const isLoggedIn = Boolean(user);
  const clipComments: CommentItem[] = (currentClip.comments as CommentItem[]) || [];

  return (
    <Card className="mt-6 p-5 sm:p-6 mb-16 sm:mb-6 text-foreground bg-card border-border">
      <h3 className="text-lg sm:text-xl font-bold text-foreground mb-5 flex items-center gap-2.5">
        <span>Comments</span>
        {clipComments.length > 0 && (
          <Badge variant="outline" className="text-xs font-semibold">
            {clipComments.length}
          </Badge>
        )}
      </h3>

      {/* Add comment form for logged in users */}
      {isLoggedIn ? (
        <form className="mb-6" onSubmit={handleAddComment}>
          <div className="bg-background rounded-xl p-3.5 border border-border focus-within:border-border/80 transition-colors">
            <Textarea
              placeholder="Add a comment..."
              className="w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground/60 text-sm focus-visible:ring-0 focus-visible:border-transparent border-0 p-1 min-h-[60px]"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              maxLength={300}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/60">
              <p
                className={`text-xs ${
                  newComment.length === 300
                    ? 'text-primary font-semibold animate-pulse'
                    : 'text-muted-foreground'
                }`}
              >
                {newComment.length}/300
              </p>
              <div className="flex items-center gap-2">
                {newComment.trim() && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setNewComment('')}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="default"
                  size="xs"
                  disabled={!newComment.trim() || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-3 animate-spin mr-1" />
                      Posting...
                    </>
                  ) : (
                    'Comment'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-background rounded-xl border border-border text-center">
          <p className="text-muted-foreground text-xs sm:text-sm">
            You must be logged in to add a comment.
          </p>
        </div>
      )}

      {/* Comments display */}
      <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
        {clipComments.length > 0 ? (
          <AnimatePresence>
            {clipComments
              .slice()
              .reverse()
              .map((comment, index) => (
                <motion.div
                  key={comment._id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 bg-background rounded-xl border transition-all ${
                    comment._id === highlightCommentId
                      ? 'border-primary ring-1 ring-primary/30'
                      : 'border-border'
                  }`}
                  id={comment._id}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-foreground font-semibold text-xs shrink-0">
                        {comment.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-xs sm:text-sm">
                            @{comment.username || 'Anonymous'}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(comment.createdAt))}
                          </span>
                        </div>
                        <p className="mt-1 text-foreground/90 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                          {comment.comment}
                        </p>
                      </div>
                    </div>
                    {user &&
                      (user.username === comment.username ||
                        user.roles?.includes('admin')) && (
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-primary transition p-1 cursor-pointer"
                          onClick={() => handleDeleteComment(comment._id)}
                          title="Delete comment"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                  </div>
                  <div className="mt-2 pl-11">
                    {user && (
                      <CommentReply
                        clipId={clipId}
                        commentId={comment._id}
                        user={user}
                        onReplyAdded={handleReplyAdded}
                        replies={comment.replies || []}
                        highlightReplyId={highlightReplyId}
                      />
                    )}
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="size-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CommentSection;
