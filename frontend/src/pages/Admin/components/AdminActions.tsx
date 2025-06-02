import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTrash, FaFileDownload, FaSpinner, FaInfoCircle } from 'react-icons/fa';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';

interface AdminActionsProps {
  openProcessModal: () => void;
  handleDeleteAllClips: () => Promise<void>;
  downloading: boolean;
}

const AdminActions: React.FC<AdminActionsProps> = ({ openProcessModal, handleDeleteAllClips, downloading }) => {
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
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Process Confirmation Dialog */}
      <ConfirmationDialog 
        isOpen={showProcessConfirm}
        title="Process Approved Clips"
        message="Are you sure you want to process all approved clips? This will create a ZIP file with all clips that have not been denied."
        confirmText="Process Clips"
        cancelText="Cancel"
        confirmVariant="primary"
        onConfirm={confirmProcess}
        onCancel={() => setShowProcessConfirm(false)}
      />

      <div className="w-full bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700">
          Admin Actions
        </h2>
        
        <div className="mb-6">
          <div className="flex items-start space-x-3">
            <FaInfoCircle className="text-blue-500 mt-1 flex-shrink-0" />
            <p className="text-neutral-700 dark:text-neutral-300">
              Process approved clips to create a downloadable ZIP file. Delete all clips to start fresh. 
              Be careful with these actions as they can't be undone.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowProcessConfirm(true)}
            disabled={downloading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center"
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center"
          >
            <FaTrash className="mr-2" /> Delete All Clips
          </motion.button>
        </div>
      </div>
    </>
  );
};

export default AdminActions;
