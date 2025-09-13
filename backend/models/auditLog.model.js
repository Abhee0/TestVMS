// FILE: models/auditLog.model.js

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    // The logged-in user who performed the action. Can be null for public actions.
    actor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    // A machine-readable action type
    action: { 
        type: String, 
        required: true 
    },
    // A human-readable description of the event
    details: { 
        type: String, 
        required: true 
    },
    // The visit that was affected, if any
    visit: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Visit' 
    },
     // The user that was affected, if any (e.g., admin deletes a user)
    targetUser: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);