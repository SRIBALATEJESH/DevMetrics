const express = require('express');
const { 
  register, 
  login, 
  googleLogin, 
  getMe, 
  connectGoogle, 
  disconnectGoogle,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { registerSchema, loginSchema } = require('../validations/authValidation');
const validationMiddleware = require('../middleware/validationMiddleware');

const router = express.Router();

// Public routes
router.post('/register', registerSchema, validationMiddleware, register);
router.post('/login', loginSchema, validationMiddleware, login);
router.post('/google-login', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Private routes
router.get('/me', protect, getMe);
router.post('/google-connect', protect, connectGoogle);
router.post('/google-disconnect', protect, disconnectGoogle);

module.exports = router;
