const express = require('express');
const router = express.Router();

const Message = require('../models/messageModel');
const authorizeRoles = require('./middleware/AuthorizeRoles');

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
router.post('/', authorizeRoles(['clipteam', 'admin']), async (req, res) => {
    const { clipId, userId, user, message, profilePicture } = req.body;

    try {
        const newMessage = new Message({ clipId, userId, user, message, profilePicture });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
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