const User = require('../models/User');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const GithubCommit = require('../models/GithubCommit');
const GithubPullRequest = require('../models/GithubPullRequest');
const GithubReview = require('../models/GithubReview');
const GithubIssue = require('../models/GithubIssue');

const ContributorScore = require('../models/ContributorScore');
const RepositoryMetrics = require('../models/RepositoryMetrics');
const ReviewMetrics = require('../models/ReviewMetrics');
const IssueMetrics = require('../models/IssueMetrics');
const EngineeringHealth = require('../models/EngineeringHealth');
const { recalculateAllMetrics } = require('../services/analyticsEngineService');
const { getProjectRisk, getBusFactor, getKnowledgeDistribution } = require('../services/engineeringIntelligenceService');

// Helper to compute contribution score for a single user
const computeUserScore = async (userId) => {
  // 1. Fetch tasks
  const tasks = await Task.find({ assignee: userId });
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status.toLowerCase() === 'done');
  const totalCompleted = completedTasks.length;

  // tasksCompletedRatio (40% weight)
  const completionRatio = totalTasks > 0 ? (totalCompleted / totalTasks) : 0;
  const completionScore = completionRatio * 100;

  // taskComplexityScore (25% weight)
  // Easy = 1, Medium = 2, Hard = 3. Max is 3.
  let complexitySum = 0;
  completedTasks.forEach(t => {
    const comp = t.complexity ? t.complexity.toLowerCase() : 'medium';
    if (comp === 'easy') complexitySum += 1;
    else if (comp === 'hard') complexitySum += 3;
    else complexitySum += 2; // medium
  });
  const avgComplexity = totalCompleted > 0 ? (complexitySum / totalCompleted) : 0;
  // Normalize complexity to a 100-point scale (where avg complexity of 3 = 100 points)
  const complexityScore = (avgComplexity / 3) * 100;

  // deadlineAdherenceRatio (20% weight)
  let adherentCount = 0;
  let hasDeadlineCount = 0;
  completedTasks.forEach(t => {
    if (t.deadline) {
      hasDeadlineCount++;
      if (t.completionDate && new Date(t.completionDate) <= new Date(t.deadline)) {
        adherentCount++;
      }
    }
  });
  const adherenceRatio = hasDeadlineCount > 0 ? (adherentCount / hasDeadlineCount) : 1; // Default to 1 (100%) if no deadlines
  const adherenceScore = adherenceRatio * 100;

  // participationScore (15% weight)
  // Count activity logs as a proxy for participation
  const activityCount = await ActivityLog.countDocuments({ user: userId });
  // Map activity counts to a 100-point scale (e.g. 10 activity logs = 100 points)
  const participationScore = Math.min((activityCount / 10) * 100, 100);

  // Compute Task Score (using Phase 1 formula scaled out of 100)
  const taskScore = (completionScore * 0.40) + 
                     (complexityScore * 0.25) + 
                     (adherenceScore * 0.20) + 
                     (participationScore * 0.15);

  const user = await User.findById(userId);
  const githubConnected = !!(user && user.githubConnected);
  const githubUsername = user ? (user.githubUsername || user.name.toLowerCase().replace(/\s+/g, '-')) : '';

  let commitCount = 0;
  let prCount = 0;
  let reviewCount = 0;
  let issueCount = 0;
  let commitScore = 0;
  let prScore = 0;
  let reviewScore = 0;
  let issueScore = 0;
  let finalScore = taskScore;

  if (githubConnected) {
    const issueQuery = {
      $or: [
        { userUsername: githubUsername },
        { assigneeUsername: githubUsername }
      ]
    };

    commitCount = await GithubCommit.countDocuments({ authorUsername: githubUsername });
    prCount = await GithubPullRequest.countDocuments({ userUsername: githubUsername });
    reviewCount = await GithubReview.countDocuments({ userUsername: githubUsername });
    issueCount = await GithubIssue.countDocuments(issueQuery);

    // Normalize git scores out of 100
    commitScore = Math.min((commitCount / 10) * 100, 100);
    prScore = Math.min((prCount / 5) * 100, 100);
    reviewScore = Math.min((reviewCount / 5) * 100, 100);
    issueScore = Math.min((issueCount / 5) * 100, 100);

    // Apply Phase 1.1 V2 scoring formula
    finalScore = (taskScore * 0.40) + 
                 (commitScore * 0.25) + 
                 (prScore * 0.15) + 
                 (reviewScore * 0.10) + 
                 (issueScore * 0.10);
  }

  return {
    userId,
    stats: {
      totalTasks,
      completedTasks: totalCompleted,
      completionRate: Math.round(completionRatio * 100),
      averageComplexity: Math.round(avgComplexity * 10) / 10,
      deadlineAdherenceRate: Math.round(adherenceRatio * 100),
      activityLogsCount: activityCount,
      githubConnected,
      githubCommits: commitCount,
      githubPRs: prCount,
      githubReviews: reviewCount,
      githubIssues: issueCount
    },
    breakdown: {
      // Legacy breakdowns for backwards compatibility
      completionWeighted: Math.round((completionScore * 0.40) * 10) / 10,
      complexityWeighted: Math.round((complexityScore * 0.25) * 10) / 10,
      adherenceWeighted: Math.round((adherenceScore * 0.20) * 10) / 10,
      participationWeighted: Math.round((participationScore * 0.15) * 10) / 10,
      
      // New V2 Breakdown
      taskScore: Math.round(taskScore * 10) / 10,
      taskWeighted: Math.round((taskScore * 0.40) * 10) / 10,
      commitScore: Math.round(commitScore * 10) / 10,
      commitWeighted: Math.round((commitScore * 0.25) * 10) / 10,
      prScore: Math.round(prScore * 10) / 10,
      prWeighted: Math.round((prScore * 0.15) * 10) / 10,
      reviewScore: Math.round(reviewScore * 10) / 10,
      reviewWeighted: Math.round((reviewScore * 0.10) * 10) / 10,
      issueScore: Math.round(issueScore * 10) / 10,
      issueWeighted: Math.round((issueScore * 0.10) * 10) / 10,
      isV2: githubConnected
    },
    contributionScore: Math.round(finalScore * 10) / 10
  };
};

