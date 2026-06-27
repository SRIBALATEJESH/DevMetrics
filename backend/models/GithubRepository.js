const mongoose = require('mongoose');

const GithubRepositorySchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  owner: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  url: {
    type: String
  },
  language: {
    type: String
  },
  stars: {
    type: Number,
    default: 0
  },
  forks: {
    type: Number,
    default: 0
  },
  visibility: {
    type: String,
    default: 'public'
  },
  defaultBranch: {
    type: String,
    default: 'main'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  lastSync: {
    type: Date
  },
  status: {
    type: String,
    enum: ['linked', 'unlinked'],
    default: 'unlinked'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GithubRepository', GithubRepositorySchema);
