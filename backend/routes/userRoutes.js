const express = require('express');
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
  getActiveSessions,
  revokeSession,
  getSecurityLogs
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getUsers);

router.route('/profile')
  .get(getUserById)
  .put(updateUser);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(authorize('admin'), deleteUser);

router.route('/:id/change-password')
  .put(changePassword);

router.route('/:id/sessions')
  .get(getActiveSessions);

router.route('/:id/sessions/:sessionId')
  .delete(revokeSession);

router.route('/:id/security-logs')
  .get(getSecurityLogs);

module.exports = router;
