// FILE: models/notification.model.js

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // The user who receives the notification
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // The content of the notification
    message: { 
        type: String, 
        required: true 
    },
    // Link to the relevant visit for context
    visit: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Visit' 
    },
    // To track if the user has seen it
    isRead: { 
        type: Boolean, 
        default: false 
    },
    // Type of notification for potential frontend logic (e.g., showing icons)
    type: {
        type: String,
        enum: ['NEW_REQUEST', 'VISITOR_ARRIVED', 'VISIT_APPROVED', 'VISIT_REJECTED'],
        required: true
    }
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);