const express = require('express');
const { getJobs, getEmployerJobs, getJobById, createJob, updateJob, deleteJob, searchJobs, applyForJob, saveJob, removeSavedJob, getSavedJobs, getRecommendedJobs } = require('../controllers/jobController');
const { protect, requireRole } = require('../middleware/auth');
const upload = require('../utils/fileUpload');

const router = express.Router();

router.get('/', getJobs);
router.get('/search', searchJobs);
router.get('/recommended', protect, requireRole('jobseeker'), getRecommendedJobs);
router.get('/employer/mine', protect, requireRole('employer', 'admin'), getEmployerJobs);
router.get('/:id', getJobById);
router.post('/', protect, requireRole('employer', 'admin'), createJob);
router.put('/:id', protect, updateJob);
router.delete('/:id', protect, deleteJob);
router.post('/:id/apply', protect, requireRole('jobseeker'), upload.single('cv'), applyForJob);
router.get('/saved/all', protect, requireRole('jobseeker'), getSavedJobs);
router.post('/saved/:jobId', protect, requireRole('jobseeker'), saveJob);
router.delete('/saved/:jobId', protect, requireRole('jobseeker'), removeSavedJob);

module.exports = router;
