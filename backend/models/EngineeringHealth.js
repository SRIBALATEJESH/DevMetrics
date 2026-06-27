const mongoose = require('mongoose');

const EngineeringHealthSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  projectName: String,
  healthScore: Number,
  productivity: Number,
  codeActivity: Number,
  reviewActivity: Number,
  issueResolution: Number,
  participation: Number,
  calculatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EngineeringHealth', EngineeringHealthSchema);
