import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTimes,
} from 'react-icons/fa';
import { Notification, AlertModalOptions } from '../types/notificationTypes';
import { useNotification } from '../context/AlertContext';

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

export const AlertItem: React.FC<NotificationItemProps> = React.memo(({ notification, onRemove }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  isPausedRef.current = isPaused;

  const onRemoveRef = useRef(onRemove);
  onRemoveRef.current = onRemove;

  const handleRemove = useCallback(() => {
    onRemoveRef.current(notification.id);
  }, [notification.id]);

  useEffect(() => {
    if (!notification.duration || notification.duration <= 0) return;

    const totalDuration = notification.duration;
    let remainingTime = totalDuration;
    let lastTime = Date.now();
    const intervalTime = 50;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTime;
      lastTime = now;

      if (isPausedRef.current) {
        return;
      }

      remainingTime -= elapsed;
      if (remainingTime <= 0) {
        clearInterval(interval);
        setProgress(0);
        onRemoveRef.current(notification.id);
      } else {
        setProgress(Math.max(0, (remainingTime / totalDuration) * 100));
      }
    }, intervalTime);

    return () => {
      clearInterval(interval);
    };
  }, [notification.duration, notification.id]);

  const config = useMemo(() => {
    switch (notification.type) {
      case 'success':
        return {
          borderClass: 'border-l-4 border-l-emerald-500',
          iconColor: 'text-emerald-400',
          iconBg: 'bg-emerald-500/15 border border-emerald-500/25',
          progressBar: 'bg-emerald-500',
          icon: <FaCheckCircle className="w-4 h-4" />,
          title: 'Success',
        };
      case 'error':
        return {
          borderClass: 'border-l-4 border-l-[#f23030]',
          iconColor: 'text-[#f23030]',
          iconBg: 'bg-[#f23030]/15 border border-[#f23030]/25',
          progressBar: 'bg-[#f23030]',
          icon: <FaTimesCircle className="w-4 h-4" />,
          title: 'Error',
        };
      case 'warning':
        return {
          borderClass: 'border-l-4 border-l-amber-500',
          iconColor: 'text-amber-400',
          iconBg: 'bg-amber-500/15 border border-amber-500/25',
          progressBar: 'bg-amber-500',
          icon: <FaExclamationTriangle className="w-4 h-4" />,
          title: 'Warning',
        };
      case 'info':
      default:
        return {
          borderClass: 'border-l-4 border-l-sky-500',
          iconColor: 'text-sky-400',
          iconBg: 'bg-sky-500/15 border border-sky-500/25',
          progressBar: 'bg-sky-500',
          icon: <FaInfoCircle className="w-4 h-4" />,
          title: 'Notice',
        };
    }
  }, [notification.type]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full max-w-sm bg-[#181818]/95 backdrop-blur-md rounded-2xl shadow-2xl p-3.5 mb-2.5 overflow-hidden border border-[#262626] ${config.borderClass} select-none transition-all duration-200 hover:border-[#383838]`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl shrink-0 ${config.iconBg} ${config.iconColor}`}>
          {config.icon}
        </div>
        <div className="flex-grow min-w-0 pr-1">
          <p className="text-[#f1f1f1] font-medium text-xs leading-relaxed break-words">
            {notification.message}
          </p>
        </div>
        <button
          onClick={handleRemove}
          className="text-[#717171] hover:text-white transition-colors p-1 rounded-md hover:bg-white/5 shrink-0"
          title="Dismiss"
        >
          <FaTimes className="w-3 h-3" />
        </button>
      </div>

      {notification.duration && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#121212]">
          <div
            style={{ width: `${progress}%` }}
            className={`h-full transition-all duration-75 ease-linear ${config.progressBar}`}
          />
        </div>
      )}
    </motion.div>
  );
});

AlertItem.displayName = 'AlertItem';

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
          className="relative bg-[#181818] border border-[#262626] rounded-2xl p-6 shadow-2xl max-w-md w-full text-[#f1f1f1] z-10"
        >
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

export default function NotificationContainer() {
  const { notifications, removeNotification, alertModal, closeAlertModal } = useNotification();

  return (
    <>
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 sm:right-6 z-[9999] flex flex-col items-end space-y-2 pointer-events-none max-w-sm w-full">
          <AnimatePresence mode="popLayout">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                layout
                className="pointer-events-auto w-full"
              >
                <AlertItem
                  notification={notification}
                  onRemove={removeNotification}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AlertModal modal={alertModal} onClose={closeAlertModal} />
    </>
  );
}
