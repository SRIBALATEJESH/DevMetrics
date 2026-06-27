const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  badgeKey: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  icon: {
    type: String,
    default: '🥇'
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  }
});

// Avoid duplicate badges for the same user
AchievementSchema.index({ user: 1, badgeKey: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', AchievementSchema);
