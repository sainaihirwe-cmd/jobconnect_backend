const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployerProfile' },
    category: { type: String, required: true },
    jobType: {
      type: String,
      enum: ['Full Time', 'Part Time', 'Temporary', 'Freelance', 'Internship', 'Contract'],
      required: true,
    },
    location: { type: String, required: true },
    salaryMin: { type: Number, default: 0 },
    salaryMax: { type: Number, default: 0 },
    description: { type: String, required: true },
    responsibilities: [{ type: String }],
    requirements: [{ type: String }],
    applicationDeadline: { type: Date, required: true },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    status: { type: String, enum: ['active', 'closed', 'draft'], default: 'active' },
    featured: { type: Boolean, default: false },
    postedAt: { type: Date, default: Date.now },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

jobSchema.index({ title: 'text', description: 'text', location: 'text', category: 'text' });
jobSchema.index({ location: 1, category: 1, jobType: 1, status: 1 });

module.exports = mongoose.model('Job', jobSchema);
