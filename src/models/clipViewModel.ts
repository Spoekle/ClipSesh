import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IClipView extends Document {
  clipId: Types.ObjectId;
  ip: string;
  createdAt: Date;
}

const clipViewSchema = new Schema<IClipView>({
  clipId: { type: Schema.Types.ObjectId, ref: 'Clip', required: true },
  ip: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Compound index to quickly find if this IP viewed this clip
clipViewSchema.index({ clipId: 1, ip: 1 });

// TTL index to automatically clean up view records after 2 hours (7200 seconds)
clipViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7200 });

export const ClipView: Model<IClipView> =
  (mongoose.models && mongoose.models.ClipView) ||
  mongoose.model<IClipView>('ClipView', clipViewSchema);

export default ClipView;
