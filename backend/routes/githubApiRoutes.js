const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getGithubProfile, disconnectGithub } = require('../controllers/githubController');

const router = express.Router();

// GET /api/github/profile - Get GitHub Connection Profile for current user
router.get('/profile', protect, getGithubProfile);

// PUT /api/github/disconnect - Disconnect GitHub account for current user
router.put('/disconnect', protect, disconnectGithub);

module.exports = router;
