import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IVote extends Document {
  clipId: Types.ObjectId;
  voterToken: string;
  vote: 'upvote' | 'downvote';
  createdAt: Date;
  updatedAt: Date;
}

const voteSchema = new Schema<IVote>(
  {
    clipId: { type: Schema.Types.ObjectId, ref: 'Clip', required: true, index: true },
    voterToken: { type: String, required: true, trim: true, index: true },
    vote: { type: String, enum: ['upvote', 'downvote'], required: true },
  },
  { timestamps: true }
);

// Unique index to ensure each voterToken can only have one active vote per clip
voteSchema.index({ clipId: 1, voterToken: 1 }, { unique: true });

export const Vote: Model<IVote> =
  (mongoose.models && mongoose.models.Vote) ||
  mongoose.model<IVote>('Vote', voteSchema);

export default Vote;
