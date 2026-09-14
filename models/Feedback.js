const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    category: { type: String, enum: ['Idea', 'Feedback', 'Support', 'Partnership'], default: 'Idea' },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['New', 'Read', 'Resolved'], default: 'New' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);