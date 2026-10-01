import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import HabitCompletion from '../models/HabitCompletion.js';
import Notification from '../models/Notification.js';

const POLL_INTERVAL_MS = 60_000;
const MAX_REMINDER_MINUTES = 43_200;
let running = false;

export async function processDueReminders() {
  if (running) return;
  running = true;
  try {
    const now = new Date();
    const lookAhead = new Date(now.getTime() + MAX_REMINDER_MINUTES * 60_000);
    const tasks = await Task.find({
      status: 'pending',
      reminderOffsetMinutes: { $gt: 0 },
      dueDate: { $gt: now, $lte: lookAhead },
    }).select('_id userId title dueDate reminderOffsetMinutes');
    const habits = await Habit.find({ archived: false, reminderTime: { $ne: '' } }).select('_id userId name weekdays reminderTime timezoneOffsetMinutes');

    const notifications = [];
    for (const task of tasks) {
      const reminderAt = new Date(task.dueDate.getTime() - task.reminderOffsetMinutes * 60_000);
      if (reminderAt <= now) {
        const minutes = task.reminderOffsetMinutes;
        notifications.push({
          userId: task.userId,
          taskId: task._id,
          type: 'task_reminder',
          title: `Coming up ${minutes < 60 ? `in ${minutes} minutes` : `in ${Math.round(minutes / 60)} hours`}`,
          message: task.title,
          dedupeKey: `reminder:${task._id}:${task.dueDate.toISOString()}`,
        });
      }
    }
    for (const habit of habits) {
      const offset = habit.timezoneOffsetMinutes || 0;
      const localNow = new Date(now.getTime() - offset * 60_000);
      const dateKey = localNow.toISOString().slice(0, 10);
      const localTime = localNow.toISOString().slice(11, 16);
      if (!habit.weekdays.includes(localNow.getUTCDay()) || localTime < habit.reminderTime) continue;
      const completed = await HabitCompletion.exists({ userId: habit.userId, habitId: habit._id, dateKey });
      if (!completed) {
        notifications.push({ userId: habit.userId, habitId: habit._id, type: 'system', title: 'A small habit check-in', message: `Time for ${habit.name}.`, dedupeKey: `habit-reminder:${habit._id}:${dateKey}` });
      }
    }
    if (notifications.length) {
      try { await Notification.insertMany(notifications, { ordered: false }); }
      catch (error) { if (error.code !== 11000 && error.writeErrors?.some((writeError) => writeError.code !== 11000)) throw error; }
    }
  } catch (error) {
    console.error('Reminder scan failed:', error.name || 'Error');
  } finally {
    running = false;
  }
}

export function startReminderService() {
  processDueReminders();
  const timer = setInterval(processDueReminders, POLL_INTERVAL_MS);
  timer.unref();
  return timer;
}
