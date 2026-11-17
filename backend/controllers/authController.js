import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import sendEmail, { isEmailConfigured } from '../utils/sendEmail.js';

import {
  generateAccessToken,
  createRefreshToken,
} from '../utils/generateAuthTokens.js';

import { setRefreshTokenCookie } from '../utils/refreshTokenCookie.js';

import {
  consumeRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
} from '../utils/generateAuthTokens.js';

import { clearRefreshTokenCookie } from '../utils/refreshTokenCookie.js';

import RefreshToken from '../models/RefreshToken.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getVerificationEmailHtml = (name, url) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Welcome to Course Platform, ${name}!</h2>

    <p>Please verify your email address by clicking the button below:</p>

    <a href="${url}"
       style="display:inline-block;padding:12px 24px;background:#4f46e5;color:white;text-decoration:none;border-radius:6px;">
       Verify Email
    </a>

    <p>Or copy this link:</p>
    <p>${url}</p>

    <p>This link expires in 24 hours.</p>
  </div>
`;

const getResetPasswordEmailHtml = (name, url) => 
  `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Password Reset Request</h2>

    <p>Hi ${name},</p>

    <p>You requested a password reset.</p>

    <p>Click the button below to reset your password:</p>

    <a href="${url}"
       style="display:inline-block;padding:12px 24px;background:#4f46e5;color:white;text-decoration:none;border-radius:6px;">
       Reset Password
    </a>

    <p>Or copy this link:</p>
    <p>${url}</p>

    <p>
      This link expires in 1 hour.
      If you didn't request this, you can ignore this email.
    </p>
  </div>
