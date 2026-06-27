const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a report title'],
    trim: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required for reports']
  },
  type: {
    type: String,
    enum: ['project', 'team', 'individual'],
    required: true,
    lowercase: true
  },
  format: {
    type: String,
    enum: ['pdf', 'excel'],
    required: true,
    lowercase: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', ReportSchema);
