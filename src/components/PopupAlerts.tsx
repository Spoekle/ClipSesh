'use client';

import React from 'react';
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
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="pointer-events-auto w-full"
            >
              <AlertItem
                notification={notification}
                onRemove={removeNotification}
              />
            </div>
          ))}
        </div>
      )}

      <AlertModal modal={alertModal} onClose={closeAlertModal} />
    </>
  );
}
