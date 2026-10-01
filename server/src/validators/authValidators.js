import { body } from 'express-validator';

export const registerRules = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters'),
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').isLength({ min: 8, max: 72 }).withMessage('Password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords must match'),
];

export const loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const profileRules = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters'),
];

export const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8, max: 72 }).withMessage('New password must be at least 8 characters'),
];

export const forgotPasswordRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
];

export const resetPasswordRules = [
  body('token').isLength({ min: 32 }).withMessage('This reset link is invalid or expired'),
  body('password').isLength({ min: 8, max: 72 }).withMessage('Password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords must match'),
];
