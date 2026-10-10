'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../context/AlertContext';
import AlertItem from './alerts/AlertItem';
import AlertModal from './alerts/AlertModal';

export { AlertItem, AlertModal };

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
