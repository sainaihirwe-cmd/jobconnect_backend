const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');
const User = require('../models/User');

exports.createFeedback = async (req, res) => {
  try {
    const { name, email, category, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    const feedback = await Feedback.create({
      name,
      email,
      category: category || 'Idea',
      message,
      user: req.user?._id || null,
    });

    const recipients = await User.find({ role: { $in: ['admin', 'employer'] }, isActive: true }).select('_id');
    if (recipients.length) {
      await Notification.insertMany(recipients.map((recipient) => ({
        user: recipient._id,
        type: 'new-feedback',
        title: `New ${feedback.category.toLowerCase()} received`,
        message: `${feedback.name} sent a new message: ${feedback.message.slice(0, 100)}`,
      })));
    }

    res.status(201).json({ message: 'Thank you. Your message has been received.', feedback });
  } catch (error) {
    res.status(500).json({ message: 'Unable to send your message right now.' });
  }
};