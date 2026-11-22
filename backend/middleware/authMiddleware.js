import jwt from 'jsonwebtoken';
import User from '../models/User.js';


export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) 
  {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) 
  {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no access token',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    // Accept only access tokens
    if (decoded.type !== 'access') 
    {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token',
      });
    }

    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) 
    {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    next();
  } 
  catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Access token expired or invalid',
    });
  }
};


export const authorize = (...roles) => { //rest parameter
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) 
    {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

export const optionalProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) 
  {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) 
  {
    return next();
  }

  try 
  {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                    algorithms: ['HS256'],
    });

if (decoded.type !== 'access') 
{
  return next();
}

req.user = await User.findById(decoded.id).select('-password');
  } 
  catch (error) {
    // Ignore invalid token for optional auth
  }

  next();
};