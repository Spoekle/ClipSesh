const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       required:
 *         - clipId
 *         - reporterId
 *         - reason
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the report
 *         clipId:
 *           type: string
 *           description: ID of the reported clip
 *         clipTitle:
 *           type: string
 *           description: Title of the reported clip
 *         clipStreamer:
 *           type: string
 *           description: Streamer of the reported clip
 *         clipSubmitter:
 *           type: string
 *           description: Submitter of the reported clip
 *         reporterId:
 *           type: string
 *           description: ID of the user who reported the clip
 *         reporterUsername:
 *           type: string
 *           description: Username of the user who reported the clip
 *         reason:
 *           type: string
 *           description: Reason for the report
 *         status:
 *           type: string
 *           enum: [pending, reviewed, resolved, dismissed]
 *           default: pending
 *           description: Status of the report
 *         reviewedBy:
 *           type: string
 *           description: Admin who reviewed the report
 *         reviewedAt:
 *           type: string
 *           format: date-time
 *           description: When the report was reviewed
 *         adminNotes:
 *           type: string
 *           description: Admin notes on the report
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the report was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the report was last updated
 */
const reportSchema = new mongoose.Schema({
    clipId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clip',
        required: true
    },
    clipTitle: {
        type: String,
        required: true
    },
    clipStreamer: {
        type: String,
        required: true
    },
    clipSubmitter: {
        type: String,
        required: true
    },
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reporterUsername: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
        default: 'pending'
    },
    reviewedBy: {
        type: String,
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    adminNotes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Create indexes for better query performance
reportSchema.index({ clipId: 1 });
reportSchema.index({ reporterId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
