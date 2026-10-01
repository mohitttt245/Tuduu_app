import mongoose from 'mongoose';
import PomodoroSession from '../models/PomodoroSession.js';
import Task from '../models/Task.js';
import { ApiError } from '../utils/apiError.js';

export async function listPomodoroSessions(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 30));
  const userId = req.auth.userId;
  const [sessions, total, totalFocusMinutes] = await Promise.all([
    PomodoroSession.find({ userId }).sort({ completedAt: -1 }).skip((page - 1) * limit).limit(limit).populate('taskId', 'title'),
    PomodoroSession.countDocuments({ userId }),
    PomodoroSession.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(userId) } }, { $group: { _id: null, minutes: { $sum: '$focusMinutes' } } }]),
  ]);
  res.json({ success: true, data: { sessions, total, totalFocusMinutes: totalFocusMinutes[0]?.minutes || 0, pagination: { page, limit, pages: Math.ceil(total / limit) } } });
}

export async function createPomodoroSession(req, res) {
  const { taskId = null, focusMinutes, breakMinutes = 5 } = req.body;
  if (taskId) {
    if (!mongoose.isValidObjectId(taskId) || !(await Task.exists({ _id: taskId, userId: req.auth.userId }))) throw new ApiError(400, 'Task not found');
  }
  const session = await PomodoroSession.create({
    userId: req.auth.userId,
    taskId,
    focusMinutes,
    breakMinutes,
  });
  await session.populate('taskId', 'title');
  res.status(201).json({ success: true, data: { session } });
}
