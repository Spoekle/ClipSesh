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
 *       required:
 *         - username
 *         - password
 *         - roles
 */

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: 'https://api.spoekle.com/profilePictures/profile_placeholder.png' },
  roles: { type: [String], enum: ['admin', 'user', 'clipteam', 'editor', 'uploader'], default: ['user'], required: true },
  status: { type: String, enum: ['disabled', 'active'], default: 'active' },
  discordId: { type: String, unique: true, sparse: true },
  discordUsername: { type: String },
});

const User = mongoose.model('User', userSchema);

module.exports = User;