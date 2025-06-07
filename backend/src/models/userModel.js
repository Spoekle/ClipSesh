const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
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
 *         bio:
 *           type: string
 *           description: User's biography
 *           maxLength: 500
 *           default: ''
 *         website:
 *           type: string
 *           description: User's website URL
 *           default: ''
 *         socialLinks:
 *           type: object
 *           properties:
 *             youtube:
 *               type: string
 *               default: ''
 *             twitch:
 *               type: string
 *               default: ''
 *             twitter:
 *               type: string
 *               default: ''
 *             instagram:
 *               type: string
 *               default: ''
 *             github:
 *               type: string
 *               default: ''
 *         isPublic:
 *           type: boolean
 *           description: Whether the user's profile is public
 *           default: true
 *         lastActive:
 *           type: string
 *           format: date-time
 *           description: When the user was last active
 *         joinDate:
 *           type: string
 *           format: date-time
 *           description: When the user joined
 *         trophies:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               trophyName:
 *                 type: string
 *               dateEarned:
 *                 type: string
 *               description:
 *                 type: string
 *       required:
 *         - username
 *         - password
 *         - roles
 */

const trophiesSchema = new mongoose.Schema({
  trophyName: { type: String, required: true },
  dateEarned: { type: String, required: true },
  description: { type: String, required: true },
});

const socialLinksSchema = new mongoose.Schema({
  youtube: { type: String, default: '' },
  twitch: { type: String, default: '' },
  twitter: { type: String, default: '' },
  instagram: { type: String, default: '' },
  github: { type: String, default: '' }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: 'https://api.spoekle.com/profilePictures/profile_placeholder.png' },
  roles: { type: [String], enum: ['admin', 'user', 'clipteam', 'editor', 'uploader'], default: ['user'], required: true },
  status: { type: String, enum: ['disabled', 'active'], default: 'active' },
  discordId: { type: String, unique: true, sparse: true },
  discordUsername: { type: String },
  trophies: { type: [trophiesSchema], default: [] },
  // Profile fields - directly in user schema
  bio: { type: String, default: '', maxlength: 500 },
  website: { type: String, default: '' },
  socialLinks: { type: socialLinksSchema, default: () => ({}) },
  isPublic: { type: Boolean, default: true },
  lastActive: { type: Date, default: Date.now },
  joinDate: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

module.exports = User;