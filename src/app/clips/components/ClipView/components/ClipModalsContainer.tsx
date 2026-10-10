'use client';

import React from 'react';
import EditModal from './EditClipModal';
import ReportModal from './ReportModal';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import MessageComponent from './clipteam/MessagesPopup';
import RatingsComponent from './clipteam/RatingsPopup';
import { Clip, User, Rating } from '@/types/adminTypes';

interface ClipModalsContainerProps {
  clipData: Clip;
  user: User | null;
  ratings: Record<string, Rating>;
  fetchClipsAndRatings: (user: User | null) => Promise<void>;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
  isReportModalOpen: boolean;
  setIsReportModalOpen: (open: boolean) => void;
  showDeleteConfirm: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  popout: string;
  setPopout: (popout: string) => void;
  highlightedMessageId: string | null;
  setHighlightedMessageId: (id: string | null) => void;
}

export const ClipModalsContainer: React.FC<ClipModalsContainerProps> = ({
  clipData,
  user,
  ratings,
  fetchClipsAndRatings,
  isEditModalOpen,
  setIsEditModalOpen,
  isReportModalOpen,
  setIsReportModalOpen,
  showDeleteConfirm,
  onConfirmDelete,
  onCancelDelete,
  popout,
  setPopout,
  highlightedMessageId,
}) => {
  return (
    <>
      {isEditModalOpen && (
        <EditModal
          clip={clipData}
          setCurrentClip={() => fetchClipsAndRatings(user)}
          isEditModalOpen={isEditModalOpen}
          setIsEditModalOpen={setIsEditModalOpen}
        />
      )}

      {isReportModalOpen && (
        <ReportModal
          clip={clipData}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Clip"
        message={`Are you sure you want to delete "${clipData.title}"? This action cannot be undone.`}
        confirmText="Delete Clip"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />

      {popout === 'chat' && (
        <MessageComponent
          clipId={clipData._id}
          setPopout={setPopout}
          user={user}
          highlightedMessageId={highlightedMessageId}
        />
      )}

      {popout === 'ratings' && (
        <RatingsComponent
          clip={clipData}
          setPopout={setPopout}
          ratings={ratings}
          user={user}
          fetchClipsAndRatings={fetchClipsAndRatings}
        />
      )}
    </>
  );
};

export default ClipModalsContainer;
