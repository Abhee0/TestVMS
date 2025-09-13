// FILE: controllers/notification.controller.js

const Notification = require('../models/notification.model');

// Get all (or unread) notifications for the logged-in user
exports.getMyNotifications = async (req, res) => {
    try {
        // Find notifications for the current user, newest first
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50); // Limit to the 50 most recent notifications
        
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Mark a specific notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id }, // Ensure users can only mark their own
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json({ message: 'Notification marked as read.', notification });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};