import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'comment_reply'
  | 'mention'
  | 'rating'
  | 'system'
  | 'team_message'
  | 'report';

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderUsername: string;
  type: NotificationType;
  entityId?: string;
  replyId?: string;
  clipId: string;
  read: boolean;
  message: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderUsername: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['comment_reply', 'mention', 'rating', 'system', 'team_message', 'report'],
    required: true
  },
  entityId: {
    type: String
  },
  replyId: {
    type: String
  },
  clipId: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.index({ recipientId: 1, read: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

export const Notification: Model<INotification> =
  (mongoose.models && mongoose.models.Notification) ||
  mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
