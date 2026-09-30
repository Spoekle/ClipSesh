import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IMessage extends Document {
  clipId: Types.ObjectId;
  userId: Types.ObjectId;
  user: string;
  message: string;
  profilePicture?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  clipId: { type: Schema.Types.ObjectId, ref: 'Clip', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  user: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  profilePicture: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

messageSchema.index({ clipId: 1, timestamp: 1 });
messageSchema.index({ userId: 1 });
messageSchema.index({ createdAt: -1 });

export const Message: Model<IMessage> =
  (mongoose.models && mongoose.models.Message) ||
  mongoose.model<IMessage>('Message', messageSchema);

export default Message;
