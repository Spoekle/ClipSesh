import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaCheck, FaTimes } from 'react-icons/fa';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel
}) => {
  // Map variants to colors
  const variantClasses = {
    danger: 'bg-red-600 hover:bg-red-700',
    primary: 'bg-blue-600 hover:bg-blue-700',
    success: 'bg-green-600 hover:bg-green-700'
  };

  const buttonClass = `px-4 py-2.5 text-white rounded-xl transition-colors font-medium ${variantClasses[confirmVariant]}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4 z-10 border border-neutral-200/50 dark:border-neutral-700/50"
          >
            <div className="flex items-start">
              <div className="mr-4 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex-shrink-0">
                <FaExclamationTriangle className="text-amber-500 dark:text-amber-400" size={20} />
              </div>

              <div className="flex-1 text-neutral-900 dark:text-white">
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">{message}</p>

                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCancel}
                    className="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-700 rounded-xl text-neutral-800 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors font-medium"
                  >
                    <div className="flex items-center">
                      <FaTimes className="mr-2" /> {cancelText}
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onConfirm}
                    className={buttonClass}
                  >
                    <div className="flex items-center">
                      <FaCheck className="mr-2" /> {confirmText}
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog;
