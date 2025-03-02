const express = require('express');
const router = express.Router();
const Notification = require('../models/notificationModel');
const authorizeRoles = require('./middleware/AuthorizeRoles');

/**
 * Get current user's notifications
 */
router.get('/', authorizeRoles(['user', 'clipteam', 'editor', 'uploader', 'admin']), async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to latest 50 notifications
      
    // Count unread notifications
    const unreadCount = await Notification.countDocuments({ 
      recipientId: req.user.id,
      read: false
    });
    
    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Get count of unread notifications
 */
router.get('/unread-count', authorizeRoles(['user', 'clipteam', 'editor', 'uploader', 'admin']), async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ 
      recipientId: req.user.id,
      read: false
    });
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Mark a notification as read
 */
router.put('/:id/read', authorizeRoles(['user', 'clipteam', 'editor', 'uploader', 'admin']), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Verify ownership
    if (notification.recipientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this notification' });
    }
    
    notification.read = true;
    await notification.save();
    
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Mark all notifications as read
 */
router.put('/read-all', authorizeRoles(['user', 'clipteam', 'editor', 'uploader', 'admin']), async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: req.user.id, read: false },
      { $set: { read: true } }
    );
    
    res.json({ 
      success: true, 
      message: `Marked ${result.modifiedCount} notifications as read` 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Delete a notification
 */
router.delete('/:id', authorizeRoles(['user', 'clipteam', 'editor', 'uploader', 'admin']), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Verify ownership
    if (notification.recipientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this notification' });
    }
    
    await notification.remove();
    
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