// @desc    Get contribution analytics leaderboard
// @route   GET /api/analytics/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
  try {
    // Auto-recalculate fallback if empty
    const count = await ContributorScore.countDocuments({});
    if (count === 0) {
      await recalculateAllMetrics();
    }

    const period = req.query.period || 'all-time';
    const scores = await ContributorScore.find({ period }).populate('user', '-password');

    const requesterRole = req.user?.role?.toLowerCase();
    const isPrivileged = ['admin', 'project manager', 'team lead'].includes(requesterRole);

    const leaderboard = [];
    for (const s of scores) {
      const u = s.user;
      if (!u) continue;
      
      // Privacy check
      if (u.showContributionScore === false && !isPrivileged && req.user.id !== u._id.toString()) {
        continue;
      }

      // Fetch git activity details from main user for commits/PRs counts
      const githubUsername = u.githubUsername || u.name.toLowerCase().replace(/\s+/g, '-');
      const commits = await GithubCommit.countDocuments({ authorUsername: githubUsername });
      const prs = await GithubPullRequest.countDocuments({ userUsername: githubUsername });
      const reviews = await GithubReview.countDocuments({ userUsername: githubUsername });
      const issues = await GithubIssue.countDocuments({
        $or: [
          { userUsername: githubUsername },
          { assigneeUsername: githubUsername }
        ]
      });

      leaderboard.push({
        id: u._id,
        name: s.name,
        email: u.email,
        role: s.role,
        contributionScore: s.contributionScore,
        collaborationScore: s.collaborationScore,
        commits,
        prs,
        reviews,
        issues,
        stats: {
          githubConnected: u.githubConnected,
          githubCommits: commits,
          githubPRs: prs,
          githubReviews: reviews,
          githubIssues: issues
        },
        breakdown: {
          taskScore: s.tasksScore,
          commitScore: s.commitsScore,
          prScore: s.prScore,
          reviewScore: s.reviewScore,
          issueScore: s.issueScore,
          isV2: u.githubConnected
        }
      });
    }

    // Sort descending by contribution score
    leaderboard.sort((a, b) => b.contributionScore - a.contributionScore);

    res.status(200).json({
      status: 'success',
      results: leaderboard.length,
      data: leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error computing contribution leaderboard'
    });
  }
};

