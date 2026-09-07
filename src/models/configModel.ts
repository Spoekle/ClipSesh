import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPublicConfig extends Document {
  latestVideoLink: string;
  clipAmount: number;
}

export interface IBlacklistedSubmitter {
  username?: string;
  userId?: string;
}

export interface IAdminConfig extends Document {
  denyThreshold: number;
  clipChannelIds: string[];
  blacklistedSubmitters: IBlacklistedSubmitter[];
  blacklistedStreamers: string[];
}

const PublicConfigSchema = new Schema<IPublicConfig>({
  latestVideoLink: {
    type: String,
    default: ''
  },
  clipAmount: {
    type: Number,
    default: 0
  }
});

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
  blacklistedSubmitters: [{
    username: {
      type: String,
      default: ''
    },
    userId: {
      type: String,
      default: ''
    },
  }],
  blacklistedStreamers: {
    type: [String],
    default: []
  }
});

export const PublicConfig: Model<IPublicConfig> =
  (mongoose.models && mongoose.models.PublicConfig) ||
  mongoose.model<IPublicConfig>('PublicConfig', PublicConfigSchema);

export const AdminConfig: Model<IAdminConfig> =
  (mongoose.models && mongoose.models.AdminConfig) ||
  mongoose.model<IAdminConfig>('AdminConfig', AdminConfigSchema);

export default { PublicConfig, AdminConfig };
