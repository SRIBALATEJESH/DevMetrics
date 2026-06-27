const GithubAccount = require('../models/GithubAccount');
const GithubRepository = require('../models/GithubRepository');
const GithubCommit = require('../models/GithubCommit');
const GithubPullRequest = require('../models/GithubPullRequest');
const GithubReview = require('../models/GithubReview');
const GithubIssue = require('../models/GithubIssue');
const User = require('../models/User');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');
const { discoverUserRepos, syncRepositoryData } = require('../services/githubSyncService');
const { getLeaderboard, computeUserScore } = require('./analyticsController');

/**
 * Helper to check role checks case-insensitively
 */
const hasRole = (user, roles) => {
  if (!user || !user.role) return false;
  return roles.map(r => r.toLowerCase()).includes(user.role.toLowerCase());
};

// @desc    Get GitHub Connection Profile
// @route   GET /api/auth/github/profile
// @access  Private
const getGithubProfile = async (req, res) => {
  try {
    const account = await GithubAccount.findOne({ user: req.user.id });
    if (!account) {
      return res.status(200).json({
        status: 'success',
        connected: false,
        message: 'No GitHub account connected'
      });
    }

    res.status(200).json({
      status: 'success',
      connected: true,
      data: account
    });
  } catch (error) {
    console.error('Error fetching github profile:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error retrieving GitHub profile' });
  }
};

// @desc    Get discovered GitHub Repositories
// @route   GET /api/auth/github/repositories
// @access  Private (Admin, PM, TL, Dev)
const getRepositories = async (req, res) => {
  try {
    const allowed = hasRole(req.user, ['Admin', 'Project Manager', 'Team Lead', 'Developer']);
    if (!allowed) {
      return res.status(403).json({ status: 'fail', message: 'Access denied' });
    }

    const repos = await GithubRepository.find({})
      .populate('project', 'title description status')
      .sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      results: repos.length,
      data: repos
    });
  } catch (error) {
    console.error('Error fetching repositories:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error retrieving repositories' });
  }
};

// @desc    Discover user's repositories from GitHub and update DB list
// @route   POST /api/auth/github/repositories/refresh
// @access  Private (Admin, PM, TL, Dev)
const refreshRepositories = async (req, res) => {
  try {
    const allowed = hasRole(req.user, ['Admin', 'Project Manager', 'Team Lead', 'Developer']);
    if (!allowed) {
      return res.status(403).json({ status: 'fail', message: 'Access denied' });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.githubConnected) {
      return res.status(400).json({ status: 'fail', message: 'Please connect your GitHub account first' });
    }

    const repos = await discoverUserRepos(user);

    res.status(200).json({
      status: 'success',
      results: repos.length,
      data: repos
    });
  } catch (error) {
    console.error('Error refreshing repositories:', error.message);
    res.status(500).json({ status: 'error', message: error.message || 'Server error refreshing repositories' });
  }
};

// @desc    Link Repository to Project
// @route   POST /api/auth/github/repositories/link
// @access  Private (Admin, PM)
const linkRepository = async (req, res) => {
  try {
    const allowed = hasRole(req.user, ['Admin', 'Project Manager']);
    if (!allowed) {
      return res.status(403).json({ status: 'fail', message: 'Insufficient permissions' });
    }

    const { repoId, projectId } = req.body;
    if (!repoId || !projectId) {
      return res.status(400).json({ status: 'fail', message: 'Please provide repoId and projectId' });
    }

    const repo = await GithubRepository.findById(repoId);
    if (!repo) {
      return res.status(404).json({ status: 'fail', message: 'Repository not found' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ status: 'fail', message: 'Project not found' });
    }

    repo.project = projectId;
    repo.status = 'linked';
    await repo.save();

    // Link any existing commits/PRs/issues matching this repository to the project
    await GithubCommit.updateMany({ repository: repo._id }, { project: projectId });
    await GithubPullRequest.updateMany({ repository: repo._id }, { project: projectId });
    await GithubReview.updateMany({ repository: repo._id }, { project: projectId });
    await GithubIssue.updateMany({ repository: repo._id }, { project: projectId });

    res.status(200).json({
      status: 'success',
      data: repo
    });
  } catch (error) {
    console.error('Error linking repository:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error linking repository' });
  }
};

