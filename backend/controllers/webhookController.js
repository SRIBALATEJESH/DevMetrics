const crypto = require('crypto');
const GithubRepository = require('../models/GithubRepository');
const GithubCommit = require('../models/GithubCommit');
const GithubPullRequest = require('../models/GithubPullRequest');
const GithubReview = require('../models/GithubReview');
const GithubIssue = require('../models/GithubIssue');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { recalculateAllMetrics } = require('../services/analyticsEngineService');

// Verify GitHub webhook signature
const verifySignature = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    console.warn('[Webhook Warning] No signature header present');
    return res.status(401).json({ status: 'fail', message: 'No signature provided' });
  }

  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'devmetrics_webhook_secret_key';
  const hmac = crypto.createHmac('sha256', secret);

  const payload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  // Perform timing-safe comparison
  const signatureBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);

  if (signatureBuffer.length === digestBuffer.length && crypto.timingSafeEqual(signatureBuffer, digestBuffer)) {
    return next();
  }

  console.warn('[Webhook Warning] Signature mismatch');
  return res.status(401).json({ status: 'fail', message: 'Invalid signature' });
};

// POST /api/github/webhook
const handleWebhook = async (req, res, next) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;
  const io = req.app.get('socketio');

  console.log(`[Webhook Received] Event: ${event}`);

  if (!event || !payload) {
    return res.status(400).json({ status: 'fail', message: 'Missing event or payload' });
  }

  try {
    // 1. Repository Validation
    const repoGithubId = payload.repository?.id?.toString();
    if (!repoGithubId) {
      return res.status(400).json({ status: 'fail', message: 'Missing repository information in payload' });
    }

    const repo = await GithubRepository.findOne({ githubId: repoGithubId });
    if (!repo) {
      console.warn(`[Webhook Rejected] Repository with GitHub ID ${repoGithubId} not found in DevMetrics`);
      return res.status(404).json({ status: 'fail', message: 'Repository not linked to DevMetrics' });
    }

    const projectId = repo.project || null;

    // 2. Event Type Processing
    if (event === 'push') {
      const commits = payload.commits || [];
      console.log(`[Webhook Push] Processing ${commits.length} commits for ${repo.fullName}`);
      
      for (const c of commits) {
        const commitData = {
          githubId: c.id,
          repository: repo._id,
          project: projectId,
          sha: c.id,
          message: c.message,
          authorName: c.author?.name || '',
          authorEmail: c.author?.email || '',
          authorUsername: c.author?.username || c.committer?.username || repo.owner,
          authorAvatar: c.author?.avatar_url || 'https://avatars.githubusercontent.com/u/99912345?v=4',
          date: new Date(c.timestamp),
          url: c.url,
          additions: c.added ? c.added.length : 0,
          deletions: c.removed ? c.removed.length : 0,
          changedFiles: (c.added ? c.added.length : 0) + (c.removed ? c.removed.length : 0) + (c.modified ? c.modified.length : 0)
        };

        await GithubCommit.findOneAndUpdate({ githubId: commitData.githubId }, commitData, { upsert: true });

        // Create notification / activity log for user if matched in database
        const user = await User.findOne({ githubUsername: commitData.authorUsername });
        if (user) {
          await Notification.create({
            user: user._id,
            message: `New commit pushed: "${commitData.message.substring(0, 50)}" to ${repo.name}`,
            type: 'project'
          });
          await ActivityLog.create({
            user: user._id,
            event: 'Commit pushed (GitHub Webhook)',
            metadata: { sha: commitData.sha, repository: repo.fullName }
          });
        }

        // Emit Socket.IO commit_added event
        if (io) {
          io.emit('commit_added', {
            repository: repo.name,
            sha: commitData.sha,
            author: commitData.authorUsername,
            message: commitData.message,
            project: projectId
          });
        }
      }

    } else if (event === 'pull_request') {
      const pr = payload.pull_request;
      const action = payload.action;
      console.log(`[Webhook PR] Processing PR #${pr.number} (action: ${action}) for ${repo.fullName}`);

      const prData = {
        githubId: pr.node_id,
        number: pr.number,
        repository: repo._id,
        project: projectId,
        title: pr.title,
        state: pr.merged_at ? 'merged' : pr.state,
        userUsername: pr.user?.login || '',
        userAvatar: pr.user?.avatar_url || '',
        merged: !!pr.merged_at,
        mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
        createdAt: new Date(pr.created_at),
        updatedAt: pr.updated_at ? new Date(pr.updated_at) : null,
        closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
        url: pr.html_url
      };

      const savedPR = await GithubPullRequest.findOneAndUpdate({ githubId: prData.githubId }, prData, { upsert: true, new: true });

      const creator = await User.findOne({ githubUsername: prData.userUsername });
      if (creator) {
        await Notification.create({
          user: creator._id,
          message: `Pull Request #${prData.number} ${action}: "${prData.title}"`,
          type: 'project'
        });
        await ActivityLog.create({
          user: creator._id,
          event: `PR ${action} (GitHub Webhook)`,
          metadata: { prNumber: prData.number, title: prData.title, repository: repo.fullName }
        });
      }

      if (io) {
        io.emit('pr_created', {
          action,
          number: prData.number,
          title: prData.title,
          author: prData.userUsername,
          state: prData.state,
          repository: repo.name,
          project: projectId
        });
      }

    } else if (event === 'pull_request_review') {
      const review = payload.review;
      const pr = payload.pull_request;
      console.log(`[Webhook Review] Processing review for PR #${pr.number} for ${repo.fullName}`);

      const prDoc = await GithubPullRequest.findOne({ githubId: pr.node_id });
      if (prDoc) {
        const reviewData = {
          githubId: review.id.toString(),
          pullRequest: prDoc._id,
          repository: repo._id,
          project: projectId,
          userUsername: review.user?.login || '',
          userAvatar: review.user?.avatar_url || '',
          state: review.state,
          submittedAt: new Date(review.submitted_at || Date.now()),
          body: review.body || '',
          url: review.html_url
        };

        await GithubReview.findOneAndUpdate({ githubId: reviewData.githubId }, reviewData, { upsert: true });

        const reviewer = await User.findOne({ githubUsername: reviewData.userUsername });
        if (reviewer) {
          await Notification.create({
            user: reviewer._id,
            message: `Submitted review on PR #${pr.number}: ${reviewData.state}`,
            type: 'project'
          });
          await ActivityLog.create({
            user: reviewer._id,
            event: 'PR Review submitted (GitHub Webhook)',
            metadata: { prNumber: pr.number, state: reviewData.state, repository: repo.fullName }
          });
        }

        if (io) {
          io.emit('review_submitted', {
            pullRequestNumber: pr.number,
            reviewer: reviewData.userUsername,
            state: reviewData.state,
            repository: repo.name,
            project: projectId
          });
        }
      }

    } else if (event === 'issues') {
      const issue = payload.issue;
      const action = payload.action;
      console.log(`[Webhook Issue] Processing issue #${issue.number} (action: ${action}) for ${repo.fullName}`);

      const issueData = {
        githubId: issue.node_id,
        number: issue.number,
        repository: repo._id,
        project: projectId,
        title: issue.title,
        state: issue.state,
        userUsername: issue.user?.login || '',
        userAvatar: issue.user?.avatar_url || '',
        assigneeUsername: issue.assignee?.login || '',
        createdAt: new Date(issue.created_at),
        updatedAt: issue.updated_at ? new Date(issue.updated_at) : null,
        closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
        url: issue.html_url
      };

      await GithubIssue.findOneAndUpdate({ githubId: issueData.githubId }, issueData, { upsert: true });

      const creator = await User.findOne({ githubUsername: issueData.userUsername });
      if (creator) {
        await Notification.create({
          user: creator._id,
          message: `Issue #${issueData.number} ${action}: "${issueData.title}"`,
          type: 'project'
        });
      }

      const assignee = await User.findOne({ githubUsername: issueData.assigneeUsername });
      if (assignee && issueData.assigneeUsername !== issueData.userUsername) {
        await Notification.create({
          user: assignee._id,
          message: `You were assigned to Issue #${issueData.number}: "${issueData.title}"`,
          type: 'project'
        });
      }

      if (io) {
        io.emit('issue_updated', {
          action,
          number: issueData.number,
          title: issueData.title,
          state: issueData.state,
          author: issueData.userUsername,
          assignee: issueData.assigneeUsername,
          repository: repo.name,
          project: projectId
        });
      }
    } else {
      console.log(`[Webhook] Unhandled event: ${event}`);
      return res.status(200).json({ status: 'success', message: 'Unhandled event type' });
    }

    // 3. Trigger Analytics Recalculation
    await recalculateAllMetrics();

    // 4. Emit global update event to trigger dashboard refresh
    if (io) {
      io.emit('analytics_updated', {
        event,
        repository: repo.fullName,
        timestamp: new Date()
      });
      io.emit('leaderboard_updated', {
        timestamp: new Date()
      });
    }

    return res.status(200).json({ status: 'success', message: 'Webhook event processed and metrics updated' });

  } catch (error) {
    console.error(`[Webhook Error] Failed processing event:`, error.message);
    next(error);
  }
};

module.exports = {
  verifySignature,
  handleWebhook
};
