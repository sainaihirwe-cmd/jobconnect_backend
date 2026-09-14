const Report = require('../models/Report');

exports.createReport = async (req, res) => {
  try {
    const { reason, description, reportedUser, reportedJob } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Please provide a reason for the report.' });
    }

    const report = await Report.create({
      reporter: req.user._id,
      reason,
      description: description || '',
      reportedUser: reportedUser || null,
      reportedJob: reportedJob || null,
      status: 'pending',
    });

    res.status(201).json({ message: 'Report submitted successfully.', report });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to submit report.' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find({}).populate('reporter', 'fullName email role').populate('reportedUser', 'fullName email role').populate('reportedJob', 'title');
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load reports.' });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required.' });

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    report.status = status;
    await report.save();
    res.json({ message: 'Report updated.', report });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update report.' });
  }
};
