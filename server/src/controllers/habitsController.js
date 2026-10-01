import mongoose from 'mongoose';
import Habit from '../models/Habit.js';
import HabitCompletion from '../models/HabitCompletion.js';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/apiError.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateKey(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function dateKeysBack(count, todayKey) {
  const base = new Date(`${todayKey}T00:00:00.000Z`);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(base);
    date.setUTCDate(date.getUTCDate() - index);
    return date.toISOString().slice(0, 10);
  });
}

function streakForHabit(habit, completionSet, todayKey) {
  const scheduled = new Set(habit.weekdays);
  const keys = dateKeysBack(370, todayKey);
  let startAt = 0;
  if (scheduled.has(new Date(`${todayKey}T00:00:00Z`).getUTCDay()) && !completionSet.has(todayKey)) startAt = 1;
  else while (startAt < keys.length && !scheduled.has(new Date(`${keys[startAt]}T00:00:00Z`).getUTCDay())) startAt += 1;

  let current = 0;
  for (let index = startAt; index < keys.length; index += 1) {
    const weekday = new Date(`${keys[index]}T00:00:00Z`).getUTCDay();
    if (!scheduled.has(weekday)) continue;
    if (!completionSet.has(keys[index])) break;
    current += 1;
  }

  let longest = 0;
  let run = 0;
  const completedKeys = [...completionSet].sort();
  if (completedKeys.length) {
    const cursor = new Date(`${completedKeys[0]}T00:00:00Z`);
    const end = new Date(`${completedKeys.at(-1)}T00:00:00Z`);
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      if (scheduled.has(cursor.getUTCDay())) {
        if (completionSet.has(key)) { run += 1; longest = Math.max(longest, run); }
        else run = 0;
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return { current, longest };
}

function validHabitId(id) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid habit id');
}

function validateWeekdays(value) {
  const days = [...new Set((Array.isArray(value) ? value : []).map(Number))];
  if (!days.length || days.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) throw new ApiError(400, 'Choose at least one valid weekday');
  return days;
}

export async function listHabits(req, res) {
  if (req.query.today && !isValidDateKey(req.query.today)) throw new ApiError(400, 'Choose a valid date');
  const todayKey = req.query.today || new Date().toISOString().slice(0, 10);
  const fromKey = dateKeysBack(34, todayKey).at(-1);
  const [habits, recentCompletions, allCompletions] = await Promise.all([
    Habit.find({ userId: req.auth.userId, archived: false }).sort({ createdAt: -1 }),
    HabitCompletion.find({ userId: req.auth.userId, dateKey: { $gte: fromKey, $lte: todayKey } }).sort({ dateKey: -1 }),
    HabitCompletion.find({ userId: req.auth.userId }).select('habitId dateKey').sort({ dateKey: -1 }),
  ]);
  const completionMap = new Map();
  for (const completion of allCompletions) {
    const key = String(completion.habitId);
    if (!completionMap.has(key)) completionMap.set(key, []);
    completionMap.get(key).push(completion.dateKey);
  }
  const recentMap = new Map();
  for (const completion of recentCompletions) {
    const key = String(completion.habitId);
    if (!recentMap.has(key)) recentMap.set(key, []);
    recentMap.get(key).push(completion.dateKey);
  }
  const data = habits.map((habit) => {
    const allHistory = completionMap.get(String(habit._id)) || [];
    const history = recentMap.get(String(habit._id)) || [];
    const streak = streakForHabit(habit, new Set(allHistory), todayKey);
    return { ...habit.toObject(), currentStreak: streak.current, longestStreak: streak.longest, completions: history };
  });
  res.json({ success: true, data: { habits: data } });
}

export async function createHabit(req, res) {
  const habit = await Habit.create({
    userId: req.auth.userId,
    name: req.body.name,
    description: req.body.description || '',
    weekdays: validateWeekdays(req.body.weekdays ?? [0, 1, 2, 3, 4, 5, 6]),
    targetPerWeek: req.body.targetPerWeek || 7,
    reminderTime: req.body.reminderTime || '',
    timezoneOffsetMinutes: Math.max(-840, Math.min(840, Number.parseInt(req.get('x-timezone-offset') || '0', 10) || 0)),
  });
  res.status(201).json({ success: true, data: { habit } });
}

export async function updateHabit(req, res) {
  validHabitId(req.params.id);
  const update = {};
  for (const key of ['name', 'description', 'targetPerWeek', 'reminderTime']) if (req.body[key] !== undefined) update[key] = req.body[key];
  if (req.body.weekdays !== undefined) update.weekdays = validateWeekdays(req.body.weekdays);
  update.timezoneOffsetMinutes = Math.max(-840, Math.min(840, Number.parseInt(req.get('x-timezone-offset') || '0', 10) || 0));
  const habit = await Habit.findOneAndUpdate({ _id: req.params.id, userId: req.auth.userId }, { $set: update }, { new: true, runValidators: true });
  if (!habit) throw new ApiError(404, 'Habit not found');
  res.json({ success: true, data: { habit } });
}

export async function deleteHabit(req, res) {
  validHabitId(req.params.id);
  const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.auth.userId });
  if (!habit) throw new ApiError(404, 'Habit not found');
  await Promise.all([
    HabitCompletion.deleteMany({ habitId: habit._id, userId: req.auth.userId }),
    Notification.deleteMany({ habitId: habit._id, userId: req.auth.userId }),
  ]);
  res.json({ success: true, data: { message: 'Habit and its completion history deleted' } });
}

export async function completeHabit(req, res) {
  validHabitId(req.params.id);
  const dateKey = req.body.dateKey || new Date().toISOString().slice(0, 10);
  if (!isValidDateKey(dateKey)) throw new ApiError(400, 'Choose a valid completion date');
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.auth.userId, archived: false });
  if (!habit) throw new ApiError(404, 'Habit not found');
  const completion = await HabitCompletion.findOneAndUpdate(
    { userId: req.auth.userId, habitId: habit._id, dateKey },
    { $setOnInsert: { userId: req.auth.userId, habitId: habit._id, dateKey, completedAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  res.json({ success: true, data: { completion } });
}

export async function undoHabitCompletion(req, res) {
  validHabitId(req.params.id);
  const dateKey = req.query.dateKey || new Date().toISOString().slice(0, 10);
  if (!isValidDateKey(dateKey)) throw new ApiError(400, 'Choose a valid completion date');
  const result = await HabitCompletion.deleteOne({ userId: req.auth.userId, habitId: req.params.id, dateKey });
  res.json({ success: true, data: { removed: result.deletedCount > 0 } });
}
