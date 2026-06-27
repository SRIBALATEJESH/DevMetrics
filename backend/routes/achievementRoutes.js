const express = require('express');
const { getMyAchievements, getUserAchievements } = require('../controllers/achievementController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/my', getMyAchievements);
router.get('/user/:userId', getUserAchievements);

module.exports = router;
