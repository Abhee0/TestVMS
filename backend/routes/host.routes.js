// FILE: routes/host.routes.js (Updated)

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware'); // <-- 1. IMPORT UPLOAD
const {
    getMyVisitRequests,
    getUpcomingVisits,
    approveVisit,
    rejectVisit,
    scheduleVisit
} = require('../controllers/host.controller');

// All routes in this file are protected and for hosts only
router.use(protect, authorize('host'));

// 2. DEFINE THE FILE UPLOAD FIELDS
const imageUploads = upload.fields([{ name: 'selfie', maxCount: 1 }, { name: 'aadhar', maxCount: 1 }]);

router.get('/requests', getMyVisitRequests);
router.get('/upcoming', getUpcomingVisits);
router.patch('/visits/:id/approve', approveVisit);
router.patch('/visits/:id/reject', rejectVisit);

// 3. APPLY THE MIDDLEWARE TO THE SCHEDULE ROUTE
router.post('/schedule', imageUploads, scheduleVisit);

module.exports = router;