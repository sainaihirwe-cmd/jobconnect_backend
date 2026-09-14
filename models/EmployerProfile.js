const mongoose = require('mongoose');

const employerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String, default: '' },
    description: { type: String, default: '' },
    industry: { type: String, default: '' },
    location: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    employeeCount: { type: String, default: '' },
    yearEstablished: { type: Number, default: null },
    logo: { type: String, default: '' },
    activeJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmployerProfile', employerProfileSchema);