// @desc    Unlink Repository from Project
// @route   POST /api/auth/github/repositories/unlink
// @access  Private (Admin, PM)
const unlinkRepository = async (req, res) => {
  try {
    const allowed = hasRole(req.user, ['Admin', 'Project Manager']);
    if (!allowed) {
      return res.status(403).json({ status: 'fail', message: 'Insufficient permissions' });
    }

    const { repoId } = req.body;
    if (!repoId) {
      return res.status(400).json({ status: 'fail', message: 'Please provide repoId' });
    }

    const repo = await GithubRepository.findById(repoId);
    if (!repo) {
      return res.status(404).json({ status: 'fail', message: 'Repository not found' });
    }

    repo.project = null;
    repo.status = 'unlinked';
    await repo.save();

    // Unlink any existing commits/PRs/issues matching this repository
    await GithubCommit.updateMany({ repository: repo._id }, { project: null });
    await GithubPullRequest.updateMany({ repository: repo._id }, { project: null });
    await GithubReview.updateMany({ repository: repo._id }, { project: null });
    await GithubIssue.updateMany({ repository: repo._id }, { project: null });

    res.status(200).json({
      status: 'success',
      data: repo
    });
  } catch (error) {
    console.error('Error unlinking repository:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error unlinking repository' });
  }
};

// @desc    Manually sync commits, PRs, issues, reviews for a repository
// @route   POST /api/auth/github/repositories/sync
// @access  Private (Admin, PM)
const syncRepository = async (req, res) => {
  try {
    const allowed = hasRole(req.user, ['Admin', 'Project Manager']);
    if (!allowed) {
      return res.status(403).json({ status: 'fail', message: 'Insufficient permissions' });
    }

    const { repoId } = req.body;
    if (!repoId) {
      return res.status(400).json({ status: 'fail', message: 'Please provide repoId' });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.githubConnected) {
      return res.status(400).json({ status: 'fail', message: 'Authenticated user GitHub access token not configured.' });
    }

    const result = await syncRepositoryData(repoId, user);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error syncing repository:', error.message);
    res.status(500).json({ status: 'error', message: error.message || 'Server error syncing repository' });
  }
};

