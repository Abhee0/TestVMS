// FILE: routes/security.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const {
    getCheckedInVisits,
    checkIn,
    checkOut,
    createWalkInVisit
} = require('../controllers/security.controller');

// All routes in this file are protected and for security only
router.use(protect, authorize('security'));

router.get('/checked-in', getCheckedInVisits);
router.post('/check-in', checkIn);
router.patch('/check-out/:id', checkOut);
router.post('/walk-in', createWalkInVisit);

module.exports = router;