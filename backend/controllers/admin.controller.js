// FILE: controllers/admin.controller.js

const User = require('../models/user.model');
const Company = require('../models/company.model');
const Visit = require('../models/visit.model');
const bcrypt = require('bcryptjs');
const AuditLog = require('../models/auditLog.model');

// --- Company Management ---
exports.createCompany = async (req, res) => {
    try {
        const newCompany = await Company.create(req.body);
        res.status(201).json(newCompany);
    } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find();
        res.json(companies);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- User Management ---
exports.createUser = async (req, res) => {
    const { name, email, password, role, company } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });
        
        const newUser = new User({ name, email, password_hash: password, role, company });
        await newUser.save();

        res.status(201).json({ _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role });
    } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().populate('company', 'name').select('-password_hash');
        res.json(users);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateUser = async (req, res) => {
    try {
        const { name, email, role, company, password } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ message: 'User not found' });
        
        user.name = name || user.name;
        user.email = email || user.email;
        user.role = role || user.role;
        user.company = company || user.company;
        if (password) {
             const salt = await bcrypt.genSalt(10);
             user.password_hash = await bcrypt.hash(password, salt);
        }

        const updatedUser = await user.save();
        res.json({ _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role });
    } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- Audit Log ---
exports.getAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const skip = (page - 1) * limit;

        const logs = await AuditLog.find()
            .populate('actor', 'name role') // Populate who did the action
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await AuditLog.countDocuments();
        
        res.json({
            logs,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalLogs: total
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- Reporting ---
exports.getVisitsReport = async (req, res) => {
    try {
        const { companyId, startDate, endDate } = req.query;
        let query = {};

        if (companyId) query.company = companyId;
        if (startDate && endDate) {
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const visits = await Visit.find(query)
            .populate('visitor', 'name email')
            .populate('host', 'name')
            .populate('company', 'name')
            .sort({ createdAt: -1 });

        res.json(visits);
    } catch (error) { res.status(500).json({ message: error.message }); }
};