import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IIpVote extends Document {
  clipId: Types.ObjectId;
  ip: string;
  vote: 'upvote' | 'downvote';
  createdAt: Date;
  updatedAt: Date;
}

const ipVoteSchema = new Schema<IIpVote>({
  clipId: { type: Schema.Types.ObjectId, ref: 'Clip', required: true },
  ip: { type: String, required: true },
  vote: { type: String, enum: ['upvote', 'downvote'], required: true },
}, { timestamps: true });

ipVoteSchema.index({ clipId: 1, ip: 1 }, { unique: true });

export const IpVote: Model<IIpVote> =
  (mongoose.models && mongoose.models.IpVote) ||
  mongoose.model<IIpVote>('IpVote', ipVoteSchema);

export default IpVote;
