'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTimes,
} from 'react-icons/fa';
import { AlertModalOptions } from '@/types/notificationTypes';
import { Button } from '@/components/common/Button';

interface AlertModalProps {
  modal: AlertModalOptions | null;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ modal, onClose }) => {
  const handleConfirm = useCallback(() => {
    if (modal?.onConfirm) {
      modal.onConfirm();
    }
    onClose();
  }, [modal, onClose]);

  useEffect(() => {
    if (!modal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal, handleConfirm]);

  if (!modal) return null;

  const type = modal.type || 'info';

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <FaCheckCircle size={20} />,
          iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
          btnClass: 'bg-emerald-500 hover:bg-emerald-600 text-white',
        };
      case 'error':
        return {
          icon: <FaTimesCircle size={20} />,
          iconBg: 'bg-primary/15 text-primary border border-primary/30',
          btnClass: 'bg-primary hover:bg-primary-hover text-white',
        };
      case 'warning':
        return {
          icon: <FaExclamationTriangle size={18} />,
          iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
          btnClass: 'bg-primary hover:bg-primary-hover text-white',
        };
      case 'info':
      default:
        return {
          icon: <FaInfoCircle size={20} />,
          iconBg: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
          btnClass: 'bg-primary hover:bg-primary-hover text-white',
        };
    }
  };

  const { icon, iconBg, btnClass } = getTypeStyles();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          onClick={handleConfirm}
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-cc-card border border-border rounded-2xl p-6 shadow-2xl max-w-md w-full text-cc-text z-10"
        >
          <button
            onClick={handleConfirm}
            className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-cc-text rounded-lg hover:bg-cc-ground transition-colors cursor-pointer"
            aria-label="Close"
          >
            <FaTimes size={14} />
          </button>

          <div className="flex items-start gap-4 mb-5">
            <div className={`p-3 rounded-xl shrink-0 flex items-center justify-center ${iconBg}`}>
              {icon}
            </div>
            <div className="min-w-0 pr-4">
              <h3 className="text-base font-bold text-cc-text leading-snug">
                {modal.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1.5 break-words">
                {modal.message}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex justify-end">
            <Button
              type="button"
              variant={type === 'success' ? 'success' : 'primary'}
              size="sm"
              onClick={handleConfirm}
              className="w-full sm:w-auto"
            >
              {modal.confirmText || 'OK'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AlertModal;
