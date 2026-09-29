import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import sendEmail, { isEmailConfigured } from '../utils/sendEmail.js';

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

const getResetPasswordEmailHtml = (name, url) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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

// REGISTER
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email');
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');

  const user = await User.create({
    name,
    email,
    password,
    verificationToken,
    verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000,
  });

  const verifyUrl =
    `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

  let emailSent = false;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Verify Your Email - Course Platform',
      html: getVerificationEmailHtml(user.name, verifyUrl),
    });

    emailSent = true;
  } catch (error) {
    console.error('Email send failed:', error.message);

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `Development verification link for ${user.email}: ${verifyUrl}`
      );
    }
  }

  res.status(201).json({
    success: true,
    message: emailSent
      ? 'Registration successful. Please check your email to verify your account.'
      : 'Registration successful, but the verification email could not be sent.',
    emailSent,
    verificationUrl:
      emailSent || process.env.NODE_ENV === 'production'
        ? undefined
        : verifyUrl,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

// LOGIN
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: generateToken(user._id, user.role),
    },
  });
});

// LOGOUT
export const logout = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// GET CURRENT USER
export const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

// VERIFY EMAIL
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired verification token');
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpire = undefined;

  await user.save();

  res.json({
    success: true,
    message: 'Email verified successfully',
    data: {
      token: generateToken(user._id, user.role),
    },
  });
});

// RESEND VERIFICATION
export const resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.isVerified) {
    res.status(400);
    throw new Error('Email is already verified');
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');

  user.verificationToken = verificationToken;
  user.verificationTokenExpire =
    Date.now() + 24 * 60 * 60 * 1000;

  await user.save();

  const verifyUrl =
    `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

  if (!isEmailConfigured() && process.env.NODE_ENV !== 'production') {
    console.log(
      `Development verification link for ${user.email}: ${verifyUrl}`
    );

    res.json({
      success: true,
      message:
        'Email is not configured. Use the verification link below for local testing.',
      emailSent: false,
      verificationUrl: verifyUrl,
    });

    return;
  }

  await sendEmail({
    email: user.email,
    subject: 'Verify Your Email - Course Platform',
    html: getVerificationEmailHtml(user.name, verifyUrl),
  });

  res.json({
    success: true,
    message: 'Verification email sent',
    emailSent: true,
  });
});

// FORGOT PASSWORD
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.json({
      success: true,
      message:
        'If an account exists with this email, a reset link has been sent',
    });

    return;
  }

  // Generate random reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Store hashed token in database
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token expires after 1 hour
  user.resetPasswordExpire =
    Date.now() + 60 * 60 * 1000;

  await user.save();

  // Create reset URL
  const resetUrl =
    `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset - Course Platform',
      html: getResetPasswordEmailHtml(
        user.name,
        resetUrl
      ),
    });
  } catch (error) {
    console.error('Email failed:', error.message);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(500);
    throw new Error('Email could not be sent');
  }

  res.json({
    success: true,
    message:
      'If an account exists with this email, a reset link has been sent',
  });
});

// RESET PASSWORD
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.json({
    success: true,
    message: 'Password reset successful',
    data: {
      token: generateToken(user._id, user.role),
    },
  });
});

// UPDATE PROFILE
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.name = req.body.name || user.name;

  if (req.body.password) {
    user.password = req.body.password;
  }

  const updatedUser = await user.save();

  res.json({
    success: true,
    data: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
      token: generateToken(
        updatedUser._id,
        updatedUser.role
      ),
    },
  });
});