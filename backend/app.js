const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment configurations
dotenv.config();

const app = express();

// CORS configuration - manual headers for maximum reliability
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
  'https://dev-metrics-8tuo.vercel.app'
].filter(Boolean);

// Manual CORS middleware - runs FIRST before everything else
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Check if the request origin is allowed
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Immediately respond to preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Route registrations
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const teamRoutes = require('./routes/teamRoutes');
const taskRoutes = require('./routes/taskRoutes');
const activityRoutes = require('./routes/activityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const githubRoutes = require('./routes/githubRoutes');
const githubApiRoutes = require('./routes/githubApiRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const searchRoutes = require('./routes/searchRoutes');
const timelineRoutes = require('./routes/timelineRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const { protect } = require('./middleware/authMiddleware');
const { getMe } = require('./controllers/authController');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/auth/github', githubRoutes);
app.use('/api/github', githubApiRoutes);
app.use('/api/github/webhook', webhookRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/achievements', achievementRoutes);

app.get('/api/profile', protect, getMe);

// Basic Health Check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'DevMetrics Backend API is running successfully',
    timestamp: new Date()
  });
});

// Centralized error handler
const errorMiddleware = require('./middleware/errorMiddleware');
app.use(errorMiddleware);

module.exports = app;
