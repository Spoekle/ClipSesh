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

  const buttonClass = `px-4 py-2 text-white rounded-lg transition-colors font-medium ${variantClasses[confirmVariant]}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
            onClick={onCancel}
          />
          
          {/* Dialog */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-neutral-200 dark:bg-neutral-800 rounded-xl p-6 shadow-xl max-w-md w-full mx-4 z-10"
          >
            <div className="flex items-start">
              <div className="mr-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0">
                <FaExclamationTriangle size={24} />
              </div>
              
              <div className="flex-1 text-neutral-900 dark:text-white">
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="mb-6">{message}</p>
                
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onCancel}
                    className="px-4 py-2 bg-neutral-300 dark:bg-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-100 hover:bg-neutral-400 dark:hover:bg-neutral-600 transition-colors"
                  >
                    <div className="flex items-center">
                      <FaTimes className="mr-2" /> {cancelText}
                    </div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
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
