const mongoose = require('mongoose');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const GithubRepository = require('../models/GithubRepository');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devmetrics';
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'devmetrics_webhook_secret_key';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // 1. Find a repository in the database
    const repo = await GithubRepository.findOne({});
    if (!repo) {
      console.error('No GitHub repositories found in database. Please link/sync a repo first.');
      process.exit(1);
    }
    console.log(`Using target repository: ${repo.fullName} (GitHub ID: ${repo.githubId})`);

    // 2. Find a user in the database to be the author
    const user = await User.findOne({ githubConnected: true });
    const authorUsername = user ? user.githubUsername : 'john-dev';
    console.log(`Using mock event author: ${authorUsername}`);

    // Helper to send signed webhook payload
    const sendWebhookEvent = async (event, payload) => {
      const payloadString = JSON.stringify(payload);
      
      // Calculate HMAC SHA-256 signature
      const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
      const digest = 'sha256=' + hmac.update(payloadString).digest('hex');

      console.log(`\nTriggering webhook event [${event}]...`);
      
      const response = await fetch('http://localhost:5000/api/github/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': event,
          'X-Hub-Signature-256': digest
        },
        body: payloadString
      });

      const body = await response.json();
      console.log(`Response status: ${response.status}`);
      console.log('Response body:', body);
    };

    // --- MOCK EVENT 1: PUSH ---
    const pushPayload = {
      repository: {
        id: parseInt(repo.githubId) || 12345678,
        name: repo.name,
        full_name: repo.fullName,
        owner: {
          login: repo.owner
        }
      },
      commits: [
        {
          id: `verify_sha_${Math.random().toString(36).substring(2, 10)}`,
          message: 'feat: add real-time webhook dashboard sync verification',
          timestamp: new Date().toISOString(),
          url: `https://github.com/${repo.fullName}/commit/verify_sha_123`,
          author: {
            name: user ? user.name : 'Verify Test User',
            email: user ? user.email : 'verify@devmetrics.local',
            username: authorUsername
          },
          added: ['frontend/src/context/SocketContext.jsx'],
          removed: [],
          modified: ['frontend/src/components/Layout.jsx']
        }
      ]
    };
    await sendWebhookEvent('push', pushPayload);
    await sleep(2000);

    // --- MOCK EVENT 2: PULL REQUEST ---
    const prNumber = Math.floor(Math.random() * 100) + 200;
    const prNodeId = `verify_pr_node_${Math.random().toString(36).substring(2, 10)}`;
    const prPayload = {
      action: 'opened',
      repository: {
        id: parseInt(repo.githubId) || 12345678,
        name: repo.name,
        full_name: repo.fullName,
        owner: {
          login: repo.owner
        }
      },
      pull_request: {
        node_id: prNodeId,
        number: prNumber,
        title: 'Feature: Real-Time Socket.IO communication verification',
        state: 'open',
        html_url: `https://github.com/${repo.fullName}/pull/${prNumber}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        closed_at: null,
        merged_at: null,
        user: {
          login: authorUsername,
          avatar_url: 'https://avatars.githubusercontent.com/u/99912345?v=4'
        }
      }
    };
    await sendWebhookEvent('pull_request', prPayload);
    await sleep(2000);

    // --- MOCK EVENT 3: PR REVIEW ---
    const reviewPayload = {
      action: 'submitted',
      repository: {
        id: parseInt(repo.githubId) || 12345678,
        name: repo.name,
        full_name: repo.fullName,
        owner: {
          login: repo.owner
        }
      },
      pull_request: {
        node_id: prNodeId,
        number: prNumber
      },
      review: {
        id: Math.floor(Math.random() * 1000000),
        state: 'APPROVED',
        submitted_at: new Date().toISOString(),
        body: 'Verified successfully! Codes are clean and fully tested.',
        html_url: `https://github.com/${repo.fullName}/pull/${prNumber}#review`,
        user: {
          login: 'reviewer-lead',
          avatar_url: 'https://avatars.githubusercontent.com/u/99912346?v=4'
        }
      }
    };
    await sendWebhookEvent('pull_request_review', reviewPayload);
    await sleep(2000);

    // --- MOCK EVENT 4: ISSUES ---
    const issueNumber = Math.floor(Math.random() * 100) + 500;
    const issuePayload = {
      action: 'opened',
      repository: {
        id: parseInt(repo.githubId) || 12345678,
        name: repo.name,
        full_name: repo.fullName,
        owner: {
          login: repo.owner
        }
      },
      issue: {
        node_id: `verify_issue_node_${Math.random().toString(36).substring(2, 10)}`,
        number: issueNumber,
        title: 'Bug: Webhook verification mismatch on mock events',
        state: 'open',
        html_url: `https://github.com/${repo.fullName}/issues/${issueNumber}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        closed_at: null,
        user: {
          login: 'tester-john',
          avatar_url: 'https://avatars.githubusercontent.com/u/99912347?v=4'
        },
        assignee: {
          login: authorUsername
        }
      }
    };
    await sendWebhookEvent('issues', issuePayload);

    console.log('\nAll mock events generated successfully.');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Execution failed:', err);
  }
};

run();
