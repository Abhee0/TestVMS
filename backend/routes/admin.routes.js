// FILE: routes/admin.routes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const {
    createCompany,
    getAllCompanies,
    createUser,
    getAllUsers,
    updateUser,
    deleteUser,
    getVisitsReport,
    getAuditLogs
} = require('../controllers/admin.controller');

// All routes in this file are protected and for admins only
router.use(protect, authorize('admin'));

// Company Routes
router.route('/companies').post(createCompany).get(getAllCompanies);

// User Routes
router.route('/users').post(createUser).get(getAllUsers);
router.route('/users/:id').put(updateUser).delete(deleteUser);

// Audit Log Route
router.get('/audit-logs', getAuditLogs);

// Report Routes
router.get('/reports/visits', getVisitsReport);

module.exports = router;