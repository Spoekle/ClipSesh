import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IZip extends Document {
  name: string;
  url: string;
  season: 'Spring' | 'Summer' | 'Fall' | 'Winter';
  year: number;
  clipAmount: number;
  size: number;
  createdAt: Date;
}

const zipSchema = new Schema<IZip>({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  season: {
    type: String,
    required: true,
    enum: ['Spring', 'Summer', 'Fall', 'Winter']
  },
  year: {
    type: Number,
    required: true
  },
  clipAmount: {
    type: Number,
    default: 0
  },
  size: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

zipSchema.index({ season: 1, year: -1 });
zipSchema.index({ createdAt: -1 });

export const Zip: Model<IZip> =
  (mongoose.models && mongoose.models.Zip) ||
  mongoose.model<IZip>('Zip', zipSchema);

export default Zip;
