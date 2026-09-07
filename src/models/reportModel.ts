import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface IReport extends Document {
  clipId: Types.ObjectId;
  clipTitle: string;
  clipStreamer: string;
  clipSubmitter: string;
  reporterId: Types.ObjectId;
  reporterUsername: string;
  reason: string;
  status: ReportStatus;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>({
  clipId: {
    type: Schema.Types.ObjectId,
    ref: 'Clip',
    required: true
  },
  clipTitle: {
    type: String,
    required: true
  },
  clipStreamer: {
    type: String,
    required: true
  },
  clipSubmitter: {
    type: String,
    required: true
  },
  reporterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reporterUsername: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewedBy: {
    type: String,
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  adminNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

reportSchema.index({ clipId: 1 });
reportSchema.index({ reporterId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

export const Report: Model<IReport> =
  (mongoose.models && mongoose.models.Report) ||
  mongoose.model<IReport>('Report', reportSchema);

export default Report;
