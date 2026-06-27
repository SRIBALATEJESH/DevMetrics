const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Exclude password from query results by default
    // Password is only required for 'local' auth provider
    required: function () {
      return this.authProvider === 'local';
    }
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'github'],
    default: 'local'
  },
  role: {
    type: String,
    enum: ['Admin', 'Project Manager', 'Team Lead', 'Developer', 'Tester'],
    default: 'Developer',
    set: function (val) {
      if (!val) return val;
      const lower = val.toLowerCase();
      if (lower === 'admin') return 'Admin';
      if (lower === 'project manager' || lower === 'pm') return 'Project Manager';
      if (lower === 'team lead' || lower === 'lead') return 'Team Lead';
      if (lower === 'developer' || lower === 'dev') return 'Developer';
      if (lower === 'tester' || lower === 'qa') return 'Tester';
      return val;
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  profilePicture: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'dark'
  },
  density: {
    type: String,
    enum: ['compact', 'comfortable'],
    default: 'comfortable'
  },
  bio: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  publicProfile: {
    type: Boolean,
    default: true
  },
  showContributionScore: {
    type: Boolean,
    default: true
  },
  showActivityTimeline: {
    type: Boolean,
    default: true
  },
  taskAlerts: {
    type: Boolean,
    default: true
  },
  deadlineReminders: {
    type: Boolean,
    default: true
  },
  projectUpdates: {
    type: Boolean,
    default: true
  },
  contributionUpdates: {
    type: Boolean,
    default: true
  },
  emailNotifications: {
    type: Boolean,
    default: false
  },
  githubId: {
    type: String,
    default: ''
  },
  githubUsername: {
    type: String,
    default: ''
  },
  githubAvatar: {
    type: String,
    default: ''
  },
  githubAccessToken: {
    type: String,
    default: ''
  },
  githubConnected: {
    type: Boolean,
    default: false
  },
  skills: {
    type: [String],
    default: []
  },
  favoriteProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  bookmarks: [{
    itemType: { type: String, required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String },
    url: { type: String }
  }],
  streakCount: {
    type: Number,
    default: 0
  },
  lastContributionDate: {
    type: Date
  },
  dashboardConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to hash password (only for local auth)
UserSchema.pre('save', async function (next) {
  // Skip hashing if no password or password not modified
  if (!this.password || !this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare candidate password with stored hash
UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