// @desc    Get single user contribution analytics profile
// @route   GET /api/analytics/user/:id
// @access  Private
const getUserAnalytics = async (req, res) => {
  try {
    const targetUserId = req.params.id || req.user.id;
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    // Privacy setting check for contribution score
    const requesterRole = req.user?.role?.toLowerCase();
    const isPrivileged = ['admin', 'project manager', 'team lead'].includes(requesterRole);
    if (targetUser.showContributionScore === false && !isPrivileged && req.user.id !== targetUser._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'This user has set their contribution metrics to private'
      });
    }

    const analytics = await computeUserScore(targetUser._id);

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role
        },
        ...analytics
      }
    });
  } catch (error) {
    console.error('Get user analytics error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving user contribution analytics'
    });
  }
};

const getEngineeringHealth = async (req, res) => {
  try {
    const count = await EngineeringHealth.countDocuments({});
    if (count === 0) {
      await recalculateAllMetrics();
    }

    const healthData = await EngineeringHealth.find({}).populate('project');
    res.status(200).json({
      status: 'success',
      results: healthData.length,
      data: healthData
    });
  } catch (error) {
    console.error('Get engineering health error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving engineering health analytics'
    });
  }
};

const getDeveloperPerformance = async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase();
    if (role === 'tester') {
      return res.status(403).json({
        status: 'fail',
        message: 'Testers do not have access to developer performance analytics.'
      });
    }

    const count = await ContributorScore.countDocuments({});
    if (count === 0) {
      await recalculateAllMetrics();
    }

    let queryUser = req.query.userId || req.params.id;
    if (role === 'developer') {
      queryUser = req.user.id;
    }

    if (queryUser) {
      const performance = await ContributorScore.find({ user: queryUser }).populate('user', '-password');
      const filtered = performance.filter(p => p.user !== null);
      return res.status(200).json({
        status: 'success',
        data: filtered
      });
    } else {
      const performance = await ContributorScore.find({ period: 'all-time' }).populate('user', '-password');
      const filtered = performance.filter(p => p.user !== null);
      return res.status(200).json({
        status: 'success',
        results: filtered.length,
        data: filtered
      });
    }
  } catch (error) {
    console.error('Get developer performance error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving developer performance analytics'
    });
  }
};

const getRepositoryInsights = async (req, res) => {
  try {
    const count = await RepositoryMetrics.countDocuments({});
    if (count === 0) {
      await recalculateAllMetrics();
    }

    const repoId = req.query.repoId;
    if (repoId) {
      const metrics = await RepositoryMetrics.findOne({ repository: repoId }).populate('repository');
      if (metrics && !metrics.repository) {
        return res.status(200).json({
          status: 'success',
          data: null
        });
      }
      return res.status(200).json({
        status: 'success',
        data: metrics
      });
    }

    const metricsList = await RepositoryMetrics.find({}).populate('repository');
    const filteredList = metricsList.filter(m => m.repository !== null);
    res.status(200).json({
      status: 'success',
      results: filteredList.length,
      data: filteredList
    });
  } catch (error) {
    console.error('Get repo insights error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving repository insights'
    });
  }
};

const getReviewAnalytics = async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase();
    const count = await ReviewMetrics.countDocuments({});
    if (count === 0) {
      await recalculateAllMetrics();
    }

    let queryUser = req.query.userId || req.params.id;
    if (role === 'developer') {
      queryUser = req.user.id;
    }

    if (queryUser) {
      const metrics = await ReviewMetrics.findOne({ user: queryUser }).populate('user', '-password');
      if (metrics && !metrics.user) {
        return res.status(200).json({
          status: 'success',
          data: null
        });
      }
      return res.status(200).json({
        status: 'success',
        data: metrics
      });
    }

    const metricsList = await ReviewMetrics.find({}).populate('user', '-password');
    const filteredList = metricsList.filter(m => m.user !== null);
    res.status(200).json({
      status: 'success',
      results: filteredList.length,
      data: filteredList
    });
  } catch (error) {
    console.error('Get review analytics error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving review analytics'
    });
  }
};

