const express = require('express');
const { getApplications, getApplicationById, updateApplicationStatus } = require('../controllers/applicationController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getApplications);
router.get('/:id', protect, getApplicationById);
router.put('/:id/status', protect, requireRole('employer', 'admin'), updateApplicationStatus);

module.exports = router;
