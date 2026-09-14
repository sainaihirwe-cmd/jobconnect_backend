const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema(
  {
    institution: String,
    degree: String,
    field: String,
    startYear: String,
    endYear: String,
    description: String,
  },
  { _id: true }
);

const experienceSchema = new mongoose.Schema(
  {
    company: String,
    role: String,
    location: String,
    startDate: String,
    endDate: String,
    description: String,
  },
  { _id: true }
);

const jobSeekerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    location: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    languages: [{ type: String }],
    education: [educationSchema],
    workExperience: [experienceSchema],
    profilePicture: { type: String, default: '' },
    cv: { type: String, default: '' },
    profileCompletion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobSeekerProfile', jobSeekerProfileSchema);
