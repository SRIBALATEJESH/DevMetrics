const express = require('express');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(authorize('admin', 'project manager'), createTask);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask) // Logic in controller handles role specific assignment checks
  .delete(authorize('admin', 'project manager'), deleteTask);

module.exports = router;
