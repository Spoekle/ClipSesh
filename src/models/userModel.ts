import mongoose, { Document, Model, Schema } from 'mongoose';

const backendUrl = process.env.BACKEND_URL || '';

export const headsets = [
  'Oculus Quest',
  'Oculus Quest 2',
  'Oculus Quest Pro',
  'Oculus Quest 3',
  'Oculus Quest 3S',
  'Oculus Rift CV1',
  'Oculus Rift S',
  'HTC Vive',
  'HTC Vive Pro',
  'HTC Vive Cosmos',
  'Valve Index',
  'Bigscreen Beyond',
  'Pico Neo 2',
  'Pico Neo 3',
  'Pico Neo 4',
  'Other',
  'None'
] as const;

export interface ISocialLinks {
  website?: string;
  youtube?: string;
  twitch?: string;
  twitter?: string;
  instagram?: string;
  github?: string;
}

export interface IProfile {
  bio?: string;
  website?: string;
  socialLinks?: ISocialLinks;
  vrheadset?: string;
  isPublic?: boolean;
  lastActive?: Date;
}

export interface IUser extends Document {
  username: string;
  email?: string;
  password?: string;
  profilePicture?: string;
  roles: string[];
  status: 'active' | 'disabled';
  discordId?: string;
  discordUsername?: string;
  joinDate?: Date;
  profile: IProfile;
  createdAt: Date;
  updatedAt: Date;
}

const socialLinksSchema = new Schema<ISocialLinks>({
  website: { type: String, default: '' },
  youtube: { type: String, default: '' },
  twitch: { type: String, default: '' },
  twitter: { type: String, default: '' },
  instagram: { type: String, default: '' },
  github: { type: String, default: '' }
}, { _id: false });

const profileSchema = new Schema<IProfile>({
  bio: { type: String, default: '', maxlength: 500 },
  website: { type: String, default: '' },
  socialLinks: { type: socialLinksSchema, default: () => ({}) },
  vrheadset: { type: String, enum: headsets, default: 'Other' },
  isPublic: { type: Boolean, default: true },
  lastActive: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  profilePicture: {
    type: String,
    default: `${backendUrl}/profilePictures/profile_placeholder.png`
  },
  roles: {
    type: [String],
    enum: ['admin', 'user', 'clipteam', 'editor', 'uploader'],
    default: ['user'],
    required: true
  },
  status: {
    type: String,
    enum: ['disabled', 'active'],
    default: 'active'
  },
  discordId: { type: String, unique: true, sparse: true },
  discordUsername: { type: String },
  joinDate: { type: Date, default: Date.now },
  profile: { type: profileSchema, default: () => ({}) },
}, { timestamps: true });

userSchema.pre('save', function() {
  if (!this.profile) {
    this.profile = {};
  }
});

export const User: Model<IUser> =
  (mongoose.models && mongoose.models.User) ||
  mongoose.model<IUser>('User', userSchema);

export default User;
