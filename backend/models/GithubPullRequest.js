const mongoose = require('mongoose');

const GithubPullRequestSchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    unique: true
  },
  number: {
    type: Number,
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
  title: {
    type: String,
    required: true
  },
  state: {
    type: String,
    enum: ['open', 'closed', 'merged'],
    default: 'open'
  },
  userUsername: {
    type: String
  },
  userAvatar: {
    type: String
  },
  merged: {
    type: Boolean,
    default: false
  },
  mergedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    required: true
  },
  updatedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  url: {
    type: String
  }
});

module.exports = mongoose.model('GithubPullRequest', GithubPullRequestSchema);
