const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     PublicConfig:
 *       type: object
 *       properties:
 *         latestVideoLink:
 *           type: string
 *           description: Link to the latest highlights video
 *         clipAmount:
 *           type: number
 *           description: Total number of clips in the system
 */
const PublicConfigSchema = new mongoose.Schema({
  latestVideoLink: {
    type: String,
    default: ''
  },
  clipAmount: {
    type: Number,
    default: 0
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminConfig:
 *       type: object
 *       properties:
 *         denyThreshold:
 *           type: number
 *           description: Number of deny votes needed to reject a clip
 *         clipChannelIds:
 *           type: array
 *           items:
 *             type: string
 *           description: List of Discord channel IDs to listen to
 *         blacklistedSubmitters:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *             userId:
 *               type: string
 *         blacklistedStreamers:
 *           type: array
 *           items:
 *             type: string
 *           description: List of streamer usernames that are blacklisted
 *         backendUrl:
 *           type: string
 *           description: Backend URL for the Discord bot
 *         discordBotToken:
 *           type: string
 *           description: Discord bot token (private)
 */
const AdminConfigSchema = new mongoose.Schema({
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

const PublicConfig = mongoose.model('PublicConfig', PublicConfigSchema);
const AdminConfig = mongoose.model('AdminConfig', AdminConfigSchema);

module.exports = { PublicConfig, AdminConfig };