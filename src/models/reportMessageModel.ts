import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IReadBy {
  userId: Types.ObjectId;
  username: string;
  readAt: Date;
}

export interface IReportMessage extends Document {
  reportId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderUsername: string;
  senderRole: 'reporter' | 'admin';
  message: string;
  isInternal: boolean;
  readBy: IReadBy[];
  createdAt: Date;
  updatedAt: Date;
}

const reportMessageSchema = new Schema<IReportMessage>({
  reportId: {
    type: Schema.Types.ObjectId,
    ref: 'Report',
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
  senderRole: {
    type: String,
    enum: ['reporter', 'admin'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  isInternal: {
    type: Boolean,
    default: false
  },
  readBy: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

reportMessageSchema.index({ reportId: 1, createdAt: -1 });
reportMessageSchema.index({ senderId: 1 });
reportMessageSchema.index({ createdAt: -1 });

export const ReportMessage: Model<IReportMessage> =
  (mongoose.models && mongoose.models.ReportMessage) ||
  mongoose.model<IReportMessage>('ReportMessage', reportMessageSchema);

export default ReportMessage;
