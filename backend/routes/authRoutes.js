import express from 'express';

import {
  register,
  login,
  googleLogin,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
} from '../controllers/authController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);

router.post('/login', login);

router.post('/google', googleLogin);

router.post('/refresh', refreshAccessToken);

router.post('/logout', logout);

router.get('/me', protect, getMe);

router.get('/verify-email/:token', verifyEmail);

router.post('/resend-verification', resendVerification);

router.post('/forgot-password', forgotPassword);

router.put('/reset-password/:token', resetPassword);

export default router;