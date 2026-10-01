import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/apiError.js';

export async function listNotifications(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 30));
  const userId = req.auth.userId;
  const [notifications, unreadCount, total] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('taskId', 'title').populate('habitId', 'name'),
    Notification.countDocuments({ userId, isRead: false }),
    Notification.countDocuments({ userId }),
  ]);
  res.json({ success: true, data: { notifications, unreadCount, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
}

export async function markNotificationRead(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid notification id');
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.auth.userId },
    { $set: { isRead: true } },
    { new: true },
  );
  if (!notification) throw new ApiError(404, 'Notification not found');
  res.json({ success: true, data: { notification } });
}

export async function markAllRead(req, res) {
  await Notification.updateMany({ userId: req.auth.userId, isRead: false }, { $set: { isRead: true } });
  res.json({ success: true, data: { message: 'Notifications marked as read' } });
}

export async function deleteNotification(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid notification id');
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.auth.userId });
  if (!notification) throw new ApiError(404, 'Notification not found');
  res.json({ success: true, data: { message: 'Notification deleted' } });
}
