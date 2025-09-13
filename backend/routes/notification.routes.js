// FILE: routes/notification.routes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getMyNotifications, markAsRead } = require('../controllers/notification.controller');

// All notification routes are protected and require a logged-in user
router.use(protect);

router.get('/', getMyNotifications);
router.patch('/:id/read', markAsRead);

module.exports = router;