const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    clipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clip', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    user: { type: String, required: true },
    message: { type: String, required: true },
    profilePicture: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
    });

    const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
