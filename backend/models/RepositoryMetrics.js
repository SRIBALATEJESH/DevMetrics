const mongoose = require('mongoose');

const RepositoryMetricsSchema = new mongoose.Schema({
  repository: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GithubRepository',
    required: true,
    index: true
  },
  name: String,
  commitCount: Number,
  openPullRequests: Number,
  mergedPullRequests: Number,
  closedPullRequests: Number,
  openIssues: Number,
  closedIssues: Number,
  languageDistribution: {
    type: Map,
    of: Number,
    default: {}
  },
  activeContributors: Number,
  healthScore: {
    type: Number,
    default: 100
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RepositoryMetrics', RepositoryMetricsSchema);
