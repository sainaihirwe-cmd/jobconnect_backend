const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Report = require('../models/Report');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const EmployerProfile = require('../models/EmployerProfile');

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalJobs, totalApplications, totalReports] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
      Report.countDocuments(),
    ]);

    const stats = {
      totalUsers,
      totalJobSeekers: await User.countDocuments({ role: 'jobseeker' }),
      totalEmployers: await User.countDocuments({ role: 'employer' }),
      totalJobs,
      activeJobs: await Job.countDocuments({ status: 'active' }),
      totalApplications,
      pendingReports: await Report.countDocuments({ status: 'pending' }),
      activeUsers: await User.countDocuments({ isActive: true }),
    };

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: 'Unable to calculate dashboard stats.' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load users.' });
  }
};

exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({}).populate('employer', 'fullName email role');
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load jobs.' });
  }
};

exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find({}).populate('applicant', 'fullName email').populate('job', 'title');
    res.json({ applications });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load applications.' });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.isActive = isActive;
    await user.save();
    res.json({ message: 'User status updated.', user });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update user status.' });
  }
};

exports.deleteJobByAdmin = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    await job.deleteOne();
    res.json({ message: 'Job removed by admin.' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to remove job.' });
  }
};
