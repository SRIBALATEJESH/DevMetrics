const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Read header for Bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devmetrics_secret_key');

      // Verify active session exists and is not revoked
      const UserSession = require('../models/UserSession');
      const activeSession = await UserSession.findOne({ token, isRevoked: false });
      if (!activeSession) {
        56
        return res.status(401).json({
          status: 'fail',
          message: 'Not authorized, this session has been revoked'
        });
      }

      // Fetch user from database and append to request, excluding password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          status: 'fail',
          message: 'User belonging to this token no longer exists'
        });
      }

      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({
        status: 'fail',
        message: 'Not authorized, token failed verification'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Not authorized, no verification token found'
    });
  }
};

module.exports = { protect };