const getIssueAnalytics = async (req, res) => {
  try {
    const count = await IssueMetrics.countDocuments({});
    if (count === 0) {
      await recalculateAllMetrics();
    }

    const userId = req.query.userId;
    if (userId) {
      const metrics = await IssueMetrics.findOne({ user: userId }).populate('user', '-password');
      if (metrics && !metrics.user) {
        return res.status(200).json({
          status: 'success',
          data: null
        });
      }
      return res.status(200).json({
        status: 'success',
        data: metrics
      });
    }

    const metricsList = await IssueMetrics.find({}).populate('user', '-password');
    const filteredList = metricsList.filter(m => m.user !== null);
    res.status(200).json({
      status: 'success',
      results: filteredList.length,
      data: filteredList
    });
  } catch (error) {
    console.error('Get issue analytics error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving issue analytics'
    });
  }
};

const triggerRecalculate = async (req, res) => {
  try {
    await recalculateAllMetrics();
    res.status(200).json({
      status: 'success',
      message: 'All advanced analytics metrics recalculated successfully.'
    });
  } catch (error) {
    console.error('Trigger recalculate error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error recalculating advanced metrics'
    });
  }
};

const getProjectRiskAnalytics = async (req, res) => {
  try {
    const projectId = req.query.projectId;
    const data = await getProjectRisk(projectId);
    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Get project risk error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error retrieving project risk analytics'
    });
  }
};

const getBusFactorAnalytics = async (req, res) => {
  try {
    const { repositoryId, projectId } = req.query;
    const data = await getBusFactor(repositoryId, projectId);
    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Get bus factor error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error retrieving bus factor analytics'
    });
  }
};

const getKnowledgeDistributionAnalytics = async (req, res) => {
  try {
    const { repositoryId, projectId } = req.query;
    const data = await getKnowledgeDistribution(repositoryId, projectId, req.user.role, req.user.id);
    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Get knowledge distribution error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error retrieving knowledge distribution analytics'
    });
  }
};

const getCollaborationGraph = async (req, res) => {
  try {
    const users = await User.find({}, 'name role githubUsername profilePicture profileImage');
    
    const nodes = users.map(u => ({
      id: u._id.toString(),
      githubUsername: u.githubUsername || u.name.toLowerCase().replace(/\s+/g, '-'),
      name: u.name,
      role: u.role,
      avatar: u.profilePicture || u.profileImage
    }));

    const reviews = await GithubReview.find({}).populate('pullRequest');
    const edgeWeights = {};

    for (const review of reviews) {
      if (review.pullRequest) {
        const reviewerUsername = review.userUsername;
        const prAuthorUsername = review.pullRequest.userUsername;

        if (reviewerUsername && prAuthorUsername && reviewerUsername !== prAuthorUsername) {
          const reviewerUser = users.find(u => (u.githubUsername || u.name.toLowerCase().replace(/\s+/g, '-')) === reviewerUsername);
          const prAuthorUser = users.find(u => (u.githubUsername || u.name.toLowerCase().replace(/\s+/g, '-')) === prAuthorUsername);

          if (reviewerUser && prAuthorUser) {
            const u1 = reviewerUser._id.toString();
            const u2 = prAuthorUser._id.toString();
            const key = [u1, u2].sort().join('--');
            edgeWeights[key] = (edgeWeights[key] || 0) + 1;
          }
        }
      }
    }

    const edges = Object.keys(edgeWeights).map(key => {
      const [source, target] = key.split('--');
      return {
        source,
        target,
        weight: edgeWeights[key]
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        nodes,
        edges
      }
    });
  } catch (error) {
    console.error('Get collaboration graph error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error generating team collaboration graph'
    });
  }
};

module.exports = {
  getLeaderboard,
  getUserAnalytics,
  computeUserScore,
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
};
