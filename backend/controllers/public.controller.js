// FILE: controllers/public.controller.js

const Visit = require('../models/visit.model');
const Visitor = require('../models/visitor.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const AuditLog = require('../models/auditLog.model');
const sharp = require('sharp');

exports.createVisitRequest = async (req, res) => {
    try {
        const { name, email, phone, organization, purpose, host_id, company_id } = req.body;
        
        if (!name || !email || !phone || !purpose || !host_id || !company_id) {
            return res.status(400).json({ message: "Please fill all required fields." });
        }

        const host = await User.findById(host_id);
        if (!host || host.role !== 'host') {
            return res.status(404).json({ message: 'Host not found' });
        }

        const visitorData = { name, email, phone, organization };
       
       // --- START OF MODIFIED IMAGE HANDLING BLOCK ---
        if (req.files && req.files.selfie) {
            const resizedSelfieBuffer = await sharp(req.files.selfie[0].buffer)
                .resize({ width: 150, height: 150, fit: 'cover' }) // Resize to 300x300
                .png() // Convert to PNG for consistency
                .toBuffer();

            visitorData.selfie = { data: resizedSelfieBuffer, contentType: 'image/png' };
        }
        // We don't need to resize the Aadhar, it's just for storage
        if (req.files && req.files.aadhar) {
            visitorData.aadhar = { data: req.files.aadhar[0].buffer, contentType: req.files.aadhar[0].mimetype };
        }
        // --- END OF MODIFIED BLOCK ---

        const visitor = await Visitor.findOneAndUpdate(
            { email }, 
            { $set: visitorData },
            { new: true, upsert: true, runValidators: true }
        );

        const newVisit = new Visit({
            purpose,
            visitor: visitor._id,
            host: host._id,
            company: company_id,
            visitorName: visitor.name,
            hostName: host.name,
            status: 'AWAITING_APPROVAL'
        });

        await newVisit.save();

        // Create a notification for the host
        await Notification.create({
            user: host._id,
            message: `You have a new visit request from ${visitor.name}.`,
            visit: newVisit._id,
            type: 'NEW_REQUEST'
        });

        // Create an audit log for the action
        await AuditLog.create({
            action: 'VISIT_REQUEST_CREATED',
            details: `Public user ${visitor.name} created a request to meet ${host.name}.`,
            visit: newVisit._id
        });

         res.status(201).json({ message: 'Visit request submitted successfully. Awaiting host approval.', visit: newVisit });


    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getVisitStatus = async (req, res) => {
    try {
        const visit = await Visit.findOne({ pass_code: req.params.pass_code })
            .select('status visitorName hostName purpose scheduled_at pass_code');
        if (!visit) {
            return res.status(404).json({ message: 'Visit pass not found' });
        }
        res.json(visit);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getVisitorImage = async (req, res) => {
    try {
        const visitor = await Visitor.findById(req.params.id);
        if (!visitor) return res.status(404).json({ message: 'Visitor not found' });

        const imageField = req.params.type; // 'selfie' or 'aadhar'
        if (!visitor[imageField] || !visitor[imageField].data) {
             return res.status(404).json({ message: 'Image not found' });
        }
        
        res.set('Content-Type', visitor[imageField].contentType);
        res.send(visitor[imageField].data);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

exports.getCompanyHosts = async (req, res) => {
    try {
        const hosts = await User.find({ company: req.params.companyId, role: 'host' }).select('name');
        res.json(hosts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}