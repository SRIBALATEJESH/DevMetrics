const mongoose = require('mongoose');

const ReviewMetricsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  githubUsername: String,
  reviewsGiven: Number,
  reviewsReceived: Number,
  acceptanceRate: Number, // Percentage of reviews that are APPROVED
  averageTurnaroundTime: Number, // In hours
  calculatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ReviewMetrics', ReviewMetricsSchema);
