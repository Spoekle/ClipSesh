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

const commentSchema = new mongoose.Schema({
    username: { type: String, required: true },
    comment: { type: String, required: true }
}, { timestamps: true
});

const clipSchema = new mongoose.Schema({
    link: { type: String },
    url: { type: String, required: true },
    thumbnail: { type: String },
    streamer: { type: String, required: true },
    submitter: { type: String, required: true },
    title: { type: String, required: true },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    comments: { type: [commentSchema], default: [] }
}, { timestamps: true });

const Clip = mongoose.model('Clip', clipSchema);

module.exports = Clip;