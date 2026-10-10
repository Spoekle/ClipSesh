'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaCheck, FaTimes } from 'react-icons/fa';
import { Button } from './Button';

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

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
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
          iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
          btnClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        };
      case 'primary':
      case 'danger':
      default:
        return {
          icon: <FaExclamationTriangle size={16} />,
          iconBg: 'bg-primary/15 text-primary border border-primary/30',
          btnClass: 'bg-primary hover:bg-primary/90 text-white',
        };
    }
  };

  const { icon, iconBg, btnClass } = getVariantStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-10000 flex items-center justify-center p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-xs"
            onClick={onCancel}
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-cc-card border border-border rounded-2xl p-6 shadow-2xl max-w-md w-full text-foreground z-10"
          >
            {/* Top Close button */}
            <button
              type="button"
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <FaTimes size={14} />
            </button>

            <div className="flex items-start gap-4 mb-5">
              <div className={`p-3 rounded-xl shrink-0 flex items-center justify-center ${iconBg}`}>
                {icon}
              </div>

              <div className="min-w-0 pr-4">
                <h3 className="text-base font-bold text-white leading-snug">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1.5 break-words">
                  {message}
                </p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-3.5 border-t border-border flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="card"
                size="sm"
                onClick={onCancel}
              >
                {cancelText}
              </Button>

              <Button
                type="button"
                variant={confirmVariant === 'success' ? 'success' : 'primary'}
                size="sm"
                onClick={onConfirm}
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog;
