const express = require('express');
const {
  getLeaderboard,
  getUserAnalytics,
  getEngineeringHealth,
  getDeveloperPerformance,
  getRepositoryInsights,
  getReviewAnalytics,
  getIssueAnalytics,
  triggerRecalculate,
  getProjectRiskAnalytics,
  getBusFactorAnalytics,
  getKnowledgeDistributionAnalytics,
  getCollaborationGraph
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/leaderboard', getLeaderboard);
router.get('/user/:id?', getUserAnalytics);
router.get('/collaboration-graph', getCollaborationGraph);

router.get('/engineering-health', getEngineeringHealth);
router.get('/developers', getDeveloperPerformance);
router.get('/developers/:id', getDeveloperPerformance);
router.get('/repository-insights', getRepositoryInsights);
router.get('/reviews', getReviewAnalytics);
router.get('/reviews/:id', getReviewAnalytics);
router.get('/issues', authorize('admin', 'project manager', 'team lead'), getIssueAnalytics);

// New Phase 1.3 routes with proper RBAC
router.get('/project-risk', authorize('admin', 'project manager', 'team lead', 'tester'), getProjectRiskAnalytics);
router.get('/bus-factor', authorize('admin', 'project manager', 'team lead'), getBusFactorAnalytics);
router.get('/knowledge-distribution', authorize('admin', 'project manager', 'team lead', 'developer'), getKnowledgeDistributionAnalytics);

router.post('/recalculate', triggerRecalculate);

module.exports = router;
