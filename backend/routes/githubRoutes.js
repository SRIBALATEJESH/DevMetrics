const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const ActivityLog = require('../models/ActivityLog');
const GithubAccount = require('../models/GithubAccount');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getGithubProfile,
  getRepositories,
  refreshRepositories,
  linkRepository,
  unlinkRepository,
  syncRepository,
  getGithubAnalytics,
  disconnectGithub
} = require('../controllers/githubController');

const router = express.Router();

const JWT_SECRET = () => process.env.JWT_SECRET || 'devmetrics_secret_key';

// Helper: generate a DevMetrics JWT for session auth
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET(), { expiresIn: '30d' });
};

// Helper: dynamically find frontend URL based on request origin
const getFrontendUrl = (req) => {
  const referer = req.headers.referer || '';
  if (referer.includes('localhost:5174')) return 'http://localhost:5174';
  if (referer.includes('localhost:5173')) return 'http://localhost:5173';
  const origin = req.headers.origin || '';
  if (origin.includes('localhost:5174')) return 'http://localhost:5174';
  if (origin.includes('localhost:5173')) return 'http://localhost:5173';
  return 'http://localhost:5174'; // Default to active port 5174
};

// Helper: exchange GitHub code for access token + profile (mock or real)
const exchangeCodeForProfile = async (code) => {
  const isMockCode = false;

  let accessToken, githubProfile;

  if (isMockCode) {
    accessToken = `mock_access_token_${Math.random().toString(36).substring(2, 12)}`;
    let fixedId = 99900000 + Math.floor(Math.random() * 100000);
    let login = `dev-user-${Math.random().toString(36).substring(2, 6)}`;
    if (code.startsWith('mock_code_fixed_')) {
      const suffix = code.replace('mock_code_fixed_', '');
      fixedId = parseInt(suffix) || 12345;
      login = `dev-user-fixed-${fixedId}`;
    }
    githubProfile = {
      id: fixedId,
      login: login,
      avatar_url: 'https://avatars.githubusercontent.com/u/99912345?v=4',
      name: 'GitHub User',
      email: null
    };
  } else {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });

    if (!tokenResponse.ok) throw new Error('Failed to exchange authorization code for access token');

    const tokenData = await tokenResponse.json();
    accessToken = tokenData.access_token;
    if (!accessToken) throw new Error(tokenData.error_description || tokenData.error || 'Access token not received');

    const userResponse = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': 'DevMetrics-OAuth-Integration' }
    });
    if (!userResponse.ok) throw new Error('Failed to retrieve GitHub user profile');

    githubProfile = await userResponse.json();

    // Fetch primary email if not returned in main profile
    if (!githubProfile.email) {
      try {
        const emailsResponse = await fetch('https://api.github.com/user/emails', {
          headers: { 'Authorization': `Bearer ${accessToken}`, 'User-Agent': 'DevMetrics-OAuth-Integration' }
        });
        if (emailsResponse.ok) {
          const emailsList = await emailsResponse.json();
          if (Array.isArray(emailsList)) {
            const primaryEmail = emailsList.find(e => e.primary === true && e.verified === true) || 
                               emailsList.find(e => e.primary === true) || 
                               emailsList[0];
            if (primaryEmail) {
              githubProfile.email = primaryEmail.email;
            }
          }
        }
      } catch (err) {
        console.error('Error fetching email list from GitHub:', err.message);
      }
    }
  }

  return { accessToken, githubProfile, isMockCode };
};

