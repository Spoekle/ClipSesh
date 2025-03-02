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
// Update to include team_message type
export type UserNotificationType = 'comment_reply' | 'mention' | 'rating' | 'system' | 'team_message';

export interface UserNotification {
  _id: string;
  recipientId: string;
  senderId: string;
  senderUsername: string;
  type: UserNotificationType;
  entityId?: string;  // commentId for replies, messageId for team messages
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
