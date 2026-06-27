const mongoose = require('mongoose');

const ContributorScoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: String,
  role: String,
  tasksScore: Number,
  commitsScore: Number,
  prScore: Number,
  reviewScore: Number,
  issueScore: Number,
  contributionScore: Number,
  collaborationScore: Number,
  period: {
    type: String,
    enum: ['weekly', 'monthly', 'all-time'],
    default: 'all-time'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ContributorScore', ContributorScoreSchema);
