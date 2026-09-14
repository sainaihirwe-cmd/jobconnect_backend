const slugify = require('slugify');
const Job = require('../models/Job');
const Application = require('../models/Application');
const SavedJob = require('../models/SavedJob');
const Notification = require('../models/Notification');
const JobSeekerProfile = require('../models/JobSeekerProfile');

const getJobMatchScore = (profile, job) => {
  if (!profile) return 0;
  const skills = profile.skills || [];
  const skillMatches = skills.filter((skill) => {
    return job.title.toLowerCase().includes(skill.toLowerCase()) || job.description.toLowerCase().includes(skill.toLowerCase()) || (job.category || '').toLowerCase().includes(skill.toLowerCase());
  }).length;

  const skillScore = (skillMatches / Math.max(1, skills.length)) * 50;
  const locationScore = profile.location && job.location && profile.location.toLowerCase() === job.location.toLowerCase() ? 30 : 0;
  const categoryScore = profile.location && job.category && profile.location ? 20 : 0;

  return Math.min(100, skillScore + locationScore + categoryScore);
};

exports.getJobs = async (req, res) => {
  try {
    const { keyword, location, category, jobType, minSalary, page = 1, limit = 12, sort = 'newest' } = req.query;
    const query = { status: 'active' };

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { category: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (location) query.location = { $regex: location, $options: 'i' };
    if (category) query.category = { $regex: category, $options: 'i' };
    if (jobType) query.jobType = jobType;
    if (minSalary) query.salaryMin = { $gte: Number(minSalary) || 0 };

    const sortOptions = {
      newest: { postedAt: -1 },
      oldest: { postedAt: 1 },
      salaryHigh: { salaryMax: -1 },
      salaryLow: { salaryMax: 1 },
    };

    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('employer', 'fullName avatar');

    res.json({ jobs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load jobs.' });
  }
};

exports.getEmployerJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id })
      .sort({ postedAt: -1 })
      .limit(50)
      .populate('employer', 'fullName avatar');
    res.json({ jobs, total: jobs.length, page: 1, pages: 1 });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load your jobs.' });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('employer', 'fullName avatar');
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    res.json({ job });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load job details.' });
  }
};

exports.createJob = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'employer' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Only employers can post jobs.' });
    }

    const { title, category, jobType, location, salaryMin, salaryMax, description, responsibilities, requirements, applicationDeadline, contactEmail, contactPhone } = req.body;

    if (!title || !category || !jobType || !location || !description || !applicationDeadline) {
      return res.status(400).json({ message: 'Please complete all required job fields.' });
    }

    const job = await Job.create({
      title,
      slug: `${slugify(title, { lower: true, strict: true })}-${Date.now()}`,
      employer: user._id,
      category,
      jobType,
      location,
      salaryMin: Number(salaryMin || 0),
      salaryMax: Number(salaryMax || 0),
      description,
      responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
      requirements: Array.isArray(requirements) ? requirements : [],
      applicationDeadline: new Date(applicationDeadline),
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      status: 'active',
    });

    res.status(201).json({ message: 'Job posted successfully.', job });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to create job.' });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    if (req.user.role !== 'admin' && job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot edit this job.' });
    }

    Object.assign(job, req.body);
    await job.save();
    res.json({ message: 'Job updated successfully.', job });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update job.' });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    if (req.user.role !== 'admin' && job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot delete this job.' });
    }

    await job.remove();
    res.json({ message: 'Job deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete job.' });
  }
};

exports.searchJobs = async (req, res) => {
  return this.getJobs(req, res);
};

exports.applyForJob = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'jobseeker') {
      return res.status(403).json({ message: 'Only job seekers can apply.' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    if (job.status !== 'active') {
      return res.status(400).json({ message: 'This job is no longer accepting applications.' });
    }
    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
      return res.status(400).json({ message: 'The application deadline has passed.' });
    }

    const existing = await Application.findOne({ applicant: user._id, job: job._id });
    if (existing) {
      return res.status(400).json({ message: 'You already applied for this job.' });
    }

    const cv = req.file ? `/uploads/${req.file.filename}` : '';
    let application;
    try {
      application = await Application.create({
        applicant: user._id,
        applicantDetails: {
          fullName: req.body.fullName || user.fullName,
          email: req.body.email || user.email,
          phone: req.body.phone || user.phone || '',
          location: req.body.location || user.location || '',
        },
        job: job._id,
        coverLetter: req.body.coverLetter || '',
        cv,
        status: 'Pending',
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'You already applied for this job.' });
      }
      throw error;
    }

    await Notification.create({
      user: user._id,
      type: 'application-submitted',
      title: 'Application submitted',
      message: `Your application for ${job.title} has been received.`,
      relatedJob: job._id,
      relatedApplication: application._id,
    });

    await Notification.create({
      user: job.employer,
      type: 'new-application',
      title: 'New job application',
      message: `${user.fullName || 'A job seeker'} applied for ${job.title}.`,
      relatedJob: job._id,
      relatedApplication: application._id,
    });

    res.status(201).json({ message: 'Application submitted successfully.', application });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Application failed.' });
  }
};

exports.getSavedJobs = async (req, res) => {
  try {
    const saved = await SavedJob.find({ user: req.user._id }).populate('job');
    res.json({ savedJobs: saved });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load saved jobs.' });
  }
};

exports.saveJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const existing = await SavedJob.findOne({ user: req.user._id, job: jobId });
    if (existing) {
      return res.status(400).json({ message: 'This job is already saved.' });
    }

    const saved = await SavedJob.create({ user: req.user._id, job: jobId });
    res.status(201).json({ message: 'Job saved successfully.', savedJob: saved });
  } catch (error) {
    res.status(500).json({ message: 'Unable to save job.' });
  }
};

exports.removeSavedJob = async (req, res) => {
  try {
    const result = await SavedJob.deleteOne({ user: req.user._id, job: req.params.jobId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Saved job not found.' });
    }
    res.json({ message: 'Saved job removed.' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to remove saved job.' });
  }
};

exports.getRecommendedJobs = async (req, res) => {
  try {
    const profile = await JobSeekerProfile.findOne({ user: req.user._id });
    const jobs = await Job.find({ status: 'active' }).sort({ postedAt: -1 });

    const ranked = jobs
      .map((job) => ({
        ...job.toObject(),
        score: getJobMatchScore(profile, job),
      }))
      .filter((job) => job.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    res.json({ jobs: ranked });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load recommended jobs.' });
  }
};
