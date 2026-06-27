const express = require('express');
const { getReports, generateReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'project manager', 'team lead', 'developer', 'tester'));

router.route('/')
  .get(getReports)
  .post(generateReport);

module.exports = router;
