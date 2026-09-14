const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const EmployerProfile = require('../models/EmployerProfile');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'jobconnect-secret', { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role = 'jobseeker', phone = '', location = '' } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password,
      role,
      phone,
      location,
    });

    if (role === 'jobseeker') {
      await JobSeekerProfile.create({
        user: user._id,
        fullName,
        email: user.email,
        phone,
        location,
      });
    }

    if (role === 'employer') {
      await EmployerProfile.create({
        user: user._id,
        companyName: fullName,
        email: user.email,
        phone,
        location,
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Registration failed.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Login failed.' });
  }
};

exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully.' });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load current user.' });
  }
};
