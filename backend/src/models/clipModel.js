const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           description: The username of the commenter
 *         comment:
 *           type: string
 *           description: The comment text
 *       required:
 *         - username
 *         - comment
 *     Clip:
 *       type: object
 *       properties:
 *         link:
 *           type: string
 *           description: The link to the clip
 *         url:
 *           type: string
 *           description: The URL of the clip
 *           required: true
 *         thumbnail:
 *           type: string
 *           description: The thumbnail of the clip
 *         streamer:
 *           type: string
 *           description: The name of the streamer
 *           required: true
 *         submitter:
 *           type: string
 *           description: The name of the submitter
 *           required: true
 *         discordSubmitterId:
 *           type: string
 *           description: Discord user ID of the submitter (if uploaded via Discord bot)
 *         title:
 *           type: string
 *           description: The title of the clip
 *           required: true
 *         upvotes:
 *           type: number
 *           description: The number of upvotes
 *           default: 0
 *         downvotes:
 *           type: number
 *           description: The number of downvotes
 *           default: 0
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *           description: The comments on the clip
 *           default: []
 *       required:
 *         - url
 *         - streamer
 *         - submitter
 *         - title
 */

/**
 * Reply Schema - embedded in comments
 */
const replySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  replyText: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Comment Schema - embedded in clips
 */
const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true  // Make this field required
  },
  username: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  replies: [replySchema]
});

/**
 * Main Clip Schema
 */
const clipSchema = new mongoose.Schema({
  link: { type: String },
  url: { type: String, required: true },
  thumbnail: { type: String },
  streamer: { type: String, required: true },
  submitter: { type: String, required: true },
  title: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  comments: { type: [commentSchema], default: [] },
  discordSubmitterId: { type: String }
}, { timestamps: true });

const Clip = mongoose.model('Clip', clipSchema);

module.exports = Clip;