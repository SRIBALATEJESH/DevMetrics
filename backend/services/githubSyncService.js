const User = require('../models/User');
const Project = require('../models/Project');
const Team = require('../models/Team');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const GithubAccount = require('../models/GithubAccount');
const GithubRepository = require('../models/GithubRepository');
const GithubCommit = require('../models/GithubCommit');
const GithubPullRequest = require('../models/GithubPullRequest');
const GithubReview = require('../models/GithubReview');
const GithubIssue = require('../models/GithubIssue');
const { recalculateAllMetrics } = require('./analyticsEngineService');

// Helper to determine if we are in mock mode based on token
const isMockToken = (token) => {
  return false;
};

/**
 * Discover user's repositories from GitHub
 * @param {Object} user User document
 */
const discoverUserRepos = async (user) => {
  const token = user.githubAccessToken;
  const username = user.githubUsername;
  const userId = user._id;

  if (isMockToken(token)) {
    console.log(`[GitHub Sync] Discovering mock repos for username: ${username}`);
    // Pre-defined mock repositories
    const mockRepos = [
      {
        githubId: `mock_repo_101_${username}`,
        name: 'devmetrics',
        fullName: `${username}/devmetrics`,
        owner: username,
        description: 'Engineering contribution metrics and real-time dashboard analytics tracking.',
        url: `https://github.com/${username}/devmetrics`,
        language: 'JavaScript',
        stars: 12,
        forks: 4,
        visibility: 'public',
        defaultBranch: 'main'
      },
      {
        githubId: `mock_repo_102_${username}`,
        name: 'ecommerce-platform',
        fullName: `${username}/ecommerce-platform`,
        owner: username,
        description: 'A modular, high-scale microservices-based e-commerce storefront backend.',
        url: `https://github.com/${username}/ecommerce-platform`,
        language: 'TypeScript',
        stars: 48,
        forks: 18,
        visibility: 'public',
        defaultBranch: 'master'
      },
      {
        githubId: `mock_repo_103_${username}`,
        name: 'smart-logger',
        fullName: `${username}/smart-logger`,
        owner: username,
        description: 'Zero-dependency structured logging library with local rotational files.',
        url: `https://github.com/${username}/smart-logger`,
        language: 'JavaScript',
        stars: 5,
        forks: 1,
        visibility: 'public',
        defaultBranch: 'main'
      },
      {
        githubId: `mock_repo_104_${username}`,
        name: 'auth-service',
        fullName: `${username}/auth-service`,
        owner: username,
        description: 'Express.js JWT and Firebase OAuth proxy server helper.',
        url: `https://github.com/${username}/auth-service`,
        language: 'JavaScript',
        stars: 3,
        forks: 0,
        visibility: 'private',
        defaultBranch: 'main'
      },
      {
        githubId: `mock_repo_105_${username}`,
        name: 'react-dashboard',
        fullName: `${username}/react-dashboard`,
        owner: username,
        description: 'Premium dashboard components using CSS Grid and glassmorphism styling.',
        url: `https://github.com/${username}/react-dashboard`,
        language: 'CSS',
        stars: 22,
        forks: 9,
        visibility: 'public',
        defaultBranch: 'develop'
      }
    ];

    const savedRepos = [];
    for (const repoData of mockRepos) {
      // Upsert to keep configuration but update stats
      let repo = await GithubRepository.findOne({ githubId: repoData.githubId });
      if (!repo) {
        repo = await GithubRepository.create(repoData);
      } else {
        repo.description = repoData.description;
        repo.stars = repoData.stars;
        repo.forks = repoData.forks;
        repo.visibility = repoData.visibility;
        repo.defaultBranch = repoData.defaultBranch;
        await repo.save();
      }
      savedRepos.push(repo);
    }

    // Update GithubAccount public repos count
    await GithubAccount.findOneAndUpdate(
      { user: userId },
      { publicRepos: savedRepos.length, lastSync: new Date() },
      { upsert: true }
    );

    return savedRepos;
  } else {
    // Real GitHub API call
    console.log(`[GitHub Sync] Discovering real repos for: ${username}`);
    const response = await fetch('https://api.github.com/user/repos?per_page=100&type=owner', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'DevMetrics-OAuth-Integration',
        'Accept': 'application/vnd.github+json'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const reposList = await response.json();
    const savedRepos = [];

    for (const r of reposList) {
      const repoData = {
        githubId: r.id.toString(),
        name: r.name,
        fullName: r.full_name,
        owner: r.owner.login,
        description: r.description || '',
        url: r.html_url,
        language: r.language || 'JavaScript',
        stars: r.stargazers_count || 0,
        forks: r.forks_count || 0,
        visibility: r.private ? 'private' : 'public',
        defaultBranch: r.default_branch || 'main'
      };

      let repo = await GithubRepository.findOne({ githubId: repoData.githubId });
      if (!repo) {
        repo = await GithubRepository.create(repoData);
      } else {
        repo.name = repoData.name;
        repo.fullName = repoData.fullName;
        repo.owner = repoData.owner;
        repo.description = repoData.description;
        repo.stars = repoData.stars;
        repo.forks = repoData.forks;
        repo.visibility = repoData.visibility;
        repo.defaultBranch = repoData.defaultBranch;
        await repo.save();
      }
      savedRepos.push(repo);
    }

    await GithubAccount.findOneAndUpdate(
      { user: userId },
      { publicRepos: savedRepos.length, lastSync: new Date() },
      { upsert: true }
    );

    return savedRepos;
  }
};

/**
 * Sync telemetry data for a repository (Commits, PRs, Reviews, Issues)
 * @param {String} repoId MongoDB document ID of the repository
 * @param {Object} currentUser Currently authenticated user triggering sync
 */
const syncRepositoryData = async (repoId, currentUser) => {
  const repo = await GithubRepository.findById(repoId);
  if (!repo) throw new Error('Repository not found');

  const token = currentUser.githubAccessToken;
  const project = repo.project; // Linked project

  if (isMockToken(token)) {
    console.log(`[GitHub Sync] Generating mock telemetry for repo: ${repo.fullName}`);

    // Fetch all local users to distribute contributions
    const localUsers = await User.find({});
    const contributors = localUsers.map(u => ({
      userId: u._id,
      githubUsername: u.githubUsername || u.name.toLowerCase().replace(/\s+/g, '-'),
      name: u.name,
      email: u.email,
      avatar: u.githubAvatar || u.profilePicture || 'https://avatars.githubusercontent.com/u/99912345?v=4'
    }));

    // Find the developer user username for priority mapping
    const mainDev = contributors.find(c => c.githubUsername === currentUser.githubUsername) || contributors[0];

    // 1. Generate Mock Commits (25 commits over the last 30 days)
    const commitMessages = [
      "feat: implement OAuth flow for GitHub connection",
      "fix: resolve Firebase Token expiration issue",
      "refactor: optimize DB queries for analytics cards",
      "docs: update API documentation for repository linking",
      "test: add integration test cases for sync controller",
      "feat: add radar chart to contribution breakdown screen",
      "style: adjust responsive margins on settings page",
      "perf: reduce bundle size using dynamic component imports",
      "fix: user logout session revoking bug",
      "chore: bump version to 1.1.0 and release",
      "feat: add user status indicators on team directory",
      "fix: prevent dual registration of database schemas",
      "refactor: abstract firebase admin credentials loading",
      "docs: structure team performance layout guidelines",
      "feat: add line charts displaying Daily commits",
      "fix: patch XSS vulnerability in dashboard filters",
      "test: verify JWT authentication middleware under load",
      "style: apply typography improvements and Google fonts",
      "chore: remove legacy analytics controller scripts",
      "feat: implement issue resolution rate computation",
      "fix: correct access token scopes requested by callback",
      "refactor: migrate database configuration into config folder",
      "feat: add role based sidebar sections rendering",
      "docs: define phase 2 CI/CD deployment roadmap",
      "fix: repair custom roles case insensitivity logic"
    ];

    const syncDate = new Date();
    for (let i = 0; i < commitMessages.length; i++) {
      const commitDate = new Date();
      commitDate.setDate(syncDate.getDate() - Math.floor(i * 1.1));

      // Choose author: 50% current user, 50% other users
      const author = Math.random() > 0.5 ? mainDev : contributors[Math.floor(Math.random() * contributors.length)];

      const commitData = {
        githubId: `mock_commit_sha_${i}_${repo.name}`,
        repository: repo._id,
        project,
        sha: `sha256_${Math.random().toString(36).substring(2, 10)}${i}`,
        message: commitMessages[i],
        authorName: author.name,
        authorEmail: author.email,
        authorUsername: author.githubUsername,
        authorAvatar: author.avatar,
        date: commitDate,
        url: `https://github.com/${repo.fullName}/commit/mock_sha_${i}`
      };

      await GithubCommit.findOneAndUpdate(
        { githubId: commitData.githubId },
        commitData,
        { upsert: true }
      );
    }

    // 2. Generate Mock Pull Requests (8 PRs)
    const prTitles = [
      "Feature: GitHub OAuth settings connect / disconnect buttons",
      "Bugfix: JWT middleware authentication timeout failure",
      "Refactor: Database models directory cleanups",
      "Feature: Repository Management table and searching",
      "Feature: Repository Linking configuration view",
      "Bugfix: Google Auth login user missing local password bypass",
      "Feature: GitHub Analytics chart views using react-chartjs-2",
      "Feature: Add contribution radar metrics"
    ];

    const savedPRs = [];
    for (let i = 0; i < prTitles.length; i++) {
      const prDate = new Date();
      prDate.setDate(syncDate.getDate() - Math.floor(i * 3 + 2));

      const author = contributors[i % contributors.length];
      const state = i === 0 ? 'open' : (i === 3 ? 'closed' : 'merged');
      const merged = state === 'merged';

      const prData = {
        githubId: `mock_pr_node_${i}_${repo.name}`,
        number: 100 + i,
        repository: repo._id,
        project,
        title: prTitles[i],
        state,
        userUsername: author.githubUsername,
        userAvatar: author.avatar,
        merged,
        mergedAt: merged ? new Date(prDate.getTime() + 24 * 60 * 60 * 1000) : null,
        createdAt: prDate,
        updatedAt: new Date(prDate.getTime() + 12 * 60 * 60 * 1000),
        closedAt: state !== 'open' ? new Date(prDate.getTime() + 24 * 60 * 60 * 1000) : null,
        url: `https://github.com/${repo.fullName}/pull/${100 + i}`
      };

      const prDoc = await GithubPullRequest.findOneAndUpdate(
        { githubId: prData.githubId },
        prData,
        { upsert: true, new: true }
      );
      savedPRs.push(prDoc);
    }

    // 3. Generate Mock Reviews (6 reviews)
    for (let i = 0; i < savedPRs.length - 2; i++) {
      const reviewer = contributors[(i + 1) % contributors.length];
      const state = i % 3 === 0 ? 'CHANGES_REQUESTED' : 'APPROVED';

      const reviewData = {
        githubId: `mock_review_id_${i}_${repo.name}`,
        pullRequest: savedPRs[i]._id,
        repository: repo._id,
        project,
        userUsername: reviewer.githubUsername,
        userAvatar: reviewer.avatar,
        state,
        submittedAt: new Date(savedPRs[i].createdAt.getTime() + 4 * 60 * 60 * 1000),
        body: state === 'APPROVED' ? 'Looks extremely clean! Approved to merge.' : 'Please fix the CSS variables mapping first.',
        url: `https://github.com/${repo.fullName}/pull/${savedPRs[i].number}#review`
      };

      await GithubReview.findOneAndUpdate(
        { githubId: reviewData.githubId },
        reviewData,
        { upsert: true }
      );
    }

    // 4. Generate Mock Issues (8 issues)
    const issueTitles = [
      "CSS density issue in mobile layouts",
      "High connection pool load in Express service",
      "Leaderboard calculation missing sorting tie-breaker",
      "Document the config file credentials mapping requirements",
      "Sidebar icons rendering crashes in Firefox",
      "Task completion date not populating under dashboard profile",
      "JWT callback missing redirects parameters",
      "Enable responsive charts grid for smaller screens"
    ];

    for (let i = 0; i < issueTitles.length; i++) {
      const issueDate = new Date();
      issueDate.setDate(syncDate.getDate() - Math.floor(i * 3 + 1));

      const creator = contributors[i % contributors.length];
      const assignee = contributors[(i + 2) % contributors.length];
      const state = i < 3 ? 'open' : 'closed';

      const issueData = {
        githubId: `mock_issue_node_${i}_${repo.name}`,
        number: 400 + i,
        repository: repo._id,
        project,
        title: issueTitles[i],
        state,
        userUsername: creator.githubUsername,
        userAvatar: creator.avatar,
        assigneeUsername: assignee.githubUsername,
        createdAt: issueDate,
        updatedAt: new Date(issueDate.getTime() + 10 * 60 * 60 * 1000),
        closedAt: state === 'closed' ? new Date(issueDate.getTime() + 18 * 60 * 60 * 1000) : null,
        url: `https://github.com/${repo.fullName}/issues/${400 + i}`
      };

      await GithubIssue.findOneAndUpdate(
        { githubId: issueData.githubId },
        issueData,
        { upsert: true }
      );
    }

    repo.lastSync = new Date();
    await repo.save();

    // Log Activity & Notification for sync triggerer
    await ActivityLog.create({
      user: currentUser._id,
      event: `GitHub repository synced (Mock Mode)`,
      metadata: { repository: repo.fullName, repoId: repo._id }
    });

    await Notification.create({
      user: currentUser._id,
      message: `Sync completed for repository ${repo.name}. Contribution metrics updated.`,
      type: 'project'
    });

    // Recalculate advanced metrics
    await recalculateAllMetrics();

    return { success: true, message: `Mock sync completed for ${repo.fullName}` };
  } else {
    // Real GitHub Sync using global fetch
    console.log(`[GitHub Sync] Initiating real sync for repo: ${repo.fullName}`);
    const [owner, name] = repo.fullName.split('/');

    try {
      // 1. Fetch Commits
      const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${name}/commits?per_page=50`, {
        headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'DevMetrics-OAuth-Integration' }
      });
      if (commitsResponse.ok) {
        const commits = await commitsResponse.json();
        for (const c of commits) {
          const commitData = {
            githubId: c.sha,
            repository: repo._id,
            project,
            sha: c.sha,
            message: c.commit.message,
            authorName: c.commit.author?.name || '',
            authorEmail: c.commit.author?.email || '',
            authorUsername: c.author?.login || '',
            authorAvatar: c.author?.avatar_url || '',
            date: new Date(c.commit.author?.date || Date.now()),
            url: c.html_url
          };
          await GithubCommit.findOneAndUpdate({ githubId: commitData.githubId }, commitData, { upsert: true });
        }
      }

      // 2. Fetch Pull Requests
      const pullsResponse = await fetch(`https://api.github.com/repos/${owner}/${name}/pulls?state=all&per_page=50`, {
        headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'DevMetrics-OAuth-Integration' }
      });
      if (pullsResponse.ok) {
        const pulls = await pullsResponse.json();
        for (const p of pulls) {
          const prData = {
            githubId: p.node_id,
            number: p.number,
            repository: repo._id,
            project,
            title: p.title,
            state: p.merged_at ? 'merged' : p.state,
            userUsername: p.user?.login || '',
            userAvatar: p.user?.avatar_url || '',
            merged: !!p.merged_at,
            mergedAt: p.merged_at ? new Date(p.merged_at) : null,
            createdAt: new Date(p.created_at),
            updatedAt: p.updated_at ? new Date(p.updated_at) : null,
            closedAt: p.closed_at ? new Date(p.closed_at) : null,
            url: p.html_url
          };

          const prDoc = await GithubPullRequest.findOneAndUpdate({ githubId: prData.githubId }, prData, { upsert: true, new: true });

          // 3. Fetch Reviews for this PR
          const reviewsResponse = await fetch(`https://api.github.com/repos/${owner}/${name}/pulls/${p.number}/reviews`, {
            headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'DevMetrics-OAuth-Integration' }
          });
          if (reviewsResponse.ok) {
            const reviews = await reviewsResponse.json();
            for (const r of reviews) {
              const reviewData = {
                githubId: r.id.toString(),
                pullRequest: prDoc._id,
                repository: repo._id,
                project,
                userUsername: r.user?.login || '',
                userAvatar: r.user?.avatar_url || '',
                state: r.state,
                submittedAt: new Date(r.submitted_at || Date.now()),
                body: r.body || '',
                url: r.html_url
              };
              await GithubReview.findOneAndUpdate({ githubId: reviewData.githubId }, reviewData, { upsert: true });
            }
          }
        }
      }

      // 4. Fetch Issues
      const issuesResponse = await fetch(`https://api.github.com/repos/${owner}/${name}/issues?state=all&per_page=50`, {
        headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'DevMetrics-OAuth-Integration' }
      });
      if (issuesResponse.ok) {
        const issues = await issuesResponse.json();
        for (const i of issues) {
          // GitHub API returns PRs as issues, so filter them out
          if (i.pull_request) continue;

          const issueData = {
            githubId: i.node_id,
            number: i.number,
            repository: repo._id,
            project,
            title: i.title,
            state: i.state,
            userUsername: i.user?.login || '',
            userAvatar: i.user?.avatar_url || '',
            assigneeUsername: i.assignee?.login || '',
            createdAt: new Date(i.created_at),
            updatedAt: i.updated_at ? new Date(i.updated_at) : null,
            closedAt: i.closed_at ? new Date(i.closed_at) : null,
            url: i.html_url
          };
          await GithubIssue.findOneAndUpdate({ githubId: issueData.githubId }, issueData, { upsert: true });
        }
      }

      repo.lastSync = new Date();
      await repo.save();

      // Log Activity & Notification for sync triggerer
      await ActivityLog.create({
        user: currentUser._id,
        event: `GitHub repository synced (Real Mode)`,
        metadata: { repository: repo.fullName, repoId: repo._id }
      });

      await Notification.create({
        user: currentUser._id,
        message: `Sync completed for repository ${repo.name}. Contribution metrics updated.`,
        type: 'project'
      });

      // Recalculate advanced metrics
      await recalculateAllMetrics();

      return { success: true, message: `Real sync completed for ${repo.fullName}` };
    } catch (err) {
      console.error(`[GitHub Sync Error] Failed syncing repo ${repo.fullName}:`, err.message);
      throw err;
    }
  }
};

module.exports = {
  discoverUserRepos,
  syncRepositoryData
};
