const mongoose = require('mongoose');

const IssueMetricsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  githubUsername: String,
  openIssuesCount: Number,
  closedIssuesCount: Number,
  resolutionRate: Number, // closed / total
  averageResolutionTime: Number, // In hours
  bugsFixed: Number,
  calculatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('IssueMetrics', IssueMetricsSchema);
