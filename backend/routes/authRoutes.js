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
  updateProfile,
} from '../controllers/authController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);

router.post('/login', login);

router.post('/google', googleLogin);

router.post('/logout', protect, logout);

router.get('/me', protect, getMe);

router.get('/verify-email/:token', verifyEmail);

router.post('/resend-verification', protect, resendVerification);

router.post('/forgot-password', forgotPassword);

router.put('/reset-password/:token', resetPassword);

router.put('/profile', protect, updateProfile);

export default router;