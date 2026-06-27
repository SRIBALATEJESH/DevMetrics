const express = require('express');
const {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam
} = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTeams)
  .post(authorize('admin', 'project manager'), createTeam);

router.route('/:id')
  .get(getTeamById)
  .put(authorize('admin', 'project manager', 'team lead'), updateTeam)
  .delete(authorize('admin'), deleteTeam);

module.exports = router;
