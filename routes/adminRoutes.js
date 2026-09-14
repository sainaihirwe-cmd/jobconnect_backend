const express = require('express');
const { getDashboardStats, getAllUsers, getAllJobs, getAllApplications, updateUserStatus, deleteJobByAdmin } = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(protect, requireRole('admin'));
router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/jobs', getAllJobs);
router.get('/applications', getAllApplications);
router.put('/users/:id/status', updateUserStatus);
router.delete('/jobs/:id', deleteJobByAdmin);

module.exports = router;
