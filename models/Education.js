const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    field: { type: String, default: '' },
    startYear: { type: String, default: '' },
    endYear: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Education', educationSchema);
