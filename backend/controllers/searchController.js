const Project = require('../models/Project');
const Team = require('../models/Team');
const User = require('../models/User');
const Task = require('../models/Task');
const GithubRepository = require('../models/GithubRepository');
const GithubCommit = require('../models/GithubCommit');
const GithubPullRequest = require('../models/GithubPullRequest');
const GithubReview = require('../models/GithubReview');
const GithubIssue = require('../models/GithubIssue');

// @desc    Universal Smart Search
// @route   GET /api/search
// @access  Private
const universalSearch = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(200).json({ status: 'success', data: {} });
  }

  const searchRegex = new RegExp(q, 'i');

  try {
    const [
      projects,
      teams,
      users,
      tasks,
      repos,
      commits,
      prs,
      reviews,
      issues
    ] = await Promise.all([
      Project.find({ isArchived: false, $or: [{ title: searchRegex }, { description: searchRegex }] }).limit(5),
      Team.find({ teamName: searchRegex }).limit(5),
      User.find({ $or: [{ name: searchRegex }, { email: searchRegex }] }).limit(5).select('-password'),
      Task.find({ $or: [{ title: searchRegex }, { description: searchRegex }] }).limit(5),
      GithubRepository.find({ $or: [{ name: searchRegex }, { fullName: searchRegex }] }).limit(5),
      GithubCommit.find({ $or: [{ message: searchRegex }, { sha: searchRegex }] }).limit(5),
      GithubPullRequest.find({ $or: [{ title: searchRegex }, { number: isNaN(q) ? -1 : parseInt(q) }] }).limit(5),
      GithubReview.find({ body: searchRegex }).limit(5).populate('pullRequest'),
      GithubIssue.find({ $or: [{ title: searchRegex }, { number: isNaN(q) ? -1 : parseInt(q) }] }).limit(5)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        projects,
        teams,
        users,
        tasks,
        repositories: repos,
        commits,
        pullRequests: prs,
        reviews,
        issues
      }
    });
  } catch (err) {
    console.error('[Search Error] Failed running universal search:', err.message);
    res.status(500).json({ status: 'error', message: 'Server error conducting universal search' });
  }
};

module.exports = {
  universalSearch
};
