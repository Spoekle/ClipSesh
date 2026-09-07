import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotification } from '../../context/AlertContext';
import AlertItem from './AlertItem';
import AlertModal from './AlertModal';

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification, alertModal, closeAlertModal } = useNotification();

  return (
    <>
      {/* Toast Notifications List */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 sm:right-6 z-[9999] flex flex-col items-end space-y-2 pointer-events-none max-w-sm w-full">
          <AnimatePresence mode="popLayout">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
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

      {/* Custom Alert Modal Dialog (Replaces native window.alert) */}
      <AlertModal modal={alertModal} onClose={closeAlertModal} />
    </>
  );
};

export default NotificationContainer;
