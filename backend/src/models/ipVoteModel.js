const mongoose = require('mongoose');

const ipVoteSchema = new mongoose.Schema({
    clipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clip', required: true },
    ip: { type: String, required: true },
    vote: { type: String, enum: ['upvote', 'downvote'], required: true },
  }, { timestamps: true });
  
  const IpVote = mongoose.model('IpVote', ipVoteSchema);

module.exports = IpVote;