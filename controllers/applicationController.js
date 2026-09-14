const Application = require('../models/Application');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const JobSeekerProfile = require('../models/JobSeekerProfile');

exports.getApplications = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'jobseeker') query.applicant = req.user._id;
    if (req.user.role === 'employer') {
      const jobs = await Job.find({ employer: req.user._id }).select('_id');
      const jobIds = jobs.map((job) => job._id);
      query.job = { $in: jobIds };
    }

    const apps = await Application.find(query)
      .sort({ dateApplied: -1 })
      .populate('job')
      .populate('applicant', 'fullName email phone location avatar');
    res.json({ applications: apps });
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch applications.' });
  }
};

exports.getApplicationById = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id).populate('job').populate('applicant', 'fullName email phone location avatar');
    if (!app) return res.status(404).json({ message: 'Application not found.' });

    if (req.user.role !== 'admin' && (!app.job || app.job.employer.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'You do not have permission to view this application.' });
    }

    const applicantProfile = await JobSeekerProfile.findOne({ user: app.applicant._id }).select('-__v');
    res.json({ application: app, applicantProfile });
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch application.' });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required.' });

    const application = await Application.findById(req.params.id).populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found.' });

    if (req.user.role !== 'admin' && application.job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to update this application.' });
    }

    application.status = status;
    await application.save();

    await Notification.create({
      user: application.applicant,
      type: 'application-status',
      title: 'Application status updated',
      message: `Your application for ${application.job.title} is now ${status}.`,
      relatedApplication: application._id,
      relatedJob: application.job._id,
    });

    res.json({ message: 'Application status updated.', application });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to update application.' });
  }
};
