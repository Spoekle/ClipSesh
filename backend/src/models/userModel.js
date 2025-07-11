const mongoose = require('mongoose');
const backendUrl = process.env.BACKEND_URL || 'https://api.spoekle.com';

/**
 * @swagger
 * components:
 *   schemas:
 *     SocialLinks:
 *       type: object
 *       properties:
 *         website:
 *           type: string
 *           default: ''
 *         youtube:
 *           type: string
 *           default: ''
 *         twitch:
 *           type: string
 *           default: ''
 *         twitter:
 *           type: string
 *           default: ''
 *         instagram:
 *           type: string
 *           default: ''
 *         github:
 *           type: string
 *           default: ''
 *     Trophy:
 *       type: object
 *       properties:
 *         trophyName:
 *           type: string
 *           required: true
 *         dateEarned:
 *           type: string
 *           required: true
 *         description:
 *           type: string
 *           required: true
 *     Profile:
 *       type: object
 *       properties:
 *         bio:
 *           type: string
 *           default: ''
 *           maxLength: 500
 *         website:
 *           type: string
 *           default: ''
 *         socialLinks:
 *           $ref: '#/components/schemas/SocialLinks'
 *         isPublic:
 *           type: boolean
 *           default: true
 *         lastActive:
 *           type: string
 *           format: date-time
 *           default: Date.now
 *         trophies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Trophy'
 *           default: []       
 *         vrheadset:
 *           type: string
 *           default: 'Other'
 *     User:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           description: The username of the user
 *           required: true
 *         email:
 *           type: string
 *           description: The email of the user
 *           required: false
 *         password:
 *           type: string
 *           description: The password of the user
 *           required: true
 *         profilePicture:
 *           type: string
 *           description: The URL of the user's profile picture
 *           default: 'https://api.spoekle.com/profilePictures/profile_placeholder.png'
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *             enum: ['admin', 'user', 'clipteam', 'editor', 'uploader']
 *           description: The roles assigned to the user
 *           default: ['user']
 *           required: true
 *         status:
 *           type: string
 *           enum: ['disabled', 'active']
 *           description: The status of the user
 *           default: 'active'
 *         discordId:
 *           type: string
 *           description: The Discord ID of the user
 *           unique: true
 *           sparse: true
 *         discordUsername:
 *           type: string
 *           description: The Discord username of the user
 *         joinDate:
 *           type: string
 *           format: date-time
 *           description: When the user joined
 *           default: Date.now
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the user was created (auto-generated)
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the user was last updated (auto-generated)
 *         profile:
 *           $ref: '#/components/schemas/Profile'
 *       required:
 *         - username
 *         - password
 *         - roles
 */

const headsets = [
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
];

const trophiesSchema = new mongoose.Schema({
  trophyName: { type: String, required: true },
  dateEarned: { type: String, required: true },
  description: { type: String, required: true },
});

const socialLinksSchema = new mongoose.Schema({
  website: { type: String, default: '' },
  youtube: { type: String, default: '' },
  twitch: { type: String, default: '' },
  twitter: { type: String, default: '' },
  instagram: { type: String, default: '' },
  github: { type: String, default: '' }
}, { _id: false });

const profileSchema = new mongoose.Schema({
  bio: { type: String, default: '', maxlength: 500 },
  website: { type: String, default: '' },
  socialLinks: { type: socialLinksSchema, default: () => ({}) },
  vrheadset: { type: String, enum: headsets, default: 'Other' },
  isPublic: { type: Boolean, default: true },
  lastActive: { type: Date, default: Date.now },
  trophies: { type: [trophiesSchema], default: [] },
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: `${backendUrl}/profilePictures/profile_placeholder.png` },
  roles: { type: [String], enum: ['admin', 'user', 'clipteam', 'editor', 'uploader'], default: ['user'], required: true },
  status: { type: String, enum: ['disabled', 'active'], default: 'active' },
  discordId: { type: String, unique: true, sparse: true },
  discordUsername: { type: String },
  joinDate: { type: Date, default: Date.now },
  profile: { type: profileSchema, default: () => ({}) },
}, { timestamps: true });

// Pre-save middleware to ensure profile object exists
userSchema.pre('save', function(next) {
  if (!this.profile) {
    this.profile = {};
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;