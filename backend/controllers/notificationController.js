const Notification = require('../models/Notification');

// @desc    Get current user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving notifications'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user.id });

    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      status: 'success',
      data: notification
    });
  } catch (error) {
    console.error('Mark notification read error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating notification status'
    });
  }
};

// Helper to create internal alerts
const createAlert = async (userId, message, type = 'general') => {
  try {
    await Notification.create({
      user: userId,
      message,
      type
    });
  } catch (error) {
    console.error('Create alert failure:', error.message);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user.id });

    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found'
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting notification'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification,
  createAlert
};
