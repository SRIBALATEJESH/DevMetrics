const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    let query = {};
    
    // Only admin, project manager, or team lead can fetch all profiles.
    // Standard users (developers, testers) only see public profiles (publicProfile !== false)
    // plus their own profile.
    const requesterRole = req.user?.role?.toLowerCase();
    if (requesterRole !== 'admin' && requesterRole !== 'project manager' && requesterRole !== 'team lead') {
      query = {
        $or: [
          { publicProfile: { $ne: false } },
          { _id: req.user.id }
        ]
      };
    }

    const users = await User.find(query).select('-password');
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving users list'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const userId = (req.params.id && req.params.id !== 'profile') ? req.params.id : req.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    const userWithPassword = await User.findById(user._id).select('+password');
    const userObject = user.toObject();
    userObject.hasPassword = !!(userWithPassword && userWithPassword.password);
    userObject.id = userObject._id;

    res.status(200).json({
      status: 'success',
      data: userObject
    });
  } catch (error) {
    console.error('Get user by id error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving user details'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const userId = (req.params.id && req.params.id !== 'profile') ? req.params.id : req.user.id;

    // Only user themselves or Admin can update profile
    if (req.user.role?.toLowerCase() !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        status: 'fail',
        message: 'Forbidden: You are not authorized to update this profile'
      });
    }

    const {
      name,
      email,
      role,
      bio,
      phone,
      profilePicture,
      theme,
      density,
      publicProfile,
      showContributionScore,
      showActivityTimeline,
      taskAlerts,
      deadlineReminders,
      projectUpdates,
      contributionUpdates,
      emailNotifications
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (theme !== undefined) user.theme = theme;
    if (density !== undefined) user.density = density;
    if (publicProfile !== undefined) user.publicProfile = publicProfile;
    if (showContributionScore !== undefined) user.showContributionScore = showContributionScore;
    if (showActivityTimeline !== undefined) user.showActivityTimeline = showActivityTimeline;
    if (taskAlerts !== undefined) user.taskAlerts = taskAlerts;
    if (deadlineReminders !== undefined) user.deadlineReminders = deadlineReminders;
    if (projectUpdates !== undefined) user.projectUpdates = projectUpdates;
    if (contributionUpdates !== undefined) user.contributionUpdates = contributionUpdates;
    if (emailNotifications !== undefined) user.emailNotifications = emailNotifications;
    
    // Only admins can change roles, OR users can set/change their own role to non-admin roles
    if (role) {
      const isAdmin = req.user.role?.toLowerCase() === 'admin';
      const isSelfUpdate = req.user.id === userId;
      const targetRoleLower = role.toLowerCase();
      
      if (isAdmin) {
        user.role = role;
      } else if (isSelfUpdate && targetRoleLower !== 'admin') {
        user.role = role;
      }
    }

    await user.save();

    const userWithPassword = await User.findById(user._id).select('+password');
    const userObject = user.toObject();
    userObject.hasPassword = !!(userWithPassword && userWithPassword.password);
    userObject.id = userObject._id;

    res.status(200).json({
      status: 'success',
      data: userObject
    });
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating user details'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting user'
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/:id/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'Forbidden: You cannot change another user\'s password'
      });
    }

    const { currentPassword, newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a new password'
      });
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    // If user already has a password, verify current password
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({
          status: 'fail',
          message: 'Please provide your current password'
        });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          status: 'fail',
          message: 'Incorrect current password'
        });
      }
    }

    user.password = newPassword;
    await user.save();

    // Log activity
    const ActivityLog = require('../models/ActivityLog');
    await ActivityLog.create({
      user: user._id,
      event: 'Password changed',
      metadata: {
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        device: req.headers['user-agent'] || 'Unknown Browser'
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error changing password'
    });
  }
};

// @desc    Get active sessions
// @route   GET /api/users/:id/sessions
// @access  Private
const getActiveSessions = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'Forbidden: You cannot view active sessions for another user'
      });
    }

    const UserSession = require('../models/UserSession');
    const sessions = await UserSession.find({ user: req.params.id, isRevoked: false })
      .sort({ lastActive: -1 });

    // Identify the current session
    const currentToken = req.headers.authorization.split(' ')[1];

    const sessionsWithFlag = sessions.map(session => ({
      id: session._id,
      device: session.device,
      ip: session.ip,
      lastActive: session.lastActive,
      isCurrent: session.token === currentToken
    }));

    res.status(200).json({
      status: 'success',
      data: sessionsWithFlag
    });
  } catch (error) {
    console.error('Get active sessions error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving sessions'
    });
  }
};

// @desc    Revoke session (Logout device)
// @route   DELETE /api/users/:id/sessions/:sessionId
// @access  Private
const revokeSession = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'Forbidden: You cannot revoke sessions for another user'
      });
    }

    const UserSession = require('../models/UserSession');
    const session = await UserSession.findOne({ _id: req.params.sessionId, user: req.params.id });

    if (!session) {
      return res.status(404).json({
        status: 'fail',
        message: 'Session not found'
      });
    }

    session.isRevoked = true;
    await session.save();

    // Log activity
    const ActivityLog = require('../models/ActivityLog');
    await ActivityLog.create({
      user: req.user.id,
      event: 'Session revoked',
      metadata: {
        sessionDevice: session.device,
        sessionIp: session.ip
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Session revoked successfully'
    });
  } catch (error) {
    console.error('Revoke session error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error revoking session'
    });
  }
};

// @desc    Get user security activity logs
// @route   GET /api/users/:id/security-logs
// @access  Private
const getSecurityLogs = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'Forbidden: You cannot view security logs for another user'
      });
    }

    const ActivityLog = require('../models/ActivityLog');
    // Fetch only login, password change, and session revocation activities
    const logs = await ActivityLog.find({
      user: req.params.id,
      event: { $in: ['User logged in', 'Password changed', 'Session revoked', 'Account registered and logged in'] }
    })
    .sort({ timestamp: -1 })
    .limit(10);

    res.status(200).json({
      status: 'success',
      data: logs
    });
  } catch (error) {
    console.error('Get security logs error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving security logs'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
  getActiveSessions,
  revokeSession,
  getSecurityLogs
};
