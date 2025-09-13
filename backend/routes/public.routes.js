// FILE: routes/public.routes.js
const express = require('express');
const router = express.Router();
const { createVisitRequest, getVisitStatus, getVisitorImage, getCompanyHosts } = require('../controllers/public.controller');
const upload = require('../middleware/upload.middleware');

const imageUploads = upload.fields([{ name: 'selfie', maxCount: 1 }, { name: 'aadhar', maxCount: 1 }]);

router.post('/visits', imageUploads, createVisitRequest);
router.get('/visits/:pass_code', getVisitStatus);
router.get('/hosts/:companyId', getCompanyHosts);
router.get('/visitors/:id/image/:type', getVisitorImage);

module.exports = router;