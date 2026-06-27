const ActivityLog = require('../models/ActivityLog');
const Project = require('../models/Project');
const GithubCommit = require('../models/GithubCommit');
const GithubPullRequest = require('../models/GithubPullRequest');
const GithubIssue = require('../models/GithubIssue');

// @desc    Get Universal Timeline
// @route   GET /api/timeline
// @access  Private
const getUniversalTimeline = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const logs = await ActivityLog.find({})
      .populate('user', 'name role profilePicture githubUsername')
      .sort({ timestamp: -1 })
      .limit(limit);

    res.status(200).json({
      status: 'success',
      results: logs.length,
      data: logs
    });
  } catch (err) {
    console.error('[Timeline Error] Failed to fetch universal timeline:', err.message);
    res.status(500).json({ status: 'error', message: 'Server error loading universal timeline' });
  }
};

// @desc    Get Project Specific Timeline
// @route   GET /api/timeline/project/:projectId
// @access  Private
const getProjectTimeline = async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await Project.findById(projectId).populate('owner', 'name');
    if (!project) {
      return res.status(404).json({ status: 'fail', message: 'Project not found' });
    }

    // Gather timeline events:
    const events = [];

    // 1. Project Creation
    events.push({
      id: `proj_creation_${project._id}`,
      title: 'Project Created',
      description: `Project "${project.title}" created by ${project.owner ? project.owner.name : 'Unknown Owner'}`,
      timestamp: project.startDate || project.createdAt,
      type: 'project_created',
      category: 'project'
    });

    // 2. Project Milestones
    if (project.milestones && project.milestones.length > 0) {
      project.milestones.forEach((m) => {
        events.push({
          id: `milestone_${m._id}`,
          title: `Milestone: ${m.title}`,
          description: `Milestone type [${m.type}] is ${m.completed ? 'Completed' : 'Pending'} (Due: ${m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'None'})`,
          timestamp: m.dueDate || project.createdAt,
          type: 'milestone',
          category: m.completed ? 'success' : 'info',
          completed: m.completed
        });
      });
    }

    // 3. Activity Logs for this project
    const logs = await ActivityLog.find({
      $or: [
        { 'metadata.projectId': projectId },
        { 'metadata.project': projectId }
      ]
    }).populate('user', 'name');

    logs.forEach((log) => {
      events.push({
        id: `log_${log._id}`,
        title: log.event,
        description: `Action performed by ${log.user ? log.user.name : 'System'}`,
        timestamp: log.timestamp,
        type: 'activity',
        category: 'info',
        metadata: log.metadata
      });
    });

    // 4. Commits linked to project
    const commits = await GithubCommit.find({ project: projectId }).sort({ date: -1 }).limit(10);
    commits.forEach((c) => {
      events.push({
        id: `commit_${c._id}`,
        title: 'Commit Synced',
        description: `"${c.message.substring(0, 55)}" by ${c.authorUsername || c.authorName}`,
        timestamp: c.date,
        type: 'commit',
        category: 'commit',
        url: c.url
      });
    });

    // 5. PRs linked to project
    const prs = await GithubPullRequest.find({ project: projectId }).sort({ createdAt: -1 }).limit(10);
    prs.forEach((pr) => {
      events.push({
        id: `pr_${pr._id}`,
        title: `PR #${pr.number} ${pr.state}`,
        description: `"${pr.title}" - Owner: ${pr.userUsername}`,
        timestamp: pr.updatedAt || pr.createdAt,
        type: 'pr',
        category: pr.state === 'merged' ? 'success' : (pr.state === 'open' ? 'warning' : 'info'),
        url: pr.url
      });
    });

    // 6. Issues linked to project
    const issues = await GithubIssue.find({ project: projectId }).sort({ createdAt: -1 }).limit(10);
    issues.forEach((iss) => {
      events.push({
        id: `issue_${iss._id}`,
        title: `Issue #${iss.number} ${iss.state}`,
        description: `"${iss.title}" - Assigned to: ${iss.assigneeUsername || 'unassigned'}`,
        timestamp: iss.closedAt || iss.updatedAt || iss.createdAt,
        type: 'issue',
        category: iss.state === 'closed' ? 'success' : 'warning',
        url: iss.url
      });
    });

    // Sort all events by date descending
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      status: 'success',
      results: events.length,
      data: events
    });
  } catch (err) {
    console.error(`[Timeline Error] Failed to fetch project timeline for ${projectId}:`, err.message);
    res.status(500).json({ status: 'error', message: 'Server error loading project timeline' });
  }
};

module.exports = {
  getUniversalTimeline,
  getProjectTimeline
};
