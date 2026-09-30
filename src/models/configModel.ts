import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPublicConfig extends Document {
  latestVideoLink: string;
  clipAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBlacklistedSubmitter {
  username?: string;
  userId?: string;
}

export interface ISeasonTransitionLog {
  timestamp: Date;
  action: 'submission_closed' | 'season_started' | 'auto_zip_started' | 'auto_zip_completed' | 'auto_zip_failed' | 'season_unarchived';
  season: 'Spring' | 'Summer' | 'Fall' | 'Winter';
  year: number;
  details: string;
}

export interface ILastArchivedSeason {
  season: 'Spring' | 'Summer' | 'Fall' | 'Winter';
  year: number;
  jobId?: string;
  archivedAt: Date;
  clipCount: number;
  zipUrl?: string;
  status: 'success' | 'failed';
  error?: string;
}

export interface ISeasonAutomationConfig {
  enabled: boolean;
  seasonEndDay: number;
  newSeasonStartDay: number;
  zipArchiveDay: number;
  denyThreshold?: number;
  lastArchivedSeason?: ILastArchivedSeason;
  transitionHistory?: ISeasonTransitionLog[];
}

export interface IAdminConfig extends Document {
  denyThreshold: number;
  clipChannelIds: string[];
  blacklistedSubmitters: IBlacklistedSubmitter[];
  blacklistedStreamers: string[];
  seasonAutomation?: ISeasonAutomationConfig;
  createdAt: Date;
  updatedAt: Date;
}

const PublicConfigSchema = new Schema<IPublicConfig>({
  latestVideoLink: {
    type: String,
    default: '',
    trim: true
  },
  clipAmount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const blacklistedSubmitterSchema = new Schema<IBlacklistedSubmitter>({
  username: {
    type: String,
    default: '',
    trim: true
  },
  userId: {
    type: String,
    default: '',
    trim: true
  },
}, { _id: false });

const seasonTransitionLogSchema = new Schema<ISeasonTransitionLog>({
  timestamp: { type: Date, default: Date.now },
  action: {
    type: String,
    enum: ['submission_closed', 'season_started', 'auto_zip_started', 'auto_zip_completed', 'auto_zip_failed', 'season_unarchived'],
    required: true
  },
  season: {
    type: String,
    enum: ['Spring', 'Summer', 'Fall', 'Winter'],
    required: true
  },
  year: { type: Number, required: true },
  details: { type: String, default: '' }
}, { _id: false });

const lastArchivedSeasonSchema = new Schema<ILastArchivedSeason>({
  season: {
    type: String,
    enum: ['Spring', 'Summer', 'Fall', 'Winter'],
    required: true
  },
  year: { type: Number, required: true },
  jobId: { type: String },
  archivedAt: { type: Date, default: Date.now },
  clipCount: { type: Number, default: 0 },
  zipUrl: { type: String },
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  error: { type: String }
}, { _id: false });

const seasonAutomationSchema = new Schema<ISeasonAutomationConfig>({
  enabled: { type: Boolean, default: true },
  seasonEndDay: { type: Number, default: 20, min: 1, max: 28 },
  newSeasonStartDay: { type: Number, default: 21, min: 1, max: 28 },
  zipArchiveDay: { type: Number, default: 25, min: 1, max: 28 },
  denyThreshold: { type: Number },
  lastArchivedSeason: { type: lastArchivedSeasonSchema },
  transitionHistory: { type: [seasonTransitionLogSchema], default: [] }
}, { _id: false });

const AdminConfigSchema = new Schema<IAdminConfig>({
  denyThreshold: {
    type: Number,
    default: 5,
    min: 1
  },
  clipChannelIds: {
    type: [String],
    default: []
  },
  blacklistedSubmitters: {
    type: [blacklistedSubmitterSchema],
    default: []
  },
  blacklistedStreamers: {
    type: [String],
    default: []
  },
  seasonAutomation: {
    type: seasonAutomationSchema,
    default: () => ({
      enabled: true,
      seasonEndDay: 20,
      newSeasonStartDay: 21,
      zipArchiveDay: 25,
      transitionHistory: []
    })
  }
}, { timestamps: true });

export const PublicConfig: Model<IPublicConfig> =
  (mongoose.models && mongoose.models.PublicConfig) ||
  mongoose.model<IPublicConfig>('PublicConfig', PublicConfigSchema);

export const AdminConfig: Model<IAdminConfig> =
  (mongoose.models && mongoose.models.AdminConfig) ||
  mongoose.model<IAdminConfig>('AdminConfig', AdminConfigSchema);

export default { PublicConfig, AdminConfig };
