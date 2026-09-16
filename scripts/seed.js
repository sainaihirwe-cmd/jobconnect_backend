const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const SavedJob = require('../models/SavedJob');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const EmployerProfile = require('../models/EmployerProfile');

dotenv.config();

const seedData = async ({ reset = false } = {}) => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0 && !reset) {
      const adminPassword = await bcrypt.hash('Admin123!', 10);
      const adminRepair = await User.updateOne(
        { email: 'admin@jobconnectrwanda.rw' },
        { $set: { password: adminPassword, role: 'admin', isActive: true } }
      );
      console.log(
        adminRepair.matchedCount
          ? '[SEED] Existing users found. Admin password repaired; other data was preserved.'
          : '[SEED] Existing users found. No demo admin exists; other data was preserved.'
      );
      return { seeded: false, adminRepaired: adminRepair.matchedCount > 0 };
    }

    if (userCount > 0 && reset) {
      console.log('[SEED] Clearing old database for fresh seeding...');
      await User.deleteMany({});
      await Job.deleteMany({});
      await Application.deleteMany({});
      await Notification.deleteMany({});
      await JobSeekerProfile.deleteMany({});
      await EmployerProfile.deleteMany({});
      await SavedJob.deleteMany({});
      console.log('[SEED] Database cleared.');
    }
    console.log('[SEED] Starting seeding process...');

  // Hash passwords for demo users
  const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  };

  const demoUsers = [
    { fullName: 'Admin User', email: 'admin@jobconnectrwanda.rw', password: 'Admin123!', role: 'admin', phone: '+250788000001', location: 'Kigali' },
    { fullName: 'Aline Mukansanga', email: 'aline.mukansanga@gmail.com', password: 'Password123!', role: 'jobseeker', phone: '+250788111001', location: 'Kigali' },
    { fullName: 'Jean Bosco Ndayisenga', email: 'jean.bosco@gmail.com', password: 'Password123!', role: 'jobseeker', phone: '+250788111002', location: 'Gasabo' },
    { fullName: 'Miriam Uwase', email: 'miriam.uwase@gmail.com', password: 'Password123!', role: 'jobseeker', phone: '+250788111003', location: 'Kicukiro' },
    { fullName: 'Eric Kamali', email: 'eric.kamali@gmail.com', password: 'Password123!', role: 'jobseeker', phone: '+250788111004', location: 'Nyarugenge' },
    { fullName: 'Kigali Tech Hub', email: 'hi@kigalitechhub.rw', password: 'Employer123!', role: 'employer', phone: '+250788333001', location: 'Kigali' },
    { fullName: 'BuildRwanda Construction', email: 'careers@buildrwanda.rw', password: 'Employer123!', role: 'employer', phone: '+250788333002', location: 'Kigali' },
  ];

  const hashedUsers = await Promise.all(
    demoUsers.map(async (user) => ({
      ...user,
      password: await hashPassword(user.password),
    }))
  );

  const createdUsers = await User.insertMany(hashedUsers);
  const employers = createdUsers.filter((u) => u.role === 'employer');
  const jobSeekers = createdUsers.filter((u) => u.role === 'jobseeker');

  await JobSeekerProfile.insertMany(
    jobSeekers.map((u) => ({
      user: u._id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      location: u.location,
      bio: 'Motivated professional looking for a meaningful opportunity.',
      skills: ['Communication', 'Teamwork', 'Problem Solving'],
      languages: ['English', 'French', 'Kinyarwanda'],
      profileCompletion: 85,
    }))
  );

  await EmployerProfile.insertMany(
    employers.map((u) => ({
      user: u._id,
      companyName: u.fullName,
      description: 'A growing local business committed to success.',
      location: u.location,
      phone: u.phone,
      email: u.email,
      yearEstablished: 2020,
    }))
  );

  const jobs = await Job.insertMany([
    {
      title: 'Frontend Developer',
      slug: 'frontend-developer-1',
      employer: employers[0]._id,
      category: 'IT & Technology',
      jobType: 'Full Time',
      location: 'Kigali',
      salaryMin: 800000,
      salaryMax: 1200000,
      description: 'Build responsive web interfaces.',
      requirements: ['React.js', 'HTML/CSS'],
      applicationDeadline: new Date('2026-12-15'),
      status: 'active',
    },
    {
      title: 'Construction Manager',
      slug: 'construction-manager-1',
      employer: employers[1]._id,
      category: 'Construction',
      jobType: 'Full Time',
      location: 'Gasabo',
      salaryMin: 600000,
      salaryMax: 1000000,
      description: 'Manage construction projects.',
      requirements: ['Leadership', 'Project Management'],
      applicationDeadline: new Date('2026-11-30'),
      status: 'active',
    },
  ]);

  await Application.insertMany([
    {
      applicant: jobSeekers[0]._id,
      job: jobs[0]._id,
      coverLetter: 'I am excited to apply for this role.',
      status: 'Pending',
    },
  ]);

  await Notification.insertMany([
    {
      user: jobSeekers[0]._id,
      type: 'application-status',
      title: 'Application received',
      message: 'Your application has been received.',
      read: false,
    },
  ]);

  console.log('[SEED] Demo data created successfully:', {
    users: createdUsers.length,
    jobs: jobs.length,
  });
  return { seeded: true };
  } catch (error) {
    console.error('[SEED] Seeding error:', error.message);
    throw error;
  }
};

if (require.main === module) {
  (async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobconnectrwanda');
      await seedData({ reset: process.env.RESET_DATABASE === 'true' });
      console.log('Demo accounts: admin@jobconnectrwanda.rw / Admin123! | aline.mukansanga@gmail.com / Password123! | hi@kigalitechhub.rw / Employer123!');
      await mongoose.disconnect();
    } catch (error) {
      console.error('Seed error:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = seedData;
