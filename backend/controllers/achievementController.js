const Achievement = require('../models/Achievement');

// @desc    Get current user's achievements
// @route   GET /api/achievements/my
// @access  Private
const getMyAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find({ user: req.user.id })
      .sort({ unlockedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: achievements.length,
      data: achievements
    });
  } catch (error) {
    console.error('Get my achievements error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving achievements'
    });
  }
};

// @desc    Get user's achievements by ID
// @route   GET /api/achievements/user/:userId
// @access  Private
const getUserAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find({ user: req.params.userId })
      .sort({ unlockedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: achievements.length,
      data: achievements
    });
  } catch (error) {
    console.error('Get user achievements error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving user achievements'
    });
  }
};

module.exports = {
  getMyAchievements,
  getUserAchievements
};
