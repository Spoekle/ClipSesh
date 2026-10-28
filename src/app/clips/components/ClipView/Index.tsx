'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import CustomPlayer from './components/CustomPlayer';
import { useNotification } from '@/context/AlertContext';
import { Clip, User, Rating } from '@/types/adminTypes';
import RatingPanel from './components/clipteam/RatingPanel';
import CommentSection from './components/CommentSection';
import TeamSidebar from './components/TeamSidebar';
import { BreadcrumbItem } from '@/components/common/Breadcrumbs';
import ClipViewHeader from './components/ClipViewHeader';
import ClipAdjacentNav from './components/ClipAdjacentNav';
import ClipQueueSidebar from './components/ClipQueueSidebar';
import ClipDetails from './components/ClipDetails';
import ClipModalsContainer from './components/ClipModalsContainer';
import useClipNavigation from './hooks/useClipNavigation';

import {
  useClip,
  useClipVoteStatus,
  useVoteOnClip,
  useDeleteClip,
  useRecordClipView,
} from '@/hooks/useClips';

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

const ClipContent: React.FC<ClipContentProps> = ({
  clip,
  setExpandedClip,
  user = null,
  fetchClipsAndRatings = async () => {},
  ratings = {},
  fromContext,
}) => {
  const { clipId } = useParams<{ clipId: string }>();
  const currentClipId = clipId || clip._id;

  const { data: currentClip, isLoading: isClipLoading } = useClip(currentClipId);
  const { data: voteStatus } = useClipVoteStatus(currentClipId);

  const {
    nextClip,
    prevClip,
    loadingAdjacentClips,
    navigateToClip,
    closeExpandedClip,
    from,
  } = useClipNavigation({
    currentClipId,
    user,
    setExpandedClip,
    fromContext,
    isClipLoading,
  });

  const voteOnClipMutation = useVoteOnClip();
  const deleteClipMutation = useDeleteClip();
  const recordClipViewMutation = useRecordClipView();

  useEffect(() => {
    if (currentClipId && currentClipId !== 'new') {
      recordClipViewMutation.mutate(currentClipId);
    }
  }, [currentClipId]);

  const [popout, setPopout] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const clipData = currentClip || clip;
  const shareUrl = typeof window !== 'undefined' && clipData ? `${window.location.origin}/clips/${clipData._id}` : '';
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (clipData) {
      document.title = `${clipData.streamer} | ${clipData.title}`;
    }
  }, [clipData]);

  if (!clipData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cc-ground">
        <div className="animate-spin rounded-full h-14 w-14 border-2 border-t-transparent border-primary" />
      </div>
    );
  }

  const userVote = voteStatus?.hasVoted ? voteStatus.voteType : null;

  const handleVote = async (voteType: 'upvote' | 'downvote'): Promise<void> => {
    if (!clipData?._id) return;
    try {
      await voteOnClipMutation.mutateAsync({ clipId: clipData._id, voteType });
      showSuccess(userVote === voteType ? 'Vote removed!' : `Clip ${voteType}d successfully!`);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      showError(`Error ${voteType}ing clip: ${errorObj?.response?.data?.message || 'Unknown error'}`);
    }
  };

  const handleDeleteClip = async (): Promise<void> => {
    if (!clipData?._id) return;
    try {
      setIsLoading(true);
      await deleteClipMutation.mutateAsync(clipData._id);
      showSuccess('Clip deleted successfully!');
      closeExpandedClip();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      showError('Error deleting clip: ' + (errorObj?.response?.data?.message || 'Unknown error'));
      setIsLoading(false);
    }
  };

  const canReportClip = Boolean(user && (user.roles?.includes('admin') || user.roles?.includes('clipteam') || user.roles?.includes('editor')));
  const isTeamMember = Boolean(user && (user.roles?.includes('admin') || user.roles?.includes('clipteam') || user.roles?.includes('editor') || user.roles?.includes('uploader')));

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', path: '/', icon: <Home className="size-3.5" /> },
    {
      label: from.label,
      path: from.pathname + from.search,
      onClick: () => {
        if (setExpandedClip) setExpandedClip(null);
      },
    },
    { label: clipData.title },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col min-h-screen bg-cc-ground text-cc-text"
    >
      <ClipViewHeader
        onBack={closeExpandedClip}
        backTitle={from.label === 'Archive' ? 'Back to archive' : 'Back to clips'}
        breadcrumbItems={breadcrumbItems}
        shareUrl={shareUrl}
        onCopyShareLink={() => showSuccess('Share link copied to clipboard!')}
        canReportClip={canReportClip}
        onReport={() => setIsReportModalOpen(true)}
        user={user}
        isLoading={isLoading}
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      <ClipAdjacentNav
        prevClip={prevClip}
        nextClip={nextClip}
        onNavigate={navigateToClip}
        isLoading={loadingAdjacentClips || isClipLoading}
      />

      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-border">
            <CustomPlayer currentClip={clipData} />
          </div>

          <ClipDetails
            clipData={clipData}
            userVote={userVote || null}
            onUpvote={() => handleVote('upvote')}
            onDownvote={() => handleVote('downvote')}
            shareUrl={shareUrl}
            onCopyShareLink={() => showSuccess('Share link copied to clipboard!')}
            isLoading={isLoading}
          />

          {user && (!isTeamMember || typeof window !== 'undefined') && (
            <div className={isTeamMember ? 'lg:hidden mt-4' : 'mt-4'}>
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

        <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col gap-5">
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

          <ClipQueueSidebar
            nextClip={nextClip}
            prevClip={prevClip}
            onNavigate={navigateToClip}
            isLoading={loadingAdjacentClips || isClipLoading}
          />
        </div>
      </div>

      <ClipModalsContainer
        clipData={clipData}
        user={user}
        ratings={ratings}
        fetchClipsAndRatings={fetchClipsAndRatings}
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        isReportModalOpen={isReportModalOpen}
        setIsReportModalOpen={setIsReportModalOpen}
        showDeleteConfirm={showDeleteConfirm}
        onConfirmDelete={handleDeleteClip}
        onCancelDelete={() => setShowDeleteConfirm(false)}
        popout={popout}
        setPopout={setPopout}
        highlightedMessageId={highlightedMessageId}
        setHighlightedMessageId={setHighlightedMessageId}
      />
    </motion.div>
  );
};

export default ClipContent;
