import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import NotificationItem from './NotificationItem';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-3 items-end pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationItem
              notification={notification}
              onRemove={removeNotification}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationContainer;
