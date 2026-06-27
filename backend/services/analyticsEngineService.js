const User = require('../models/User');
const Project = require('../models/Project');
const Team = require('../models/Team');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const GithubCommit = require('../models/GithubCommit');
const GithubPullRequest = require('../models/GithubPullRequest');
const GithubReview = require('../models/GithubReview');
const GithubIssue = require('../models/GithubIssue');
const GithubRepository = require('../models/GithubRepository');

const ContributorScore = require('../models/ContributorScore');
const RepositoryMetrics = require('../models/RepositoryMetrics');
const ReviewMetrics = require('../models/ReviewMetrics');
const IssueMetrics = require('../models/IssueMetrics');
const EngineeringHealth = require('../models/EngineeringHealth');
const Achievement = require('../models/Achievement');
const Notification = require('../models/Notification');

/**
 * Calculates consecutive contribution days
 */
const getStreak = (logDates) => {
  if (logDates.length === 0) return 0;
  
  const parseDate = (dStr) => {
    const [year, month, day] = dStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const yesterdayStr = new Date(Date.now() - 24*60*60*1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  if (logDates[0] !== todayStr && logDates[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  let current = parseDate(logDates[0]);

  for (let i = 1; i < logDates.length; i++) {
    const prev = parseDate(logDates[i]);
    const diffTime = Math.abs(current - prev);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
      current = prev;
    } else if (diffDays > 1) {
      break;
    }
  }
  return streak;
};


/**
 * Helper to compute task score metrics for a user
 */
const computeTaskScoreData = async (userId, sinceDate) => {
  const query = { assignee: userId };
  if (sinceDate) {
    query.createdAt = { $gte: sinceDate };
  }
  const tasks = await Task.find(query);
  const totalTasks = tasks.length;
  
  const completedQuery = { assignee: userId, status: 'done' };
  if (sinceDate) {
    completedQuery.completionDate = { $gte: sinceDate };
  }
  const completedTasks = await Task.find(completedQuery);
  const totalCompleted = completedTasks.length;

  const completionRatio = totalTasks > 0 ? (totalCompleted / totalTasks) : 0;
  const completionScore = completionRatio * 100;

  let complexitySum = 0;
  completedTasks.forEach(t => {
    const comp = t.complexity ? t.complexity.toLowerCase() : 'medium';
    if (comp === 'easy') complexitySum += 1;
    else if (comp === 'hard') complexitySum += 3;
    else complexitySum += 2;
  });
  const avgComplexity = totalCompleted > 0 ? (complexitySum / totalCompleted) : 0;
  const complexityScore = (avgComplexity / 3) * 100;

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
  const adherenceRatio = hasDeadlineCount > 0 ? (adherentCount / hasDeadlineCount) : 1;
  const adherenceScore = adherenceRatio * 100;

  const logQuery = { user: userId };
  if (sinceDate) {
    logQuery.createdAt = { $gte: sinceDate };
  }
  const activityCount = await ActivityLog.countDocuments(logQuery);
  const participationScore = Math.min((activityCount / (sinceDate ? 3 : 10)) * 100, 100);

  const taskScore = (completionScore * 0.40) + 
                    (complexityScore * 0.25) + 
                    (adherenceScore * 0.20) + 
                    (participationScore * 0.15);

  return {
    totalTasks,
    completedTasks: totalCompleted,
    taskScore,
    participationScore,
    activityCount
  };
};

let isRecalculating = false;

/**
 * Main function to recalculate all advanced analytics metrics and save to MongoDB
 */
const recalculateAllMetrics = async () => {
  if (isRecalculating) {
    console.log('[Analytics Engine] Recalculation already in progress, skipping concurrent run.');
    return true;
  }
  isRecalculating = true;
  console.log('[Analytics Engine] Starting Advanced Analytics recalculation...');
  const start = Date.now();

  try {
    // 1. Clear operations removed in favor of direct document upserts to prevent race conditions and empty leaderboard states


    const users = await User.find({});
    const projects = await Project.find({});
    const repos = await GithubRepository.find({});

    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(now.getDate() - 30);

    // 2. Compute ContributorScores (weekly, monthly, all-time)
    for (const user of users) {
      const githubUsername = user.githubUsername || user.name.toLowerCase().replace(/\s+/g, '-');
      const userId = user._id;

      // Calculate contribution streak
      const userLogs = await ActivityLog.find({ user: userId }).sort({ timestamp: -1 });
      const uniqueDates = [...new Set(userLogs.map(l => {
        const d = l.timestamp || l.createdAt;
        return d ? new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : null;
      }))].filter(d => d && d !== 'Invalid Date');
      const streakCount = getStreak(uniqueDates);
      user.streakCount = streakCount;
      if (userLogs.length > 0) {
        user.lastContributionDate = userLogs[0].timestamp || userLogs[0].createdAt;
      }
      await user.save();

      const periods = [
        { name: 'weekly', date: oneWeekAgo },
        { name: 'monthly', date: oneMonthAgo },
        { name: 'all-time', date: null }
      ];

      for (const p of periods) {
        const taskData = await computeTaskScoreData(userId, p.date);

        // Fetch git metrics
        const commitQuery = { authorUsername: githubUsername };
        if (p.date) commitQuery.date = { $gte: p.date };
        const commitCount = await GithubCommit.countDocuments(commitQuery);

        const prQuery = { userUsername: githubUsername };
        if (p.date) prQuery.createdAt = { $gte: p.date };
        const prCount = await GithubPullRequest.countDocuments(prQuery);

        const reviewQuery = { userUsername: githubUsername };
        if (p.date) reviewQuery.submittedAt = { $gte: p.date };
        const reviewCount = await GithubReview.countDocuments(reviewQuery);

        const issueQuery = {
          $or: [
            { userUsername: githubUsername },
            { assigneeUsername: githubUsername }
          ]
        };
        if (p.date) issueQuery.createdAt = { $gte: p.date };
        const totalIssues = await GithubIssue.countDocuments(issueQuery);

        const closedIssueQuery = {
          state: 'closed',
          $or: [
            { userUsername: githubUsername },
            { assigneeUsername: githubUsername }
          ]
        };
        if (p.date) closedIssueQuery.closedAt = { $gte: p.date };
        const closedIssues = await GithubIssue.countDocuments(closedIssueQuery);

        // Normalize metrics based on period limits
        let commitScore = 0;
        let prScore = 0;
        let reviewScore = 0;
        let issueScore = 0;

        if (p.name === 'weekly') {
          commitScore = Math.min((commitCount / 3) * 100, 100);
          prScore = Math.min((prCount / 2) * 100, 100);
          reviewScore = Math.min((reviewCount / 2) * 100, 100);
          issueScore = Math.min((closedIssues / 2) * 100, 100);
        } else if (p.name === 'monthly') {
          commitScore = Math.min((commitCount / 8) * 100, 100);
          prScore = Math.min((prCount / 4) * 100, 100);
          reviewScore = Math.min((reviewCount / 4) * 100, 100);
          issueScore = Math.min((closedIssues / 4) * 100, 100);
        } else {
          commitScore = Math.min((commitCount / 10) * 100, 100);
          prScore = Math.min((prCount / 5) * 100, 100);
          reviewScore = Math.min((reviewCount / 5) * 100, 100);
          issueScore = Math.min((closedIssues / 5) * 100, 100);
        }

        // V2 Score: 40% Tasks + 25% Commits + 15% Pull Requests + 10% Reviews + 10% Issues
        let finalScore = taskData.taskScore;
        if (user.githubConnected) {
          finalScore = (taskData.taskScore * 0.40) +
                       (commitScore * 0.25) +
                       (prScore * 0.15) +
                       (reviewScore * 0.10) +
                       (issueScore * 0.10);
        }

        // Collaboration Score = Reviews + Comments + Discussions + Participation
        // Comments proxy: reviews with message text body
        const commentQuery = { userUsername: githubUsername, body: { $ne: '' } };
        if (p.date) commentQuery.submittedAt = { $gte: p.date };
        const commentsCount = await GithubReview.countDocuments(commentQuery);
        const discussionsCount = prCount + totalIssues;
        const collabScore = reviewCount + commentsCount + discussionsCount + taskData.activityCount;

        await ContributorScore.findOneAndUpdate(
          { user: userId, period: p.name },
          {
            user: userId,
            name: user.name,
            role: user.role,
            tasksScore: Math.round(taskData.taskScore * 10) / 10,
            commitsScore: Math.round(commitScore * 10) / 10,
            prScore: Math.round(prScore * 10) / 10,
            reviewScore: Math.round(reviewScore * 10) / 10,
            issueScore: Math.round(issueScore * 10) / 10,
            contributionScore: Math.round(finalScore * 10) / 10,
            collaborationScore: collabScore,
            period: p.name,
            calculatedAt: now
          },
          { upsert: true, new: true }
        );

        if (p.name === 'all-time') {
          const completedTasksCount = taskData.completedTasks;
          const bugsFixed = await GithubIssue.countDocuments({
            assigneeUsername: githubUsername,
            state: 'closed',
            $or: [
              { title: { $regex: /bug/i } },
              { title: { $regex: /fix/i } }
            ]
          });

          const potentialBadges = [
            {
              badgeKey: 'first-commit',
              title: 'First Code Sync',
              description: 'Synced your first commit to DevMetrics',
              icon: '🥇',
              condition: commitCount >= 1
            },
            {
              badgeKey: 'pr-machine',
              title: 'PR Machine',
              description: 'Successfully merged 3 or more Pull Requests',
              icon: '🚀',
              condition: prCount >= 3
            },
            {
              badgeKey: 'bug-hunter',
              title: 'Bug Hunter',
              description: 'Closed 3 or more bug issues',
              icon: '🐛',
              condition: bugsFixed >= 3
            },
            {
              badgeKey: 'task-champion',
              title: 'Task Champion',
              description: 'Completed 5 or more workspace tasks',
              icon: '🎯',
              condition: completedTasksCount >= 5
            },
            {
              badgeKey: 'collab-star',
              title: 'Collaboration Star',
              description: 'Submitted 5 or more reviews or comments',
              icon: '💬',
              condition: reviewCount >= 5
            }
          ];

          for (const badge of potentialBadges) {
            if (badge.condition) {
              const existing = await Achievement.findOne({ user: userId, badgeKey: badge.badgeKey });
              if (!existing) {
                await Achievement.create({
                  user: userId,
                  badgeKey: badge.badgeKey,
                  title: badge.title,
                  description: badge.description,
                  icon: badge.icon
                });

                await Notification.create({
                  user: userId,
                  message: `🎉 Achievement Unlocked: ${badge.title}! (${badge.description})`,
                  type: 'system'
                });

                await ActivityLog.create({
                  user: userId,
                  event: `Achievement Unlocked: ${badge.title}`,
                  metadata: { badgeKey: badge.badgeKey }
                });

                const io = global.io;
                if (io) {
                  io.emit('achievement_unlocked', {
                    userId,
                    badgeKey: badge.badgeKey,
                    title: badge.title,
                    description: badge.description,
                    icon: badge.icon
                  });
                }
              }
            }
          }
        }
      }
    }

    // 3. Compute RepositoryMetrics
    for (const repo of repos) {
      const commitCount = await GithubCommit.countDocuments({ repository: repo._id });
      const openPRs = await GithubPullRequest.countDocuments({ repository: repo._id, state: 'open' });
      const mergedPRs = await GithubPullRequest.countDocuments({ repository: repo._id, state: 'merged' });
      const closedPRs = await GithubPullRequest.countDocuments({ repository: repo._id, state: 'closed' });
      const openIssues = await GithubIssue.countDocuments({ repository: repo._id, state: 'open' });
      const closedIssues = await GithubIssue.countDocuments({ repository: repo._id, state: 'closed' });

      // Active contributors: unique authors in commits
      const activeContributors = await GithubCommit.distinct('authorUsername', { repository: repo._id });

      // Build Language distribution map
      const langDist = {};
      const baseLang = repo.language || 'JavaScript';
      if (baseLang === 'JavaScript') {
        langDist.JavaScript = 70;
        langDist.HTML = 20;
        langDist.CSS = 10;
      } else if (baseLang === 'TypeScript') {
        langDist.TypeScript = 75;
        langDist.JavaScript = 15;
        langDist.CSS = 10;
      } else if (baseLang === 'CSS') {
        langDist.CSS = 80;
        langDist.HTML = 20;
      } else {
        langDist[baseLang] = 100;
      }

      // Calculate Repository Health Score
      const totalPRs = openPRs + mergedPRs + closedPRs;
      const prRatio = totalPRs > 0 ? ((mergedPRs + closedPRs) / totalPRs) : 1.0;
      const prScoreVal = prRatio * 100;

      const totalIssues = openIssues + closedIssues;
      const issueRatio = totalIssues > 0 ? (closedIssues / totalIssues) : 1.0;
      const issueScoreVal = issueRatio * 100;

      const numContributors = activeContributors.length;
      const contribScoreVal = numContributors >= 3 ? 100 : numContributors === 2 ? 80 : numContributors === 1 ? 60 : 50;

      const commitScoreVal = commitCount >= 20 ? 100 : commitCount >= 10 ? 80 : commitCount >= 5 ? 60 : 50;

      const healthScore = Math.round(
        (prScoreVal * 0.40) +
        (issueScoreVal * 0.30) +
        (contribScoreVal * 0.15) +
        (commitScoreVal * 0.15)
      );

      await RepositoryMetrics.findOneAndUpdate(
        { repository: repo._id },
        {
          repository: repo._id,
          name: repo.name,
          commitCount,
          openPullRequests: openPRs,
          mergedPullRequests: mergedPRs,
          closedPullRequests: closedPRs,
          openIssues: openIssues,
          closedIssues: closedIssues,
          languageDistribution: langDist,
          activeContributors: activeContributors.length || 1,
          healthScore,
          calculatedAt: now
        },
        { upsert: true, new: true }
      );
    }

    // 4. Compute ReviewMetrics per user
    for (const user of users) {
      const githubUsername = user.githubUsername || user.name.toLowerCase().replace(/\s+/g, '-');
      
      const reviewsGiven = await GithubReview.countDocuments({ userUsername: githubUsername });
      
      // Reviews received: reviews submitted on PRs owned by this user
      const userPRs = await GithubPullRequest.find({ userUsername: githubUsername });
      const prIds = userPRs.map(p => p._id);
      const reviewsReceived = await GithubReview.countDocuments({ pullRequest: { $in: prIds } });

      // Acceptance rate: percentage of reviews given that are APPROVED
      const approvedGiven = await GithubReview.countDocuments({ userUsername: githubUsername, state: 'APPROVED' });
      const acceptanceRate = reviewsGiven > 0 ? Math.round((approvedGiven / reviewsGiven) * 100) : 0;

      // Turnaround time: average diff in hours between PR creation and review submission
      const userReviews = await GithubReview.find({ userUsername: githubUsername }).populate('pullRequest');
      let turnaroundSum = 0;
      let reviewPrCount = 0;

      for (const rev of userReviews) {
        if (rev.pullRequest) {
          const prCreated = new Date(rev.pullRequest.createdAt);
          const revSubmitted = new Date(rev.submittedAt);
          const diffMs = revSubmitted - prCreated;
          const diffHours = diffMs / (1000 * 60 * 60);
          if (diffHours >= 0) {
            turnaroundSum += diffHours;
            reviewPrCount++;
          }
        }
      }
      const avgTurnaround = reviewPrCount > 0 ? Math.round((turnaroundSum / reviewPrCount) * 10) / 10 : 0;

      await ReviewMetrics.findOneAndUpdate(
        { user: user._id },
        {
          user: user._id,
          githubUsername,
          reviewsGiven,
          reviewsReceived,
          acceptanceRate,
          averageTurnaroundTime: avgTurnaround,
          calculatedAt: now
        },
        { upsert: true, new: true }
      );
    }

    // 5. Compute IssueMetrics per user
    for (const user of users) {
      const githubUsername = user.githubUsername || user.name.toLowerCase().replace(/\s+/g, '-');
      
      const issueBaseQuery = {
        $or: [
          { userUsername: githubUsername },
          { assigneeUsername: githubUsername }
        ]
      };

      const openIssuesCount = await GithubIssue.countDocuments({ ...issueBaseQuery, state: 'open' });
      const closedIssuesCount = await GithubIssue.countDocuments({ ...issueBaseQuery, state: 'closed' });
      const totalIssues = openIssuesCount + closedIssuesCount;
      const resolutionRate = totalIssues > 0 ? Math.round((closedIssuesCount / totalIssues) * 100) : 0;

      // Average resolution time: diff in hours between issue creation and closing
      const closedIssues = await GithubIssue.find({ ...issueBaseQuery, state: 'closed' });
      let resolutionSum = 0;
      for (const iss of closedIssues) {
        const created = new Date(iss.createdAt);
        const closed = new Date(iss.closedAt);
        const diffMs = closed - created;
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours >= 0) resolutionSum += diffHours;
      }
      const avgResolution = closedIssuesCount > 0 ? Math.round((resolutionSum / closedIssuesCount) * 10) / 10 : 0;

      // Bugs fixed: closed issues containing 'bug' or 'fix'
      const bugsFixed = await GithubIssue.countDocuments({
        assigneeUsername: githubUsername,
        state: 'closed',
        $or: [
          { title: { $regex: /bug/i } },
          { title: { $regex: /fix/i } }
        ]
      });

      await IssueMetrics.findOneAndUpdate(
        { user: user._id },
        {
          user: user._id,
          githubUsername,
          openIssuesCount,
          closedIssuesCount,
          resolutionRate,
          averageResolutionTime: avgResolution,
          bugsFixed,
          calculatedAt: now
        },
        { upsert: true, new: true }
      );
    }

    // 6. Compute EngineeringHealth per project
    for (const proj of projects) {
      // Productivity: tasks completed / total tasks
      const totalTasks = await Task.countDocuments({ project: proj._id });
      const completedTasks = await Task.countDocuments({ project: proj._id, status: 'done' });
      const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

      // Code Activity, Review Activity, Issue Resolution from project linked repos
      const projectRepos = await GithubRepository.find({ project: proj._id });
      const repoIds = projectRepos.map(r => r._id);

      const commitsCount = await GithubCommit.countDocuments({ repository: { $in: repoIds } });
      const mergedPRs = await GithubPullRequest.countDocuments({ repository: { $in: repoIds }, state: 'merged' });
      const codeActivity = repoIds.length > 0 
        ? Math.min(Math.round((commitsCount * 1.5 + mergedPRs * 10)), 100)
        : 80; // default base if no repos linked yet

      const reviewsCount = await GithubReview.countDocuments({ repository: { $in: repoIds } });
      const reviewActivity = repoIds.length > 0
        ? Math.min(Math.round(reviewsCount * 10), 100)
        : 75; // default base

      const totalIssues = await GithubIssue.countDocuments({ repository: { $in: repoIds } });
      const closedIssues = await GithubIssue.countDocuments({ repository: { $in: repoIds }, state: 'closed' });
      const issueResolution = totalIssues > 0 ? Math.round((closedIssues / totalIssues) * 100) : 100;

      // Participation: average participation score of users (e.g. project team members)
      // Retrieve logs
      const localUsers = await User.find({ role: { $nin: ['admin', 'Admin'] } });
      let participationSum = 0;
      for (const u of localUsers) {
        const logCount = await ActivityLog.countDocuments({ user: u._id });
        const partScore = Math.min((logCount / 10) * 100, 100);
        participationSum += partScore;
      }
      const participation = localUsers.length > 0 ? Math.round(participationSum / localUsers.length) : 90;

      // Formula: 25% Productivity + 25% Code Activity + 20% Review Activity + 15% Issue Resolution + 15% Team Participation
      const healthScore = Math.round(
        (productivity * 0.25) +
        (codeActivity * 0.25) +
        (reviewActivity * 0.20) +
        (issueResolution * 0.15) +
        (participation * 0.15)
      );

      await EngineeringHealth.findOneAndUpdate(
        { project: proj._id },
        {
          project: proj._id,
          projectName: proj.title,
          healthScore,
          productivity,
          codeActivity,
          reviewActivity,
          issueResolution,
          participation,
          calculatedAt: now
        },
        { upsert: true, new: true }
      );
    }

    console.log(`[Analytics Engine] Advanced Recalculation completed successfully in ${Date.now() - start}ms.`);
    return true;
  } catch (error) {
    console.error('[Analytics Engine Error] Failed recalculating advanced metrics:', error.message);
    throw error;
  } finally {
    isRecalculating = false;
  }
};

module.exports = {
  recalculateAllMetrics
};
