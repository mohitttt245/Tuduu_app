import mongoose from 'mongoose';
import Task from '../models/Task.js';
import HabitCompletion from '../models/HabitCompletion.js';
import PomodoroSession from '../models/PomodoroSession.js';

function rangeOptions(value = '30') {
  const normalized = ['7', '30', '90', 'all'].includes(value) ? value : '30';
  const now = new Date();
  const monthMode = normalized === 'all';
  const count = monthMode ? 12 : Number(normalized);
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (monthMode) start.setUTCMonth(start.getUTCMonth() - 11, 1);
  else start.setUTCDate(start.getUTCDate() - count + 1);
  return { normalized, now, start, count: monthMode ? 12 : count, monthMode };
}

export async function getAnalytics(req, res) {
  const userId = new mongoose.Types.ObjectId(req.auth.userId);
  const { normalized, now, start, count, monthMode } = rangeOptions(req.query.range);
  const bucketFormat = monthMode ? '%Y-%m' : '%Y-%m-%d';
  const taskPeriod = { userId, status: { $ne: 'archived' }, ...(normalized !== 'all' ? { createdAt: { $gte: start } } : {}) };
  const completedPeriod = { userId, status: 'completed', ...(normalized !== 'all' ? { completedAt: { $gte: start } } : {}) };
  const sessionPeriod = { userId, ...(normalized !== 'all' ? { completedAt: { $gte: start } } : {}) };

  const [tasksCreated, tasksCompleted, pendingTasks, overdueTasks, averageCompletion, productivity, categories, priorities, statusCounts, habitDays, pomodoroDays, pomodoroTotals] = await Promise.all([
    Task.countDocuments(taskPeriod),
    Task.countDocuments(completedPeriod),
    Task.countDocuments({ ...taskPeriod, status: 'pending' }),
    Task.countDocuments({ userId, status: 'pending', dueDate: { $lt: now } }),
    Task.aggregate([
      { $match: { ...completedPeriod, completedAt: { ...(normalized !== 'all' ? { $gte: start } : {}), $ne: null } } },
      { $group: { _id: null, avgMs: { $avg: { $subtract: ['$completedAt', '$createdAt'] } } } },
    ]),
    Task.aggregate([
      { $match: taskPeriod },
      { $group: { _id: { $dateToString: { format: bucketFormat, date: '$createdAt', timezone: 'UTC' } }, created: { $sum: 1 } } },
    ]).then(async (createdRows) => {
      const completedRows = await Task.aggregate([
        { $match: completedPeriod },
        { $group: { _id: { $dateToString: { format: bucketFormat, date: '$completedAt', timezone: 'UTC' } }, completed: { $sum: 1 } } },
      ]);
      const byPeriod = new Map();
      for (const row of createdRows) byPeriod.set(row._id, { date: row._id, created: row.created, completed: 0 });
      for (const row of completedRows) byPeriod.set(row._id, { ...byPeriod.get(row._id), date: row._id, created: byPeriod.get(row._id)?.created || 0, completed: row.completed });
      return byPeriod;
    }),
    Task.aggregate([
      { $match: taskPeriod },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $project: { name: { $ifNull: [{ $arrayElemAt: ['$category.name', 0] }, 'Uncategorized'] }, count: 1 } },
      { $sort: { count: -1 } },
    ]),
    Task.aggregate([{ $match: taskPeriod }, { $group: { _id: '$priority', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Task.aggregate([{ $match: taskPeriod }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    HabitCompletion.aggregate([
      { $match: { userId, dateKey: { $gte: start.toISOString().slice(0, 10) } } },
      { $addFields: { completionDate: { $dateFromString: { dateString: '$dateKey', format: '%Y-%m-%d' } } } },
      { $group: { _id: { $dateToString: { format: bucketFormat, date: '$completionDate', timezone: 'UTC' } }, completed: { $sum: 1 } } },
    ]),
    PomodoroSession.aggregate([
      { $match: sessionPeriod },
      { $group: { _id: { $dateToString: { format: bucketFormat, date: '$completedAt', timezone: 'UTC' } }, sessions: { $sum: 1 }, focusMinutes: { $sum: '$focusMinutes' } } },
    ]),
    PomodoroSession.aggregate([{ $match: sessionPeriod }, { $group: { _id: null, sessions: { $sum: 1 }, focusMinutes: { $sum: '$focusMinutes' } } }]),
  ]);

  const buckets = [];
  if (monthMode) {
    const firstMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    for (let index = 0; index < count; index += 1) {
      const date = new Date(firstMonth);
      date.setUTCMonth(date.getUTCMonth() + index);
      buckets.push(date.toISOString().slice(0, 7));
    }
  } else {
    for (let index = 0; index < count; index += 1) {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + index);
      buckets.push(date.toISOString().slice(0, 10));
    }
  }
  const taskSeries = productivity;
  const statusMap = new Map(statusCounts.map((row) => [row._id, row.count]));
  const pomodoroMap = new Map(pomodoroDays.map((row) => [row._id, row]));
  const habitMap = new Map(habitDays.map((row) => [row._id, row.completed]));
  const series = buckets.map((key) => ({
    date: key,
    created: taskSeries.get(key)?.created || 0,
    completed: taskSeries.get(key)?.completed || 0,
    habitCompletions: habitMap.get(key) || 0,
    pomodoroSessions: pomodoroMap.get(key)?.sessions || 0,
    focusMinutes: pomodoroMap.get(key)?.focusMinutes || 0,
  }));

  res.json({
    success: true,
    data: {
      range: normalized,
      stats: {
        tasksCreated,
        tasksCompleted,
        pendingTasks,
        overdueTasks,
        completionRate: (statusMap.get('pending') || 0) + (statusMap.get('completed') || 0) ? Math.round(((statusMap.get('completed') || 0) / ((statusMap.get('pending') || 0) + (statusMap.get('completed') || 0))) * 100) : 0,
        averageCompletionHours: Math.round(((averageCompletion[0]?.avgMs || 0) / 3_600_000) * 10) / 10,
        pomodoroSessions: pomodoroTotals[0]?.sessions || 0,
        focusMinutes: pomodoroTotals[0]?.focusMinutes || 0,
      },
      charts: { productivity: series, byCategory: categories, byPriority: priorities, byStatus: [{ name: 'Completed', count: statusMap.get('completed') || 0 }, { name: 'Pending', count: statusMap.get('pending') || 0 }], habitCompletions: series, pomodoro: series },
    },
  });
}
