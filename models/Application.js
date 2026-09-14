const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applicantDetails: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
    },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    coverLetter: { type: String, default: '' },
    cv: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'In Review', 'Reviewed', 'Shortlisted', 'Accepted', 'Rejected', 'Withdrawn'],
      default: 'Pending',
    },
    dateApplied: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

applicationSchema.index({ applicant: 1, job: 1 }, { unique: true });
applicationSchema.index({ job: 1, dateApplied: -1 });

module.exports = mongoose.model('Application', applicationSchema);
