const express = require('express');
const { createReport, getReports, updateReportStatus } = require('../controllers/reportController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createReport);
router.get('/', protect, requireRole('admin'), getReports);
router.put('/:id/status', protect, requireRole('admin'), updateReportStatus);

module.exports = router;
