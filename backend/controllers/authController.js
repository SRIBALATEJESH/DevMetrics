const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const ActivityLog = require('../models/ActivityLog');
const admin = require('../config/firebaseAdmin');

// Parse device name helper from User-Agent
const parseDevice = (ua) => {
  if (!ua) return 'Unknown Device';
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
    if (ua.includes('iPhone')) return 'Apple iPhone';
    if (ua.includes('iPad')) return 'Apple iPad';
    return 'Mobile Device';
  }
  if (ua.includes('Windows')) return 'Windows PC';
  if (ua.includes('Macintosh') || ua.includes('Mac OS X')) return 'macOS Device';
  if (ua.includes('Linux')) return 'Linux PC';
  return 'Desktop Web Browser';
};

// Helper to generate JWT token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role }, 
    process.env.JWT_SECRET || 'devmetrics_secret_key', 
    { expiresIn: '30d' }
  );
};

// Helper to build user response data
const buildUserData = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  bio: user.bio,
  phone: user.phone,
  profilePicture: user.profilePicture,
  profileImage: user.profileImage,
  authProvider: user.authProvider,
  theme: user.theme,
  density: user.density,
  publicProfile: user.publicProfile,
  showContributionScore: user.showContributionScore,
  showActivityTimeline: user.showActivityTimeline,
  taskAlerts: user.taskAlerts,
  deadlineReminders: user.deadlineReminders,
  projectUpdates: user.projectUpdates,
  contributionUpdates: user.contributionUpdates,
  emailNotifications: user.emailNotifications,
  githubId: user.githubId,
  githubUsername: user.githubUsername,
  githubAvatar: user.githubAvatar,
  githubConnected: user.githubConnected,
  skills: user.skills || [],
  favoriteProjects: user.favoriteProjects || [],
  bookmarks: user.bookmarks || [],
  streakCount: user.streakCount || 0,
  lastContributionDate: user.lastContributionDate,
  dashboardConfig: user.dashboardConfig || {},
  hasPassword: user.hasPassword !== undefined ? user.hasPassword : (user.password !== undefined)
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role, firebaseUid } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email and password'
      });
    }

    // Check if user email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'A user with this email address already exists'
      });
    }

    // Create new user
    const userData = {
      name,
      email,
      password,
      role: role || 'developer',
      authProvider: 'local'
    };

    // If Firebase UID is provided (registered via Firebase on frontend)
    if (firebaseUid) {
      userData.firebaseUid = firebaseUid;
    }

    const user = await User.create(userData);

    const token = generateToken(user._id, user.role);
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const parsedDevice = parseDevice(userAgent);

    // Save session
    await UserSession.create({
      user: user._id,
      token,
      ip,
      device: parsedDevice
    });

    // Log activity
    await ActivityLog.create({
      user: user._id,
      event: 'Account registered and logged in',
      metadata: { ip, device: parsedDevice }
    });

    res.status(201).json({
      status: 'success',
      token,
      data: buildUserData(user)
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error during user registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
    }

    // Lookup user by email and explicitly include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password'
      });
    }

    // If user registered via Google, they can't use email/password login
    if (user.authProvider === 'google' && !user.password) {
      return res.status(401).json({
        status: 'fail',
        message: 'This account uses Google Sign-In. Please log in with Google.'
      });
    }

    // Verify password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id, user.role);
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const parsedDevice = parseDevice(userAgent);

    // Save session
    await UserSession.create({
      user: user._id,
      token,
      ip,
      device: parsedDevice
    });

    // Log activity
    await ActivityLog.create({
      user: user._id,
      event: 'User logged in',
      metadata: { ip, device: parsedDevice }
    });

    res.status(200).json({
      status: 'success',
      token,
      data: buildUserData(user)
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error during authentication login'
    });
  }
};

