import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import { ApiError } from '../utils/apiError.js';

const cookieOptions = (remember = false) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  ...(remember ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
});

function issueSession(user, res, remember = false) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  const expiresIn = remember ? '30d' : '12h';
  const token = jwt.sign({ sub: user.id, ver: user.sessionVersion || 0 }, process.env.JWT_SECRET, { expiresIn });
  res.cookie('accessToken', token, cookieOptions(remember));
}

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

export async function register(req, res) {
  const { name, email, password } = req.body;
  const exists = await User.exists({ email });
  if (exists) throw new ApiError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });
  issueSession(user, res, true);
  res.status(201).json({ success: true, data: { user: publicUser(user) } });
}

export async function login(req, res) {
  const { email, password, remember = false } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash +sessionVersion');
  const passwordMatches = user && await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) throw new ApiError(401, 'Email or password is incorrect');

  issueSession(user, res, Boolean(remember));
  res.json({ success: true, data: { user: publicUser(user) } });
}

export function logout(_req, res) {
  res.clearCookie('accessToken', cookieOptions());
  res.json({ success: true, data: { message: 'You have been signed out' } });
}

export async function currentUser(req, res) {
  const user = await User.findById(req.auth.userId);
  if (!user) throw new ApiError(401, 'Your account is no longer available');
  res.json({ success: true, data: { user: publicUser(user) } });
}

export async function updateProfile(req, res) {
  const user = await User.findByIdAndUpdate(
    req.auth.userId,
    { $set: { name: req.body.name.trim() } },
    { new: true, runValidators: true },
  );
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: { user: publicUser(user) } });
}

export async function changePassword(req, res) {
  const user = await User.findById(req.auth.userId).select('+passwordHash +sessionVersion');
  if (!user) throw new ApiError(404, 'User not found');
  const valid = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
  if (!valid) throw new ApiError(400, 'Current password is incorrect');
  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  user.sessionVersion = (user.sessionVersion || 0) + 1;
  await user.save();
  issueSession(user, res, true);
  res.json({ success: true, data: { message: 'Password updated' } });
}

function resetEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.MAIL_FROM);
}

function resetLink(token) {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function forgotPassword(req, res) {
  if (!resetEmailConfigured()) {
    throw new ApiError(503, 'Password recovery email is not configured. Ask your administrator to configure SMTP.');
  }

  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const token = randomBytes(32).toString('hex');
    user.resetPasswordTokenHash = createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpiresAt = new Date(Date.now() + 20 * 60 * 1000);
    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const url = resetLink(token);
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: user.email,
      subject: 'Reset your Tuduu password',
      text: `Use this link within 20 minutes to reset your password: ${url}`,
      html: `<p>We received a request to reset your Tuduu password.</p><p><a href="${url}">Reset password</a></p><p>This link expires in 20 minutes. If you did not request this, you can ignore this email.</p>`,
    });
  }

  res.json({ success: true, data: { message: 'If an account exists for that email, a reset link has been sent.' } });
}

export async function resetPassword(req, res) {
  const tokenHash = createHash('sha256').update(req.body.token).digest('hex');
  const user = await User.findOne({ resetPasswordTokenHash: tokenHash, resetPasswordExpiresAt: { $gt: new Date() } }).select('+resetPasswordTokenHash +resetPasswordExpiresAt +passwordHash +sessionVersion');
  if (!user) throw new ApiError(400, 'This reset link is invalid or expired. Request a new one.');

  user.passwordHash = await bcrypt.hash(req.body.password, 12);
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpiresAt = null;
  user.sessionVersion = (user.sessionVersion || 0) + 1;
  await user.save();
  res.clearCookie('accessToken', cookieOptions());
  res.json({ success: true, data: { message: 'Password reset. You can now sign in.' } });
}
