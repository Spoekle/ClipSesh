const mongoose = require('mongoose');

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