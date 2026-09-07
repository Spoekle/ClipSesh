import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTimes
} from 'react-icons/fa';
import { AlertModalOptions } from '../../types/notificationTypes';

interface AlertModalProps {
  modal: AlertModalOptions | null;
  onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ modal, onClose }) => {
  const handleConfirm = useCallback(() => {
    if (modal?.onConfirm) {
      modal.onConfirm();
    }
    onClose();
  }, [modal, onClose]);

  // Handle escape key
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
          iconBg: 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30',
          btnClass: 'bg-[#22c55e] hover:bg-[#16a34a] text-white',
        };
      case 'error':
        return {
          icon: <FaTimesCircle size={20} />,
          iconBg: 'bg-[#f23030]/15 text-[#f23030] border border-[#f23030]/30',
          btnClass: 'bg-[#f23030] hover:bg-[#d92222] text-white',
        };
      case 'warning':
        return {
          icon: <FaExclamationTriangle size={18} />,
          iconBg: 'bg-[#eab308]/15 text-[#eab308] border border-[#eab308]/30',
          btnClass: 'bg-[#f23030] hover:bg-[#d92222] text-white',
        };
      case 'info':
      default:
        return {
          icon: <FaInfoCircle size={20} />,
          iconBg: 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30',
          btnClass: 'bg-[#f23030] hover:bg-[#d92222] text-white',
        };
    }
  };

  const { icon, iconBg, btnClass } = getTypeStyles();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          onClick={handleConfirm}
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-[#181818] border border-[#262626] rounded-2xl p-6 shadow-2xl max-w-md w-full text-[#f1f1f1] z-10"
        >
          {/* Top Close Icon */}
          <button
            onClick={handleConfirm}
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
                {modal.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#aaaaaa] leading-relaxed mt-1.5 break-words">
                {modal.message}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#262626] flex justify-end">
            <button
              onClick={handleConfirm}
              className={`w-full sm:w-auto px-6 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${btnClass}`}
            >
              {modal.confirmText || 'OK'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AlertModal;
