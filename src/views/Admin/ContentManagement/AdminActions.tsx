import React, { useState } from 'react';
import { FaTrash, FaFileDownload, FaSpinner, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';

interface AdminActionsProps {
  openProcessModal: () => void;
  handleDeleteAllClips: () => Promise<void>;
  downloading: boolean;
  loading?: boolean;
  SkeletonBox?: React.ComponentType<{ className?: string }>;
}

const AdminActions: React.FC<AdminActionsProps> = ({
  openProcessModal,
  handleDeleteAllClips,
  downloading,
  loading = false,
  SkeletonBox
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProcessConfirm, setShowProcessConfirm] = useState(false);

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    await handleDeleteAllClips();
  };

  const confirmProcess = () => {
    setShowProcessConfirm(false);
    openProcessModal();
  };

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete All Clips"
        message="Are you sure you want to delete all clips? This action cannot be undone and will remove all ratings."
        confirmText="Delete All"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Process Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showProcessConfirm}
        title="Process Approved Clips"
        message="Are you sure you want to process all approved clips? This will create a ZIP file with all clips that have not been denied, using average ratings (rounded to nearest integer) for naming."
        confirmText="Process Clips"
        confirmVariant="primary"
        onConfirm={confirmProcess}
        onCancel={() => setShowProcessConfirm(false)}
      />

      <div className="bg-[#181818] p-5 sm:p-6 rounded-xl border border-[#262626] shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-[#f1f1f1] flex items-center gap-2.5">
            <span>Compilation Processing & Pipeline Actions</span>
          </h3>
          <p className="text-xs text-[#aaaaaa] mt-1">
            Build distribution ZIP packages for Cube Community editors or purge the active pool between seasons.
          </p>
        </div>

        {loading && SkeletonBox ? (
          <div className="space-y-4">
            <SkeletonBox className="h-16 w-full" />
            <SkeletonBox className="h-24 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action Card 1: Process Clips */}
            <div className="bg-[#141414] p-5 rounded-xl border border-[#262626] flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-[#222222] border border-[#2e2e2e] flex items-center justify-center text-[#f23030] mb-3">
                  <FaFileDownload size={16} />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Process Approved Submissions</h4>
                <p className="text-xs text-[#aaaaaa] leading-relaxed mb-4">
                  Runs background ffmpeg processing on all non-denied clips, assigns filename ratings, and compiles a downloadable ZIP package.
                </p>
              </div>

              <button
                onClick={() => setShowProcessConfirm(true)}
                disabled={downloading}
                className="w-full py-2.5 px-4 bg-[#f23030] hover:bg-[#d92222] disabled:opacity-50 text-white font-semibold text-xs rounded-full flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {downloading ? (
                  <>
                    <FaSpinner className="animate-spin" size={13} />
                    <span>Processing in Progress...</span>
                  </>
                ) : (
                  <>
                    <FaFileDownload size={13} />
                    <span>Process & Build ZIP Archive</span>
                  </>
                )}
              </button>
            </div>

            {/* Action Card 2: Danger Zone */}
            <div className="bg-[#141414] p-5 rounded-xl border border-rose-500/20 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
                  <FaExclamationTriangle size={15} />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Seasonal Queue Purge</h4>
                <p className="text-xs text-[#aaaaaa] leading-relaxed mb-4">
                  Permanently deletes all submissions and reviewer votes for the current season. Only run this after generating and downloading your final archive!
                </p>
              </div>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2.5 px-4 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-semibold text-xs rounded-full flex items-center justify-center gap-2 transition-all"
              >
                <FaTrash size={12} />
                <span>Delete All Season Clips</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminActions;
