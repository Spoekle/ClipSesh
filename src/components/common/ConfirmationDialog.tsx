import React, { useEffect, useCallback } from 'react';
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
  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [onCancel]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const getVariantStyles = () => {
    switch (confirmVariant) {
      case 'success':
        return {
          icon: <FaCheck size={16} />,
          iconBg: 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30',
          btnClass: 'bg-[#22c55e] hover:bg-[#16a34a] text-white',
        };
      case 'primary':
        return {
          icon: <FaExclamationTriangle size={16} />,
          iconBg: 'bg-[#f23030]/15 text-[#f23030] border border-[#f23030]/30',
          btnClass: 'bg-[#f23030] hover:bg-[#d92222] text-white',
        };
      case 'danger':
      default:
        return {
          icon: <FaExclamationTriangle size={16} />,
          iconBg: 'bg-[#f23030]/15 text-[#f23030] border border-[#f23030]/30',
          btnClass: 'bg-[#f23030] hover:bg-[#d92222] text-white',
        };
    }
  };

  const { icon, iconBg, btnClass } = getVariantStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-[#181818] border border-[#262626] rounded-2xl p-6 shadow-2xl max-w-md w-full text-[#f1f1f1] z-10"
          >
            {/* Top Close button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 text-[#717171] hover:text-[#f1f1f1] rounded-lg hover:bg-[#222222] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <FaTimes size={14} />
            </button>

            <div className="flex items-start gap-4 mb-5">
              <div className={`p-3 rounded-xl flex-shrink-0 flex items-center justify-center ${iconBg}`}>
                {icon}
              </div>

              <div className="min-w-0 pr-4">
                <h3 className="text-base font-bold text-[#f1f1f1] leading-snug">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-[#aaaaaa] leading-relaxed mt-1.5 break-words">
                  {message}
                </p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-3.5 border-t border-[#262626] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-[#141414] hover:bg-[#222222] text-[#aaaaaa] hover:text-[#f1f1f1] border border-[#262626] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 ${btnClass}`}
              >
                <span>{confirmText}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog;
