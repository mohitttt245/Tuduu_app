import mongoose from 'mongoose';
import Task from '../models/Task.js';
import { userDayRange } from '../utils/dateRange.js';

export async function getSummary(req, res) {
  const now = new Date();
  const { start: todayStart, end: tomorrowStart } = userDayRange(req);
  const weekStart = new Date(todayStart);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  const userId = req.auth.userId;

  const [totalTasks, todayTasks, completedTasks, pendingTasks, overdueTasks, recentTasks, weekly] = await Promise.all([
    Task.countDocuments({ userId, status: { $ne: 'archived' } }),
    Task.countDocuments({ userId, status: 'pending', dueDate: { $gte: todayStart, $lt: tomorrowStart } }),
    Task.countDocuments({ userId, status: 'completed' }),
    Task.countDocuments({ userId, status: 'pending' }),
    Task.countDocuments({ userId, status: 'pending', dueDate: { $lt: todayStart } }),
    Task.find({ userId, status: { $ne: 'archived' } }).sort({ dueDate: 1, createdAt: -1 }).limit(5).select('title priority status dueDate completedAt'),
    Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed', completedAt: { $gte: weekStart } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: 'UTC' } }, count: { $sum: 1 } } },
    ]),
  ]);

  const weeklyMap = new Map(weekly.map((day) => [day._id, day.count]));
  const weeklyCompleted = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setUTCDate(day.getUTCDate() + index);
    return { date: day.toISOString().slice(0, 10), completed: weeklyMap.get(day.toISOString().slice(0, 10)) || 0 };
  });

  res.json({
    success: true,
    data: {
      stats: {
        totalTasks,
        todayTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      recentTasks,
      weeklyCompleted,
    },
  });
}
