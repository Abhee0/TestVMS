// FILE: models/visitor.model.js
const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, sparse: true },
    organization: { type: String },
    selfie: {
        data: Buffer,
        contentType: String
    },
    aadhar: {
        data: Buffer,
        contentType: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Visitor', visitorSchema);