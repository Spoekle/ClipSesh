const express = require('express');
const router = express.Router();

const Message = require('../models/messageModel');
const authorizeRoles = require('./middleware/AuthorizeRoles');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');

// GET messages for a specific clip
router.get('/', authorizeRoles(['clipteam', 'editor', 'uploader', 'admin']), async (req, res) => {
    const { clipId } = req.query;

    try {
        const messages = await Message.find({ clipId }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// POST a new message
router.post('/', authorizeRoles(['admin', 'clipteam', 'editor', 'uploader']), async (req, res) => {
    const { clipId, userId, user, message, profilePicture } = req.body;

    try {
        const newMessage = new Message({ clipId, userId, user, message, profilePicture, timestamp: new Date() });
        await newMessage.save();

        // Create notifications for all clipteam members
        // Find all clip team members and admins to notify them
        const clipTeamMembers = await User.find({
            roles: { $in: ['clipteam', 'admin'] },
            _id: { $ne: userId } // Don't notify the sender
        }).select('_id');

        // Prepare the notification message
        const clipInfo = await Clip.findById(clipId).select('title streamer');
        const clipTitle = clipInfo ? clipInfo.title : 'a clip';
        const clipStreamer = clipInfo ? clipInfo.streamer : '';
        const notificationMessage = `${user} posted a team message on ${clipStreamer}'s clip: "${clipTitle}"`;

        // Create a notification for each team member
        const notifications = clipTeamMembers.map(member => ({
            recipientId: member._id,
            senderId: userId,
            senderUsername: user,
            type: 'team_message',
            entityId: newMessage._id,
            clipId,
            message: notificationMessage
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE a message
router.delete('/:id', authorizeRoles(['clipteam', 'admin']), async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    try {
        const message = await Message.findById(id);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (req.user.roles.includes('admin') || message.userId.toString() === userId) {
            await message.remove();
            return res.status(200).json({ message: 'Message deleted' });
        }

        res.status(403).json({ error: 'Unauthorized to delete this message' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

module.exports = router;