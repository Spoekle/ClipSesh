import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTrash, FaFileDownload, FaSpinner, FaInfoCircle } from 'react-icons/fa';
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
      />      <div className="w-full bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm text-neutral-900 dark:text-white transition duration-200 p-6 rounded-xl shadow-sm border border-neutral-200/80 dark:border-neutral-700/50">
        <h2 className="text-xl font-semibold mb-5 pb-3 border-b border-neutral-200 dark:border-neutral-700">
          Admin Actions
        </h2>

        {loading && SkeletonBox ? (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <SkeletonBox className="w-5 h-5 mt-1 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonBox className="h-4 w-full" />
                <SkeletonBox className="h-4 w-3/4" />
              </div>
            </div>

            <div className="space-y-3">
              <SkeletonBox className="h-10 w-full rounded-lg" />
              <SkeletonBox className="h-10 w-full rounded-lg" />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <FaInfoCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                  Process approved clips to create a downloadable ZIP file. Clips are included based on average ratings (rounded to nearest integer) rather than denied status.
                  Be careful with these actions as they can't be undone.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowProcessConfirm(true)}
                disabled={downloading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center shadow-sm transition-colors"
              >
                {downloading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Processing Clips...
                  </>
                ) : (
                  <>
                    <FaFileDownload className="mr-2" />
                    Process and Store Approved Clips
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center shadow-sm transition-colors"
              >
                <FaTrash className="mr-2" /> Delete All Clips
              </motion.button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AdminActions;
