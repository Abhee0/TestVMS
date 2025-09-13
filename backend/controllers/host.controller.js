// FILE: controllers/host.controller.js

const Visit = require('../models/visit.model');
const Visitor = require('../models/visitor.model');
const AuditLog = require('../models/auditLog.model');
const sharp = require('sharp');
const { sendVisitPass } = require('../utils/email.util');
// Get all visit requests awaiting my approval
exports.getMyVisitRequests = async (req, res) => {
    try {
        const visits = await Visit.find({ host: req.user._id, status: 'AWAITING_APPROVAL' }).sort({ createdAt: -1 });
        res.json(visits);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Get my upcoming (approved/scheduled) visits
exports.getUpcomingVisits = async (req, res) => {
    try {
        const visits = await Visit.find({ 
            host: req.user._id, 
            status: { $in: ['APPROVED', 'SCHEDULED'] } 
        }).sort({ scheduled_at: 1 });
        res.json(visits);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.approveVisit = async (req, res) => {
    try {
        let visit = await Visit.findOne({ _id: req.params.id, host: req.user._id });
        if (!visit) return res.status(404).json({ message: 'Visit not found or not assigned to you.' });

        if(visit.status !== 'AWAITING_APPROVAL') {
            return res.status(400).json({ message: `Visit is already ${visit.status.toLowerCase()} and cannot be approved again.` });
        }

        visit.status = 'APPROVED';
        await visit.save();
        
        await AuditLog.create({
            actor: req.user._id,
            action: 'VISIT_APPROVED',
            details: `Host ${req.user.name} approved visit for ${visit.visitorName}.`,
            visit: visit._id
        });

        // --- SEND THE VISITOR PASS EMAIL ---
        // Fetch the full visitor document to ensure we have the selfie data
        const visitor = await Visitor.findById(visit.visitor);
        if (visitor) {
            await sendVisitPass(visit.toObject(), visitor.toObject()); // Use .toObject() for clean data
        }
        // ------------------------------------

        res.json({ message: 'Visit approved successfully. Pass sent to visitor.', visit });
    } catch (error) {
        console.error("Error in approveVisit:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// Host rejects a visit
exports.rejectVisit = async (req, res) => {
    const { reason } = req.body;
    try {
        const visit = await Visit.findOneAndUpdate(
            { _id: req.params.id, host: req.user._id },
            { status: 'REJECTED', rejectionReason: reason },
            { new: true }
        );
        if (!visit) return res.status(404).json({ message: 'Visit not found or not assigned to you.' });
        
        await AuditLog.create({
            actor: req.user._id,
            action: 'VISIT_REJECTED',
            details: `Host ${req.user.name} rejected visit for ${visit.visitorName}. Reason: ${reason || 'Not specified'}.`,
            visit: visit._id
        });

        // Logic to send rejection email
        res.json({ message: 'Visit rejected.', visit });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Host schedules a new visit
// Host schedules a new visit
exports.scheduleVisit = async (req, res) => {
    try {
        const { name, email, phone, organization, purpose, scheduled_at } = req.body;
        if (!name || !email || !phone || !purpose || !scheduled_at) {
            return res.status(400).json({ message: "Please provide all visitor and visit details." });
        }
        
        const visitorData = { name, email, phone, organization };
        if (req.files && req.files.selfie) {
            const resizedSelfieBuffer = await sharp(req.files.selfie[0].buffer)
                .resize({ width: 150, height: 150, fit: 'cover' })
                .png()
                .toBuffer();

            visitorData.selfie = { data: resizedSelfieBuffer, contentType: 'image/png' };
        }
        if (req.files && req.files.aadhar) {
            visitorData.aadhar = { data: req.files.aadhar[0].buffer, contentType: req.files.aadhar[0].mimetype };
        }

        const visitor = await Visitor.findOneAndUpdate(
            { email },
            { $set: visitorData },
            { new: true, upsert: true, runValidators: true }
        );

        const newVisit = new Visit({
            purpose,
            scheduled_at,
            visitor: visitor._id,
            host: req.user._id,
            company: req.user.company,
            visitorName: visitor.name,
            hostName: req.user.name,
            status: 'SCHEDULED', 
            createdBy: req.user._id,
        });

        await newVisit.save();

        await AuditLog.create({
            actor: req.user._id,
            action: 'VISIT_SCHEDULED',
            details: `Host ${req.user.name} scheduled a visit for ${visitor.name}.`,
            visit: newVisit._id
        });

        // --- SEND THE VISITOR PASS EMAIL ---
        await sendVisitPass(newVisit.toObject(), visitor.toObject()); // Use .toObject() for clean data
        // ------------------------------------

        res.status(201).json({ message: "Visit scheduled successfully. Pass sent to visitor.", visit: newVisit });

    } catch (error) {
        console.error("Error in scheduleVisit:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};