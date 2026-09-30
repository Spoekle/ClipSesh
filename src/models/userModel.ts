import mongoose, { Document, Model, Schema } from 'mongoose';


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
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: '/profilePictures/profile_placeholder.png'
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
  discordId: {
    type: String,
    unique: true,
    sparse: true
  },
  discordUsername: {
    type: String,
    trim: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
}, { timestamps: true });

userSchema.index({ roles: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

export const User: Model<IUser> =
  (mongoose.models && mongoose.models.User) ||
  mongoose.model<IUser>('User', userSchema);

export default User;
