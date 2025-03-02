export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

export interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

// Backend user notification types
export type UserNotificationType = 'comment_reply' | 'mention' | 'rating' | 'system';

export interface UserNotification {
  _id: string;
  recipientId: string;
  senderId: string;
  senderUsername: string;
  type: UserNotificationType;
  entityId?: string;  // Usually a commentId
  replyId?: string;   // Used for comment_reply type notifications
  clipId: string;
  read: boolean;
  message: string;
  createdAt: string;
}

export interface UserNotificationResponse {
  notifications: UserNotification[];
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
