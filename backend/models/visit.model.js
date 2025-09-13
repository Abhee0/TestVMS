// FILE: models/visit.model.js
const mongoose = require('mongoose');
const short = require('short-uuid');

const visitSchema = new mongoose.Schema({
    pass_code: {
        type: String,
        required: true,
        unique: true,
        default: () => short.generate()
    },
    purpose: { type: String, required: true },
    status: {
        type: String,
        required: true,
        enum: ['SCHEDULED', 'AWAITING_APPROVAL', 'APPROVED', 'REJECTED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'],
        default: 'AWAITING_APPROVAL'
    },
    rejectionReason: { type: String },
    checkin_time: { type: Date },
    checkout_time: { type: Date },
    scheduled_at: { type: Date, default: Date.now },
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    visitorName: { type: String, required: true },
    hostName: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // To track if security created the visit
}, { timestamps: true });

module.exports = mongoose.model('Visit', visitSchema);