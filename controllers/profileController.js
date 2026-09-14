const User = require('../models/User');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const EmployerProfile = require('../models/EmployerProfile');

const calculateCompletion = (profile) => {
  const fields = [
    profile.fullName,
    profile.phone,
    profile.email,
    profile.location,
    profile.bio,
    profile.skills?.length,
    profile.languages?.length,
    profile.education?.length,
    profile.workExperience?.length,
    profile.cv,
    profile.profilePicture,
  ];

  const completed = fields.filter(Boolean).length;
  return Math.min(100, Math.round((completed / fields.length) * 100));
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (user.role === 'jobseeker') {
      const profile = await JobSeekerProfile.findOne({ user: user._id });
      return res.json({ user, profile });
    }

    if (user.role === 'employer') {
      const profile = await EmployerProfile.findOne({ user: user._id });
      return res.json({ user, profile });
    }

    res.json({ user, profile: null });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load profile.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const { fullName, phone, location, bio, skills, languages, education, workExperience, companyName, description, industry, website, employeeCount, yearEstablished } = req.body;

    if (user.role === 'jobseeker') {
      const profile = await JobSeekerProfile.findOne({ user: user._id });
      const payload = {
        fullName: fullName || profile?.fullName || user.fullName,
        phone: phone || profile?.phone || user.phone,
        email: user.email,
        location: location || profile?.location || user.location,
        bio: bio || profile?.bio || '',
        skills: skills ? JSON.parse(skills) : profile?.skills || [],
        languages: languages ? JSON.parse(languages) : profile?.languages || [],
        education: education ? JSON.parse(education) : profile?.education || [],
        workExperience: workExperience ? JSON.parse(workExperience) : profile?.workExperience || [],
      };

      if (req.files?.profilePicture) payload.profilePicture = `/uploads/${req.files.profilePicture[0].filename}`;
      if (req.files?.cv) payload.cv = `/uploads/${req.files.cv[0].filename}`;

      const finalProfile = profile ? await JobSeekerProfile.findOneAndUpdate({ user: user._id }, payload, { new: true }) : await JobSeekerProfile.create({ user: user._id, ...payload });
      finalProfile.profileCompletion = calculateCompletion(finalProfile);
      await finalProfile.save();

      user.fullName = payload.fullName;
      user.phone = payload.phone;
      user.location = payload.location;
      await user.save();

      return res.json({ message: 'Profile updated successfully.', profile: finalProfile, user });
    }

    if (user.role === 'employer') {
      const profile = await EmployerProfile.findOne({ user: user._id });
      const payload = {
        companyName: companyName || profile?.companyName || user.fullName,
        description: description || profile?.description || '',
        industry: industry || profile?.industry || '',
        location: location || profile?.location || user.location,
        phone: phone || profile?.phone || user.phone,
        email: user.email,
        website: website || profile?.website || '',
        employeeCount: employeeCount || profile?.employeeCount || '',
        yearEstablished: yearEstablished || profile?.yearEstablished || null,
      };

      if (req.files?.companyLogo) payload.logo = `/uploads/${req.files.companyLogo[0].filename}`;

      const finalProfile = profile ? await EmployerProfile.findOneAndUpdate({ user: user._id }, payload, { new: true }) : await EmployerProfile.create({ user: user._id, ...payload });
      user.fullName = payload.companyName;
      user.phone = payload.phone;
      user.location = payload.location;
      await user.save();

      return res.json({ message: 'Employer profile updated successfully.', profile: finalProfile, user });
    }

    res.json({ message: 'Profile update not available for admin users.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to update profile.' });
  }
};
