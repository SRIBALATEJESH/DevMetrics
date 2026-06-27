const mongoose = require('mongoose');

const GithubReviewSchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    unique: true
  },
  pullRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GithubPullRequest',
    required: true
  },
  repository: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GithubRepository',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  userUsername: {
    type: String
  },
  userAvatar: {
    type: String
  },
  state: {
    type: String,
    required: true
  },
  submittedAt: {
    type: Date,
    required: true
  },
  body: {
    type: String
  },
  url: {
    type: String
  }
});

module.exports = mongoose.model('GithubReview', GithubReviewSchema);
