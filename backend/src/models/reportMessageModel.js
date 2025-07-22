const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     ReportMessage:
 *       type: object
 *       required:
 *         - reportId
 *         - senderId
 *         - message
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the message
 *         reportId:
 *           type: string
 *           description: ID of the report this message belongs to
 *         senderId:
 *           type: string
 *           description: ID of the user who sent the message
 *         senderUsername:
 *           type: string
 *           description: Username of the user who sent the message
 *         senderRole:
 *           type: string
 *           enum: [reporter, admin]
 *           description: Role of the message sender
 *         message:
 *           type: string
 *           description: Message content
 *         isInternal:
 *           type: boolean
 *           default: false
 *           description: Whether this message is only visible to admins
 *         readBy:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               username:
 *                 type: string
 *               readAt:
 *                 type: string
 *                 format: date-time
 *           description: Users who have read this message
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the message was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the message was last updated
 */
const reportMessageSchema = new mongoose.Schema({
    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderUsername: {
        type: String,
        required: true
    },
    senderRole: {
        type: String,
        enum: ['reporter', 'admin'],
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    isInternal: {
        type: Boolean,
        default: false
    },
    readBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        username: {
            type: String,
            required: true
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Create indexes for better query performance
reportMessageSchema.index({ reportId: 1, createdAt: -1 });
reportMessageSchema.index({ senderId: 1 });
reportMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ReportMessage', reportMessageSchema);
