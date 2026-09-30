import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IReply {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  username: string;
  replyText: string;
  createdAt: Date;
}

export interface IComment {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  username: string;
  comment: string;
  createdAt: Date;
  replies: Types.DocumentArray<IReply>;
}

export interface IClip extends Document {
  link?: string;
  url: string;
  thumbnail?: string;
  streamer: string;
  submitter: string;
  title: string;
  upvotes: number;
  downvotes: number;
  views: number;
  comments: Types.DocumentArray<IComment>;
  discordSubmitterId?: string;
  season?: 'Winter' | 'Spring' | 'Summer' | 'Fall';
  year?: number;
  archived: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const replySchema = new Schema<IReply>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  replyText: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const commentSchema = new Schema<IComment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  replies: [replySchema]
});

const clipSchema = new Schema<IClip>({
  link: { type: String, trim: true },
  url: { type: String, required: true, trim: true },
  thumbnail: { type: String, trim: true },
  streamer: { type: String, required: true, trim: true },
  submitter: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  views: { type: Number, default: 0, min: 0 },
  comments: { type: [commentSchema], default: [] },
  discordSubmitterId: { type: String, trim: true },
  season: { type: String, enum: ['Winter', 'Spring', 'Summer', 'Fall'] },
  year: { type: Number },
  archived: { type: Boolean, default: false },
  archivedAt: { type: Date }
}, { timestamps: true });

clipSchema.index({ archived: 1, createdAt: -1 });
clipSchema.index({ archived: 1, upvotes: -1, createdAt: -1 });
clipSchema.index({ archived: 1, downvotes: -1, createdAt: -1 });
clipSchema.index({ season: 1, year: -1, archived: 1 });
clipSchema.index({ streamer: 1, archived: 1 });
clipSchema.index({ submitter: 1 });
clipSchema.index({ discordSubmitterId: 1 });
clipSchema.index({ link: 1 }, { sparse: true });
clipSchema.index({ title: 'text', streamer: 'text', submitter: 'text' });
clipSchema.index({ views: -1 });

export const Clip: Model<IClip> =
  (mongoose.models && mongoose.models.Clip) ||
  mongoose.model<IClip>('Clip', clipSchema);

export default Clip;
