import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IMessage extends Document {
  clipId: Types.ObjectId;
  userId: Types.ObjectId;
  user: string;
  message: string;
  profilePicture: string;
  timestamp: Date;
}

const messageSchema = new Schema<IMessage>({
  clipId: { type: Schema.Types.ObjectId, ref: 'Clip', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  user: { type: String, required: true },
  message: { type: String, required: true },
  profilePicture: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

messageSchema.index({ clipId: 1, timestamp: 1 });

export const Message: Model<IMessage> =
  (mongoose.models && mongoose.models.Message) ||
  mongoose.model<IMessage>('Message', messageSchema);

export default Message;
