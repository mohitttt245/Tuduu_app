import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { changePassword, currentUser, forgotPassword, login, logout, register, resetPassword, updateProfile } from '../controllers/authController.js';
import { changePasswordRules, forgotPasswordRules, loginRules, profileRules, registerRules, resetPasswordRules } from '../validators/authValidators.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' } });

router.post('/register', authLimiter, registerRules, validate, asyncHandler(register));
router.post('/login', authLimiter, loginRules, validate, asyncHandler(login));
router.post('/forgot-password', authLimiter, forgotPasswordRules, validate, asyncHandler(forgotPassword));
router.post('/reset-password', authLimiter, resetPasswordRules, validate, asyncHandler(resetPassword));
router.post('/logout', logout);
router.get('/me', requireAuth, asyncHandler(currentUser));
router.put('/profile', requireAuth, profileRules, validate, asyncHandler(updateProfile));
router.put('/change-password', requireAuth, changePasswordRules, validate, asyncHandler(changePassword));

export default router;
