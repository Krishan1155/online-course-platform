
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import RefreshToken from '../models/RefreshToken.js';

// Generate access token (15 minutes)
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      type: 'access',
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m',
      algorithm: 'HS256',
    }
  );
};

// Generate random refresh token
export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Hash refresh token for mongodb
export const hashRefreshToken = (token) => {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};

// Create and store refresh token in MongoDB
export const createRefreshToken = async (userId, family = crypto.randomUUID()) => {
  const token = generateRefreshToken();

  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  await RefreshToken.create({
    user: userId,
    family,
    tokenHash: hashRefreshToken(token),
    expiresAt,
  });

  return token;
};

// Validate and revoke old refresh token
export const consumeRefreshToken = async (token) => {

  if (!token) 
  {
    return { status: 'missing' };
  }

  const tokenHash = hashRefreshToken(token);

  const storedToken = await RefreshToken.findOne({ tokenHash });

  if (!storedToken) 
  {
    return { status: 'invalid' };
  }

  if (storedToken.revokedAt) 
  {
    return {
      status: 'reused',
      family: storedToken.family,
      userId: storedToken.user,
    };
  }

  if (storedToken.expiresAt <= new Date()) 
  {
    return { status: 'expired' };
  }

  // Atomically revoke the token to prevent concurrent consumption
  const consumedToken = await RefreshToken.findOneAndUpdate(
    {
      _id: storedToken._id,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: { revokedAt: new Date() },
    },
    { new: true }
  );

  if (!consumedToken) 
  {
    return {
      status: 'reused',
      family: storedToken.family,
      userId: storedToken.user,
    };
  }

  return {
    status: 'valid',
    token: consumedToken,
  };
};


// Revoke refresh token during logout
export const revokeRefreshToken = async (token) => {
  
  if (!token) return;

  await RefreshToken.updateOne(
    {
      tokenHash: hashRefreshToken(token),
      revokedAt: null,
    },
    {
      $set: { revokedAt: new Date() },
    }
  );
};

// Revoke all refresh tokens for a user
export const revokeAllUserRefreshTokens = async (userId) => {
  await RefreshToken.updateMany(
    {
      user: userId,
      revokedAt: null,
    },
    {
      $set: { revokedAt: new Date() },
    }
  );
};