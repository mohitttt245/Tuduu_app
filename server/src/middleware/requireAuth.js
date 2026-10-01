import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) throw new ApiError(401, 'Please sign in to continue');

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('+sessionVersion');
    if (!user || (payload.ver || 0) !== user.sessionVersion) {
      throw new ApiError(401, 'Your session has expired. Please sign in again');
    }
    req.auth = { userId: payload.sub };
    next();
  } catch {
    throw new ApiError(401, 'Your session has expired. Please sign in again');
  }
});
