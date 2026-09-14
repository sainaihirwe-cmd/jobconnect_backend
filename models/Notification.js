const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, default: 'info' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    relatedJob: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    relatedApplication: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
