const express = require('express');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  toggleFavoriteProject,
  getProjectBurndown
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Apply JWT auth protection to all routes below
router.use(protect);

router.route('/')
  .get(getProjects)
  .post(authorize('admin', 'project manager'), createProject);

router.post('/:id/favorite', toggleFavoriteProject);
router.get('/:id/burndown', getProjectBurndown);

router.route('/:id')
  .get(getProjectById)
  .put(authorize('admin', 'project manager'), updateProject)
  .delete(authorize('admin'), deleteProject);

module.exports = router;
