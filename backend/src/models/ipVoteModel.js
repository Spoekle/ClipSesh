const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     IpVote:
 *       type: object
 *       properties:
 *         clipId:
 *           type: string
 *           description: The ID of the clip being voted on
 *           required: true
 *         ip:
 *           type: string
 *           description: The IP address of the voter
 *           required: true
 *         vote:
 *           type: string
 *           enum: ['upvote', 'downvote']
 *           description: The type of vote
 *           required: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the vote was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the vote was last updated
 *       required:
 *         - clipId
 *         - ip
 *         - vote
 */

const ipVoteSchema = new mongoose.Schema({
    clipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clip', required: true },
    ip: { type: String, required: true },
    vote: { type: String, enum: ['upvote', 'downvote'], required: true },
  }, { timestamps: true });
  
  const IpVote = mongoose.model('IpVote', ipVoteSchema);

module.exports = IpVote;