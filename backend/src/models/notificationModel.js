const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         recipientId:
 *           type: string
 *           description: The ID of the user receiving the notification
 *           required: true
 *         senderId:
 *           type: string
 *           description: The ID of the user who triggered the notification
 *           required: true
 *         senderUsername:
 *           type: string
 *           description: The username of the user who triggered the notification
 *           required: true
 *         type:
 *           type: string
 *           enum: ['comment_reply', 'mention', 'rating', 'system']
 *           description: The type of notification
 *           required: true
 *         entityId:
 *           type: string
 *           description: ID of the related entity (e.g., comment ID)
 *         clipId:
 *           type: string
 *           description: ID of the clip related to this notification
 *           required: true
 *         read:
 *           type: boolean
 *           description: Whether the notification has been read
 *           default: false
 *         message:
 *           type: string
 *           description: The notification message content
 *           required: true
 *         createdAt:
 *           type: date
 *           description: When the notification was created
 *           default: Date.now
 *       required:
 *         - recipientId
 *         - senderId
 *         - senderUsername
 *         - type
 *         - clipId
 *         - message
 */

const notificationSchema = new mongoose.Schema({
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
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
  type: { 
    type: String, 
    enum: ['comment_reply', 'mention', 'rating', 'system'], 
    required: true 
  },
  entityId: { 
    type: mongoose.Schema.Types.ObjectId 
  },
  clipId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Clip', 
    required: true 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  message: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for quick queries
notificationSchema.index({ recipientId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
