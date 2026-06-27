const express = require('express');
const { getActivityLogs } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

// Retrieve activity logs (admin only)
router.get('/', authorize('admin'), getActivityLogs);

module.exports = router;