// @desc    Google Sign-In (verify Firebase ID token, find/create user)
// @route   POST /api/auth/google-login
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        status: 'fail',
        message: 'Firebase ID token is required'
      });
    }

    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (firebaseError) {
      console.error('Firebase token verification failed:', firebaseError.message);
      return res.status(401).json({
        status: 'fail',
        message: `Invalid or expired Firebase token: ${firebaseError.message}`
      });
    }

    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Google account does not have an email address'
      });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const parsedDevice = parseDevice(userAgent);

    // Check if user already exists by firebaseUid or email
    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, { email: email.toLowerCase() }]
    });

    let isNewUser = false;

    if (!user) {
      // First-time Google login — create new user
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        firebaseUid: uid,
        authProvider: 'google',
        profileImage: picture || '',
        profilePicture: picture || '',
        role: 'developer' // Default role, user will select in modal
      });
      isNewUser = true;

      // Log activity
      await ActivityLog.create({
        user: user._id,
        event: 'Account created via Google Sign-In',
        metadata: { ip, device: parsedDevice }
      });
    } else {
      // Existing user — update Firebase UID and profile image if not set
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
      }
      if (!user.authProvider || user.authProvider === 'local') {
        // If user previously registered with email/password, link their Google account
        user.authProvider = user.password ? user.authProvider : 'google';
      }
      if (picture && !user.profileImage) {
        user.profileImage = picture;
        user.profilePicture = picture;
      }
      await user.save();
    }

    const token = generateToken(user._id, user.role);

    // Save session
    await UserSession.create({
      user: user._id,
      token,
      ip,
      device: parsedDevice
    });

    // Log login activity
    if (!isNewUser) {
      await ActivityLog.create({
        user: user._id,
        event: 'User logged in via Google',
        metadata: { ip, device: parsedDevice }
      });
    }

    res.status(200).json({
      status: 'success',
      token,
      isNewUser,
      needsRole: isNewUser, // Frontend shows role selection modal
      data: buildUserData(user)
    });
  } catch (error) {
    console.error('Google login error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error during Google authentication'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('favoriteProjects', 'title status description')
      .select('+password');
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }
    const hasPassword = !!user.password;
    const formattedUser = buildUserData(user);
    formattedUser.hasPassword = hasPassword;

    res.status(200).json({
      status: 'success',
      data: formattedUser
    });
  } catch (error) {
    console.error('getMe profile error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving user profile'
    });
  }
};

// @desc    Connect Google Account to existing logged-in profile
// @route   POST /api/auth/google-connect
// @access  Private
const connectGoogle = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        status: 'fail',
        message: 'Firebase ID token is required'
      });
    }

    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (firebaseError) {
      console.error('Firebase token verification failed:', firebaseError.message);
      return res.status(401).json({
        status: 'fail',
        message: `Invalid or expired Firebase token: ${firebaseError.message}`
      });
    }

    const { uid, email, picture } = decodedToken;

    // Check if another user already has this firebaseUid
    const existingUidUser = await User.findOne({ firebaseUid: uid });
    if (existingUidUser && existingUidUser._id.toString() !== req.user.id) {
      return res.status(400).json({
        status: 'fail',
        message: 'This Google account is already connected to another DevMetrics profile.'
      });
    }

    // Update current user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User profile not found'
      });
    }

    user.firebaseUid = uid;
    user.authProvider = 'google'; // Mark as google auth provider
    if (picture && !user.profileImage) {
      user.profileImage = picture;
      user.profilePicture = picture;
    }
    await user.save();

    // Log connect activity
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const parsedDevice = parseDevice(userAgent);
    
    await ActivityLog.create({
      user: user._id,
      event: 'Google account connected',
      metadata: { ip, device: parsedDevice, googleEmail: email }
    });

    const userWithPassword = await User.findById(user._id).select('+password');
    const hasPassword = !!(userWithPassword && userWithPassword.password);

    const formattedUser = buildUserData(user);
    formattedUser.hasPassword = hasPassword;

    res.status(200).json({
      status: 'success',
      data: formattedUser
    });
  } catch (error) {
    console.error('Google connect error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error during Google account connection'
    });
  }
};

// @desc    Disconnect Google Account
// @route   POST /api/auth/google-disconnect
// @access  Private
const disconnectGoogle = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User profile not found'
      });
    }

    // Check if user has password, otherwise they cannot log in local
    if (!user.password && user.authProvider === 'google') {
      return res.status(400).json({
        status: 'fail',
        message: 'Please set a local password under Security settings before disconnecting your Google account, otherwise you will be locked out.'
      });
    }

    // Use Mongoose undefined to remove it or update it
    user.firebaseUid = undefined;
    user.authProvider = 'local';
    await user.save();

    // Log disconnect activity
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const parsedDevice = parseDevice(userAgent);

    await ActivityLog.create({
      user: user._id,
      event: 'Google account disconnected',
      metadata: { ip, device: parsedDevice }
    });

    const formattedUser = buildUserData(user);
    formattedUser.hasPassword = true; // Must have password to disconnect successfully

    res.status(200).json({
      status: 'success',
      data: formattedUser
    });
  } catch (error) {
    console.error('Google disconnect error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error during Google account disconnection'
    });
  }
};

const createMailTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass || user.includes('your_gmail_address') || pass.includes('your_gmail_app_password')) {
    console.warn('⚠️  Nodemailer SMTP credentials not configured in .env. Falling back to local logging.');
    return null;
  }

  // Create transporter for Gmail with fast fail timeouts
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000
  });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ status: 'fail', message: 'Please provide an email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'No account found with this email address' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Create reset URL
    const frontendBaseUrl = process.env.CLIENT_URL || req.headers.origin || 'http://localhost:5173';
    const resetUrl = `${frontendBaseUrl}/reset-password/${resetToken}`;

    // Print to console
    console.log('\n==================================================');
    console.log(`[PASSWORD RESET] Email sent to: ${email}`);
    console.log(`[PASSWORD RESET] Link: ${resetUrl}`);
    console.log('==================================================\n');

    // Attempt real-time email dispatch
    const transporter = createMailTransporter();
    let emailSentRealtime = false;

    if (transporter) {
      try {
        const mailOptions = {
          from: `"DevMetrics Support" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Reset Your DevMetrics Password',
          html: `
            <div style="font-family: 'Inter', sans-serif; background-color: #0A0E14; color: #E6EDF3; padding: 40px; border-radius: 10px; max-width: 600px; margin: 0 auto; border: 1px solid #222A35;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #6E76F2; margin: 0; font-size: 28px; font-weight: 700;">DevMetrics</h2>
                <p style="color: #8B949E; margin: 5px 0 0 0; font-size: 14px;">Engineering Intelligence Platform</p>
              </div>
              <div style="background-color: #0D1117; padding: 30px; border-radius: 8px; border: 1px solid #1B222C;">
                <h3 style="color: #E6EDF3; margin-top: 0; font-size: 20px;">Password Reset Request</h3>
                <p style="color: #8B949E; line-height: 1.6; font-size: 15px;">We received a request to reset the password for your DevMetrics engineering account. Click the button below to set a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="background-color: #6E76F2; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(110, 118, 242, 0.35);">Reset Password</a>
                </div>
                <p style="color: #8B949E; line-height: 1.6; font-size: 14px;">This link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.</p>
              </div>
              <div style="text-align: center; margin-top: 30px; color: #5B6472; font-size: 12px;">
                <p>© 2026 DevMetrics, Inc. · 88 Colin P Kelly Jr St, San Francisco, CA 94107</p>
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[Nodemailer] Successfully sent password reset email to: ${email}`);
        emailSentRealtime = true;
      } catch (mailErr) {
        console.error('[Nodemailer] Failed to send email via SMTP:', mailErr.message);
      }
    }

    // Write to file
    const logPath = path.join(__dirname, '../temp-reset-emails.log');
    const logContent = `[${new Date().toISOString()}] To: ${email} | Link: ${resetUrl} | Realtime SMTP: ${emailSentRealtime ? 'SUCCESS' : 'FAILED/SKIPPED'}\n`;
    fs.appendFileSync(logPath, logContent, 'utf8');

    res.status(200).json({
      status: 'success',
      message: emailSentRealtime
        ? 'Password reset link sent to your email successfully.'
        : 'Password reset link generated and logged locally (SMTP not configured).'
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error during forgot password' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide a new password' });
    }

    // Get hashed token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ status: 'fail', message: 'Invalid or expired password reset token' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Sync to Firebase Auth if user has firebaseUid
    if (user.firebaseUid) {
      try {
        await admin.auth().updateUser(user.firebaseUid, {
          password: password
        });
        console.log(`[Firebase Auth] Successfully updated password for firebaseUid: ${user.firebaseUid}`);
      } catch (firebaseErr) {
        console.warn(`[Firebase Auth] Failed to sync password update for user ${user.email}:`, firebaseErr.message);
      }
    }

    // Log activity
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const parsedDevice = parseDevice(userAgent);
    
    await ActivityLog.create({
      user: user._id,
      event: 'Password reset completed via token',
      metadata: { ip, device: parsedDevice }
    });

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error during password reset' });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  getMe,
  connectGoogle,
  disconnectGoogle,
  forgotPassword,
  resetPassword
};
