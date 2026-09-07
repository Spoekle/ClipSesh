import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISeasonZip extends Document {
  url: string;
  season: string;
  name: string;
  size: number;
  clipAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const seasonZipSchema = new Schema<ISeasonZip>({
  url: { type: String, required: true },
  season: { type: String, required: true },
  name: { type: String, required: true },
  size: { type: Number, required: true },
  clipAmount: { type: Number, default: 0 },
}, { timestamps: true });

seasonZipSchema.index({ season: 1 });
seasonZipSchema.index({ createdAt: -1 });

export const SeasonZip: Model<ISeasonZip> =
  (mongoose.models && mongoose.models.SeasonZip) ||
  mongoose.model<ISeasonZip>('SeasonZip', seasonZipSchema);

export default SeasonZip;
