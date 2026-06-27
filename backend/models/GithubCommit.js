const mongoose = require('mongoose');

const GithubCommitSchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    unique: true
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
  sha: {
    type: String,
    required: true
  },
  message: {
    type: String
  },
  authorName: {
    type: String
  },
  authorEmail: {
    type: String
  },
  authorUsername: {
    type: String
  },
  authorAvatar: {
    type: String
  },
  date: {
    type: Date,
    required: true
  },
  url: {
    type: String
  },
  additions: {
    type: Number,
    default: 0
  },
  deletions: {
    type: Number,
    default: 0
  },
  changedFiles: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GithubCommit', GithubCommitSchema);