// Helper: build redirect URL to GitHub OAuth or mock
const buildOAuthRedirect = (stateToken, isMockMode) => {
  if (isMockMode) {
    const mockCode = `mock_code_${Math.random().toString(36).substring(2, 10)}`;
    return `/api/auth/github/callback?code=${mockCode}&state=${stateToken}`;
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback';
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=read:user,user:email&state=${stateToken}`;
};

// Helper to authenticate requests (accepts query token or header Authorization)
const getAuthenticatedUser = async (req) => {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET());
    const activeSession = await UserSession.findOne({ token, isRevoked: false });
    if (!activeSession) return null;
    return await User.findById(decoded.id);
  } catch (error) {
    console.error('Auth check error in GitHub router:', error.message);
    return null;
  }
};

// Parse device name from User-Agent
const parseDevice = (ua) => {
  if (!ua) return 'Unknown Device';
  if (ua.includes('iPhone')) return 'Apple iPhone';
  if (ua.includes('iPad')) return 'Apple iPad';
  if (ua.includes('Mobile') || ua.includes('Android')) return 'Mobile Device';
  if (ua.includes('Windows')) return 'Windows PC';
  if (ua.includes('Macintosh') || ua.includes('Mac OS X')) return 'macOS Device';
  if (ua.includes('Linux')) return 'Linux PC';
  return 'Desktop Web Browser';
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Start GitHub OAuth LOGIN (unauthenticated — for login/signup page)
// @route   GET /api/auth/github
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
router.get(['/', '/login'], (req, res) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const isMockMode = false;

    const stateToken = jwt.sign(
      { purpose: 'login' },
      JWT_SECRET(),
      { expiresIn: '15m' }
    );

    console.log(`[GitHub OAuth] Login flow started (${isMockMode ? 'MOCK' : 'REAL'} mode)`);
    return res.redirect(buildOAuthRedirect(stateToken, isMockMode));
  } catch (error) {
    console.error('Error starting GitHub login:', error.message);
    return res.redirect(`${getFrontendUrl(req)}/login?github=error&message=${encodeURIComponent(error.message)}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Start GitHub OAuth CONNECT (authenticated — for settings page)
// @route   GET /api/auth/github/connect
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/connect', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Unauthorized connection request. Please log in first.'
      });
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const isMockMode = false;

    const stateToken = jwt.sign(
      { purpose: 'connect', userId: user._id.toString() },
      JWT_SECRET(),
      { expiresIn: '15m' }
    );

    console.log(`[GitHub OAuth] Connect flow started for ${user.email} (${isMockMode ? 'MOCK' : 'REAL'} mode)`);
    return res.redirect(buildOAuthRedirect(stateToken, isMockMode));
  } catch (error) {
    console.error('Error starting GitHub connect:', error.message);
    return res.redirect(`${getFrontendUrl(req)}/settings?github=error&message=${encodeURIComponent(error.message)}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    GitHub OAuth callback (handles both login and connect flows)
// @route   GET /api/auth/github/callback
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!state) return res.redirect(`${getFrontendUrl(req)}/login?github=error&message=Missing state parameter`);
  if (!code) return res.redirect(`${getFrontendUrl(req)}/login?github=error&message=Missing authorization code`);

  try {
    let decoded;
    try {
      decoded = jwt.verify(state, JWT_SECRET());
    } catch (err) {
      return res.redirect(`${getFrontendUrl(req)}/login?github=error&message=State verification failed or expired`);
    }

    const purpose = decoded.purpose || 'connect';

    // Exchange authorization code for GitHub profile
    const { accessToken, githubProfile, isMockCode } = await exchangeCodeForProfile(code);

    // ═══════════════════════════════════════════════════════════════════════
    // LOGIN FLOW — find or create user by GitHub ID, issue JWT session
    // ═══════════════════════════════════════════════════════════════════════
    if (purpose === 'login') {
      const githubId = (githubProfile.id || '').toString();

      // Try to find existing user by githubId
      let user = await User.findOne({ githubId });
      let isNewUser = false;

      if (!user) {
        // First-time GitHub login — create a new user
        const username = githubProfile.login || `github-user-${githubId}`;
        const email = githubProfile.email || `${username}@github.devmetrics.local`;

        user = await User.create({
          name: githubProfile.name || username,
          email,
          authProvider: 'github',
          role: 'Developer',
          githubId,
          githubUsername: githubProfile.login || '',
          githubAvatar: githubProfile.avatar_url || '',
          githubAccessToken: accessToken,
          githubConnected: true,
          profileImage: githubProfile.avatar_url || '',
          profilePicture: githubProfile.avatar_url || ''
        });
        isNewUser = true;

        await ActivityLog.create({
          user: user._id,
          event: 'Account created via GitHub Sign-In',
          metadata: { githubUsername: user.githubUsername, githubId, isMockMode: isMockCode }
        });
      } else {
        // Existing user — update GitHub token and profile data
        user.githubAccessToken = accessToken;
        user.githubConnected = true;
        if (githubProfile.avatar_url && !user.profileImage) {
          user.profileImage = githubProfile.avatar_url;
          user.profilePicture = githubProfile.avatar_url;
        }
        await user.save();
      }

      // Sync user GitHub account details in the GithubAccount collection
      await GithubAccount.findOneAndUpdate(
        { user: user._id },
        {
          githubId: user.githubId,
          username: user.githubUsername,
          avatarUrl: user.githubAvatar,
          name: githubProfile.name || user.name,
          email: githubProfile.email || user.email,
          followers: githubProfile.followers || 0,
          following: githubProfile.following || 0,
          publicRepos: githubProfile.public_repos || 0,
          lastSync: new Date()
        },
        { upsert: true, new: true }
      );

      // Generate session token
      const sessionToken = generateToken(user._id, user.role);
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown Browser';

      await UserSession.create({
        user: user._id,
        token: sessionToken,
        ip,
        device: parseDevice(userAgent)
      });

      if (!isNewUser) {
        await ActivityLog.create({
          user: user._id,
          event: 'User logged in via GitHub',
          metadata: { ip, device: parseDevice(userAgent) }
        });
      }

      // Redirect to frontend with the session token
      return res.redirect(
        `${getFrontendUrl(req)}/login?github_token=${sessionToken}&github_new=${isNewUser}`
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONNECT FLOW — link GitHub to an existing authenticated user
    // ═══════════════════════════════════════════════════════════════════════
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.redirect(`${getFrontendUrl(req)}/settings?github=error&message=User not found`);
    }

    // Check if another user has this GitHub account connected
    const githubId = (githubProfile.id || '').toString();
    const existingConnection = await User.findOne({
      githubId,
      githubConnected: true,
      _id: { $ne: user._id }
    });

    if (existingConnection) {
      return res.redirect(`${getFrontendUrl(req)}/settings?github=error&message=${encodeURIComponent('This GitHub account is already connected to another user profile.')}`);
    }

    // Double check GithubAccount mapping collection to prevent duplicates
    const existingAccount = await GithubAccount.findOne({
      githubId,
      user: { $ne: user._id }
    });
    if (existingAccount) {
      const connectedUser = await User.findById(existingAccount.user);
      if (connectedUser && connectedUser.githubConnected) {
        return res.redirect(`${getFrontendUrl(req)}/settings?github=error&message=${encodeURIComponent('This GitHub account is already connected to another user profile.')}`);
      }
    }

    // If using mock mode for connect, personalise the profile username
    if (isMockCode) {
      githubProfile.login = user.name.toLowerCase().replace(/\s+/g, '-');
      githubProfile.name = user.name;
    }

    user.githubId = githubId;
    user.githubUsername = githubProfile.login || '';
    user.githubAvatar = githubProfile.avatar_url || '';
    user.githubAccessToken = accessToken;
    user.githubConnected = true;
    await user.save();

    // Sync user GitHub account details in the GithubAccount collection
    await GithubAccount.findOneAndUpdate(
      { user: user._id },
      {
        githubId: user.githubId,
        username: user.githubUsername,
        avatarUrl: user.githubAvatar,
        name: githubProfile.name || user.name,
        email: githubProfile.email || user.email,
        followers: githubProfile.followers || 0,
        following: githubProfile.following || 0,
        publicRepos: githubProfile.public_repos || 0,
        lastSync: new Date()
      },
      { upsert: true, new: true }
    );

    await ActivityLog.create({
      user: user._id,
      event: 'GitHub account connected',
      metadata: { githubUsername: user.githubUsername, githubId: user.githubId, isMockMode: isMockCode }
    });

    return res.redirect(`${getFrontendUrl(req)}/settings?github=success`);
  } catch (error) {
    console.error('GitHub Callback Error:', error.message);
    return res.redirect(`${getFrontendUrl(req)}/login?github=error&message=${encodeURIComponent(error.message)}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Disconnect GitHub account
// @route   DELETE /api/auth/github/disconnect
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/disconnect', protect, disconnectGithub);

// ─────────────────────────────────────────────────────────────────────────────
// NEW METRICS & SYNCHRONIZATION API ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

router.get('/profile', protect, getGithubProfile);
router.get('/repositories', protect, authorize('admin', 'project manager', 'team lead', 'developer'), getRepositories);
router.post('/repositories/refresh', protect, authorize('admin', 'project manager', 'team lead', 'developer'), refreshRepositories);
router.post('/repositories/link', protect, authorize('admin', 'project manager'), linkRepository);
router.post('/repositories/unlink', protect, authorize('admin', 'project manager'), unlinkRepository);
router.post('/repositories/sync', protect, authorize('admin', 'project manager'), syncRepository);
router.get('/analytics', protect, getGithubAnalytics);

module.exports = router;
