const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    username: { type: String, required: true },
    comment: { type: String, required: true }
}, { timestamps: true
});

const clipSchema = new mongoose.Schema({
    link: { type: String },
    url: { type: String, required: true },
    streamer: { type: String, required: true },
    submitter: { type: String, required: true },
    title: { type: String, required: true },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    comments: { type: [commentSchema], default: [] }
}, { timestamps: true });

const Clip = mongoose.model('Clip', clipSchema);

module.exports = Clip;