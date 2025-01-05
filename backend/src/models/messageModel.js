const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         clipId:
 *           type: string
 *           description: The ID of the clip associated with the message
 *           required: true
 *         userId:
 *           type: string
 *           description: The ID of the user who sent the message
 *           required: true
 *         user:
 *           type: string
 *           description: The username of the user who sent the message
 *           required: true
 *         message:
 *           type: string
 *           description: The content of the message
 *           required: true
 *         profilePicture:
 *           type: string
 *           description: The URL of the user's profile picture
 *           required: true
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: The date and time when the message was sent
 *       required:
 *         - clipId
 *         - userId
 *         - user
 *         - message
 *         - profilePicture
 */

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
