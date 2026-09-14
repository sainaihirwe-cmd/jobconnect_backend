const mongoose = require('mongoose');

const userSkillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    level: { type: String, default: 'Intermediate' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserSkill', userSkillSchema);
