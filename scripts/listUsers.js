const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobconnectrwanda';
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('[LISTUSERS] Connected to', uri);
    const users = await User.find({}).select('fullName email role isActive password createdAt').lean();
    console.log('[LISTUSERS] Users:');
    users.forEach((u) => {
      console.log(`- ${u.fullName} | ${u.email} | role=${u.role} | active=${u.isActive} | pwdHash=${String(u.password).slice(0,20)}... | created=${u.createdAt}`);
    });
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[LISTUSERS] Error:', err.message || err);
    process.exit(2);
  }
};

run();
