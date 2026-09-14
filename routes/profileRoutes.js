const express = require('express');
const { getProfile, updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const upload = require('../utils/fileUpload');

const router = express.Router();

router.get('/', protect, getProfile);
router.put('/', protect, upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'companyLogo', maxCount: 1 },
  { name: 'cv', maxCount: 1 },
]), updateProfile);
router.put('/password', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: 'User not found.' });
    const passwordMatches = await user.matchPassword(currentPassword);
    if (!passwordMatches) return res.status(400).json({ message: 'Current password is incorrect.' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to change password.' });
  }
});

module.exports = router;
