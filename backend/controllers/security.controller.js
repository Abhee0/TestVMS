// FILE: controllers/security.controller.js

const Visit = require('../models/visit.model');
const Visitor = require('../models/visitor.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const AuditLog = require('../models/auditLog.model');

// Get all visitors currently checked in
exports.getCheckedInVisits = async (req, res) => {
    try {
        const visits = await Visit.find({ company: req.user.company, status: 'CHECKED_IN' }).sort({ checkin_time: -1 });
        res.json(visits);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Check-in a visitor using their pass code
exports.checkIn = async (req, res) => {
    const { pass_code } = req.body;
    try {
        const visit = await Visit.findOneAndUpdate(
            { pass_code, company: req.user.company, status: { $in: ['APPROVED', 'SCHEDULED'] } },
            { status: 'CHECKED_IN', checkin_time: new Date() },
            { new: true }
        );
        if (!visit) return res.status(404).json({ message: 'Invalid pass, or visit is not approved/scheduled for your company.' });

        // Notify the host that their visitor has arrived
        await Notification.create({
            user: visit.host, // The ID of the host is stored on the visit
            message: `Your visitor, ${visit.visitorName}, has checked in.`,
            visit: visit._id,
            type: 'VISITOR_ARRIVED'
        });

        // Create an audit log
        await AuditLog.create({
            actor: req.user._id,
            action: 'VISIT_CHECKED_IN',
            details: `Security ${req.user.name} checked in ${visit.visitorName}.`,
            visit: visit._id
        });
        
        res.json({ message: 'Visitor checked in successfully.', visit });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Check-out a visitor by their visit ID
exports.checkOut = async (req, res) => {
    try {
        const visit = await Visit.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company, status: 'CHECKED_IN' },
            { status: 'CHECKED_OUT', checkout_time: new Date() },
            { new: true }
        );
        if (!visit) return res.status(404).json({ message: 'Visit not found or visitor is not checked in.' });
        
        await AuditLog.create({
            actor: req.user._id,
            action: 'VISIT_CHECKED_OUT',
            details: `Security ${req.user.name} checked out ${visit.visitorName}.`,
            visit: visit._id
        });
        
        res.json({ message: 'Visitor checked out successfully.', visit });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Manually create a pass for a walk-in visitor
exports.createWalkInVisit = async (req, res) => {
    try {
        const { name, email, phone, organization, purpose, host_id } = req.body;
         if (!name || !email || !phone || !purpose || !host_id) {
            return res.status(400).json({ message: "Please fill all required fields." });
        }

        const host = await User.findById(host_id);
        if (!host || host.role !== 'host') {
            return res.status(404).json({ message: 'Host not found' });
        }

        const visitor = await Visitor.findOneAndUpdate(
            { email }, 
            { $set: { name, email, phone, organization } },
            { new: true, upsert: true, runValidators: true }
        );
        
        const newVisit = new Visit({
            purpose,
            visitor: visitor._id,
            host: host._id,
            company: req.user.company,
            visitorName: visitor.name,
            hostName: host.name,
            status: 'AWAITING_APPROVAL', // Still needs host approval
            createdBy: req.user._id,
        });

        await newVisit.save();

        await Notification.create({
            user: host._id,
            message: `A walk-in visit for ${visitor.name} was created by security and needs your approval.`,
            visit: newVisit._id,
            type: 'NEW_REQUEST'
        });

        await AuditLog.create({
            actor: req.user._id,
            action: 'WALK_IN_CREATED',
            details: `Security ${req.user.name} created a walk-in request for ${visitor.name} to meet ${host.name}.`,
            visit: newVisit._id
        });

        res.status(201).json({ message: 'Walk-in visit created. Awaiting host approval.', visit: newVisit });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};