`;


// ------> Register

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) 
  {
    res.status(400);
    throw new Error('User already exists with this email');
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');    

  const user = await User.create({
    name,
    email,
    password,
    verificationToken,
    verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000,  //86,400,000 milliseconds = 24 hour
  });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

  let emailSent = false;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Verify Your Email - Course Platform',
      html: getVerificationEmailHtml(user.name, verifyUrl),
    });

    emailSent = true;
  } 
  catch (error) 
  {
    console.error('Email send failed:', error.message);
  }

  res.status(201).json({
    success: true,
    message: emailSent ? 
        'Registration successful. Please check your email to verify your account.'
      : 'Registration successful, but the verification email could not be sent.',
    emailSent,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});




// Login

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isVerified) 
  {
    res.status(403);
    throw new Error('Please verify your email before logging in');
  }

  // Generate 15-minute access token
  const accessToken = generateAccessToken(user);

  // Generate and store 7-day refresh token
  const refreshToken = await createRefreshToken(user._id);

  // Store refresh token in HTTP-only cookie
  setRefreshTokenCookie(res, refreshToken);

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: accessToken,
    },
  });
});



//--->google login

export const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) 
  {
    res.status(400);
    throw new Error('Google credential is required');
  }

  let payload;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } 
  catch 
  {
    res.status(401);
    throw new Error('Invalid Google token');
  }

  if (!payload) 
  {
    res.status(401);
    throw new Error('Invalid Google token');
  }

  const { email, name, email_verified } = payload;

  if (!email_verified) 
  {
    res.status(401);
    throw new Error('Google email is not verified');
  }

  let user = await User.findOne({ email: email.toLowerCase() });

  if (!user) 
  {
    user = await User.create({
      name: name || 'Google User',
      email,
      password: crypto.randomBytes(32).toString('hex'),
      role: 'student',
      isVerified: true,
    });
  } 
  else 
  {
    // Unverified account: someone may have pre-registered with this email,
    // so discard their password and revoke any sessions they hold.
    if (!user.isVerified) 
    {
      user.password = crypto.randomBytes(32).toString('hex');
      await revokeAllUserRefreshTokens(user._id);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;

    await user.save();
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = await createRefreshToken(user._id);

  setRefreshTokenCookie(res, refreshToken);

  res.json({
    success: true,
    message: 'Google login successful',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: accessToken,
    },
  });
});



// ---> Refresh Access Token

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies?.refreshToken;

  if (!oldRefreshToken) 
  {
    clearRefreshTokenCookie(res);
    res.status(401);
    throw new Error('Refresh token missing. Please login again.');
  }

  // Validate and consume the old refresh token
  const result = await consumeRefreshToken(oldRefreshToken);

  // Detect refresh-token reuse
  if (result.status === 'reused') {
    await RefreshToken.updateMany(
      {
        family: result.family,
        revokedAt: null,
      },
      {
        $set: { revokedAt: new Date() },
      }
    );

    clearRefreshTokenCookie(res);
    res.status(401);
    throw new Error('Refresh token reuse detected. Please login again.');
  }

  // Reject invalid or expired tokens
  if (result.status !== 'valid') 
  {
    clearRefreshTokenCookie(res);
    res.status(401);
    throw new Error('Invalid or expired refresh token. Please login again.');
  }

  const storedToken = result.token;

  // Find associated user
  const user = await User.findById(storedToken.user);

  if (!user) 
  {
    clearRefreshTokenCookie(res);
    res.status(401);
    throw new Error('User not found. Please login again.');
  }

  // Generate new access and refresh tokens
  const accessToken = generateAccessToken(user);

  const newRefreshToken = await createRefreshToken(
    user._id,
    storedToken.family
  );

  // Set new refresh cookie
  setRefreshTokenCookie(res, newRefreshToken);

  res.json({
    success: true,
    data: {
      token: accessToken,
    },
  });
});




// ---> Logout

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) 
  {
    await revokeRefreshToken(refreshToken);
  }

  clearRefreshTokenCookie(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});



// ---> Get Current User -> returns user details if the JWT is valid

export const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});


// --->Verify Email   

export const verifyEmail = asyncHandler(async (req, res) => { 
  const { token } = req.params;

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpire: { $gt: Date.now() },
  });

  if (!user) 
  {
    res.status(400);
    throw new Error('Invalid or expired verification token');
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpire = undefined;

  await user.save();

  // Generate 15-minute access token
const accessToken = generateAccessToken(user);

// Generate 7-day refresh token
const refreshToken = await createRefreshToken(user._id);

// Set refresh token in HTTP-only cookie
setRefreshTokenCookie(res, refreshToken);

  res.json({
    success: true,
  message: 'Email verified successfully',
  data: {
    token: accessToken,
  },
  });
});


// Resend Verification

export const resendVerification = asyncHandler(async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  if (!isEmailConfigured()) {
    res.status(500);
    throw new Error('Email service is not configured');
  }

  // Same response in every case, so attackers can't find out which emails exist
  const genericResponse = {
    success: true,
    message:
      'If an account exists and is not verified, a verification email has been sent',
  };

  const user = await User.findOne({ email });

  if (!user || user.isVerified) {
    return res.json(genericResponse);
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');

  user.verificationToken = verificationToken;
  user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Verify Your Email - Course Platform',
      html: getVerificationEmailHtml(user.name, verifyUrl),
    });
  } catch (error) {
    console.error('Resend verification email failed:', error.message);

    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();
  }

  return res.json(genericResponse);
});



//  Forgot Password

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) 
  {
    res.json({
      success: true,
      message:'If an account exists with this email, a reset link has been sent'});
      return; 
  }

  const resetToken = crypto.randomBytes(32).toString('hex');

  // Store hashed token in database
  user.resetPasswordToken = crypto .createHash('sha256') .update(resetToken) .digest('hex');

  // Token expires after 1 hour
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

  await user.save();

  // Create reset URL
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset - Course Platform',
      html: getResetPasswordEmailHtml(user.name,resetUrl),
    });
  } 
  catch (error) 
  {
    console.error('Email failed:', error.message);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(500);
    throw new Error('Email could not be sent');
  }

  res.json({
    success: true,
    message: 'If an account exists with this email, a reset link has been sent'
  });
});




//  Reset Password

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) 
  {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  // Revoke all existing login sessions
   await revokeAllUserRefreshTokens(user._id);

  res.json({
    success: true,
    message: 'Password reset successful',
  });
});
