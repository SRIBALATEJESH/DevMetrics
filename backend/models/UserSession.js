const mongoose = require('mongoose');

const UserSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  device: {
    type: String,
    default: 'Unknown Device'
  },
  ip: {
    type: String,
    default: '127.0.0.1'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserSession', UserSessionSchema);