// @desc    Get GitHub Analytics Metrics & Grouped Data
// @route   GET /api/auth/github/analytics
// @access  Private
const getGithubAnalytics = async (req, res) => {
  try {
    // 1. Basic KPI metrics counts
    const totalRepos = await GithubRepository.countDocuments({});
    const totalCommits = await GithubCommit.countDocuments({});
    const totalPRs = await GithubPullRequest.countDocuments({});
    const totalReviews = await GithubReview.countDocuments({});
    const totalIssuesClosed = await GithubIssue.countDocuments({ state: 'closed' });
    const totalIssuesOpened = await GithubIssue.countDocuments({ state: 'open' });

    // 2. Commit Activity aggregations in-memory (Daily, Weekly, Monthly)
    const commits = await GithubCommit.find({}).sort({ date: 1 });

    // Daily: last 7 days
    const dayLabels = [];
    const dailyCounts = [0, 0, 0, 0, 0, 0, 0];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      dayLabels.push(daysOfWeek[d.getDay()]);
      
      const dayStart = new Date(d.setHours(0, 0, 0, 0));
      const dayEnd = new Date(d.setHours(23, 59, 59, 999));
      
      dailyCounts[6 - i] = commits.filter(c => c.date >= dayStart && c.date <= dayEnd).length;
    }

    // Weekly: last 4 weeks
    const weekLabels = ['3 Weeks Ago', '2 Weeks Ago', 'Last Week', 'This Week'];
    const weeklyCounts = [0, 0, 0, 0];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(now.getDate() - i * 7);
      weeklyCounts[3 - i] = commits.filter(c => c.date >= weekStart && c.date <= weekEnd).length;
    }

    // Monthly: last 6 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthLabels = [];
    const monthlyCounts = [0, 0, 0, 0, 0, 0];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(monthNames[d.getMonth()]);
      
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      monthlyCounts[5 - i] = commits.filter(c => c.date >= monthStart && c.date <= monthEnd).length;
    }

    // 3. PR Activity chart (Created vs Merged vs Closed)
    const prs = await GithubPullRequest.find({});
    const prStats = {
      created: prs.length,
      merged: prs.filter(p => p.state === 'merged').length,
      closed: prs.filter(p => p.state === 'closed').length
    };

    // 4. Review Activity aggregation
    const reviews = await GithubReview.find({});
    const reviewerCounts = {};
    reviews.forEach(r => {
      if (r.userUsername) {
        reviewerCounts[r.userUsername] = (reviewerCounts[r.userUsername] || 0) + 1;
      }
    });

    // Top reviewer users array
    const reviewsPerUser = Object.keys(reviewerCounts).map(u => ({
      username: u,
      count: reviewerCounts[u]
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    // Reviews per week
    const weeklyReviews = [0, 0, 0, 0];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(now.getDate() - i * 7);
      weeklyReviews[3 - i] = reviews.filter(r => r.submittedAt >= weekStart && r.submittedAt <= weekEnd).length;
    }

    // 5. Issue resolution Rate
    const resolutionRate = (totalIssuesOpened + totalIssuesClosed) > 0 
      ? Math.round((totalIssuesClosed / (totalIssuesOpened + totalIssuesClosed)) * 100) 
      : 100;

    // 6. Contributor Leaderboard calculations (including contribution score & github counts)
    const users = await User.find({ role: { $nin: ['admin', 'Admin'] } });
    const topContributors = [];
    const requesterRole = req.user?.role?.toLowerCase();
    const isPrivileged = ['admin', 'project manager', 'team lead'].includes(requesterRole);

    for (const u of users) {
      if (u.showContributionScore === false && !isPrivileged && req.user.id !== u._id.toString()) {
        continue;
      }

      // Calculate score V2
      const userScoreObj = await computeUserScore(u._id);
      
      // Calculate git counts for this specific user
      const githubUsername = u.githubUsername || u.name.toLowerCase().replace(/\s+/g, '-');
      const commitsCount = await GithubCommit.countDocuments({ authorUsername: githubUsername });
      const prsCount = await GithubPullRequest.countDocuments({ userUsername: githubUsername });
      const reviewsCount = await GithubReview.countDocuments({ userUsername: githubUsername });
      const issuesCount = await GithubIssue.countDocuments({
        $or: [
          { userUsername: githubUsername },
          { assigneeUsername: githubUsername }
        ]
      });

      topContributors.push({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.profilePicture || u.githubAvatar,
        contributionScore: userScoreObj.contributionScore,
        commits: commitsCount,
        prs: prsCount,
        reviews: reviewsCount,
        issues: issuesCount
      });
    }

    // Sort by contributionScore descending
    topContributors.sort((a, b) => b.contributionScore - a.contributionScore);

    // 7. Personal Contribution breakdown (for logged in user)
    const personalScore = await computeUserScore(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        kpis: {
          totalRepos,
          totalCommits,
          totalPRs,
          totalReviews,
          totalIssuesClosed,
          resolutionRate
        },
        commitActivity: {
          daily: { labels: dayLabels, counts: dailyCounts },
          weekly: { labels: weekLabels, counts: weeklyCounts },
          monthly: { labels: monthLabels, counts: monthlyCounts }
        },
        prActivity: prStats,
        reviewActivity: {
          reviewsPerUser,
          weeklyReviews: { labels: weekLabels, counts: weeklyReviews }
        },
        issueActivity: {
          opened: totalIssuesOpened,
          closed: totalIssuesClosed,
          resolutionRate
        },
        leaderboard: topContributors,
        personalBreakdown: personalScore
      }
    });
  } catch (error) {
    console.error('Error fetching github analytics:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error retrieving GitHub analytics dashboard' });
  }
};

// @desc    Disconnect GitHub account
// @route   PUT /api/github/disconnect or DELETE /api/auth/github/disconnect
// @access  Private
const disconnectGithub = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    user.githubConnected = false;
    user.githubUsername = '';
    user.githubId = '';
    user.githubAvatar = '';
    user.githubAccessToken = '';
    await user.save();

    // Delete corresponding GithubAccount document
    await GithubAccount.deleteOne({ user: req.user.id });

    // Log activity
    await ActivityLog.create({
      user: user._id,
      event: 'GitHub account disconnected',
      metadata: {}
    });

    return res.status(200).json({ success: true, message: 'GitHub disconnected successfully' });
  } catch (error) {
    console.error('GitHub Disconnect Error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Server error disconnecting GitHub account' });
  }
};

module.exports = {
  getGithubProfile,
  getRepositories,
  refreshRepositories,
  linkRepository,
  unlinkRepository,
  syncRepository,
  getGithubAnalytics,
  disconnectGithub
};
