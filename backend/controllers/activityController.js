const ActivityLog = require('../models/ActivityLog');

// @desc    Get all activity logs
// @route   GET /api/activities
// @access  Private (Admin, Project Manager, Team Lead)
const getActivityLogs = async (req, res) => {
  try {
    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    if (userRole !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'Forbidden: Only administrators can view activity logs'
      });
    }

    const logs = await ActivityLog.find({})
      .populate('user', 'name email role')
      .sort({ timestamp: -1 });

    res.status(200).json({
      status: 'success',
      results: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Get activity logs error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving activity logs'
    });
  }
};

// Helper function to create an audit log
const logActivity = async (userId, event, metadata = {}) => {
  try {
    await ActivityLog.create({
      user: userId,
      event,
      metadata
    });
  } catch (error) {
    console.error('Audit log failure:', error.message);
  }
};

module.exports = {
  getActivityLogs,
  logActivity
};
