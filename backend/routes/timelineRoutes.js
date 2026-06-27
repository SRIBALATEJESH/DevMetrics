const express = require('express');
const { getUniversalTimeline, getProjectTimeline } = require('../controllers/timelineController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/timeline - Get universal activity timeline
router.get('/', protect, getUniversalTimeline);

// GET /api/timeline/project/:projectId - Get project-specific milestones/activity timeline
router.get('/project/:projectId', protect, getProjectTimeline);

module.exports = router;
