import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IUserRatingEntry {
  userId?: Types.ObjectId;
  username?: string;
  timestamp: Date;
}

export interface IRatingsBucket {
  '1': IUserRatingEntry[];
  '2': IUserRatingEntry[];
  '3': IUserRatingEntry[];
  '4': IUserRatingEntry[];
  'deny': IUserRatingEntry[];
}

export interface IRating extends Document {
  clipId: Types.ObjectId;
  ratings: IRatingsBucket;
  createdAt: Date;
}

const ratingEntrySchema = new Schema<IUserRatingEntry>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  username: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ratingSchema = new Schema<IRating>({
  clipId: { type: Schema.Types.ObjectId, ref: 'Clip', required: true },
  ratings: {
    '1': [ratingEntrySchema],
    '2': [ratingEntrySchema],
    '3': [ratingEntrySchema],
    '4': [ratingEntrySchema],
    'deny': [ratingEntrySchema],
  },
  createdAt: { type: Date, default: Date.now }
});

ratingSchema.index({ clipId: 1 }, { unique: true });
ratingSchema.index({ 'ratings.1.userId': 1 });
ratingSchema.index({ 'ratings.2.userId': 1 });
ratingSchema.index({ 'ratings.3.userId': 1 });
ratingSchema.index({ 'ratings.4.userId': 1 });
ratingSchema.index({ 'ratings.deny.userId': 1 });

export const Rating: Model<IRating> =
  (mongoose.models && mongoose.models.Rating) ||
  mongoose.model<IRating>('Rating', ratingSchema);

export default Rating;
