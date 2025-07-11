import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotification } from '../../context/AlertContext';
import AlertItem from './AlertItem';

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  // Don't render anything if there are no notifications
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-24 right-4 z-50 flex flex-col items-end space-y-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            layout
            className="pointer-events-auto"
          >
            <AlertItem
              notification={notification}
              onRemove={removeNotification}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationContainer;
