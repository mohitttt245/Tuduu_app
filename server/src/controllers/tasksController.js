import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Category from '../models/Category.js';
import Tag from '../models/Tag.js';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/apiError.js';
import { nextOccurrence, recurrenceForInput } from '../utils/recurrence.js';
import { userDayRange } from '../utils/dateRange.js';

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };
const POPULATE = [
  { path: 'categoryId', select: 'name icon color' },
  { path: 'tagIds', select: 'name' },
];

function ensureId(id) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid task id');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function aggregateFilter(filter) {
  const match = { ...filter, userId: new mongoose.Types.ObjectId(filter.userId) };
  if (typeof match.categoryId === 'string') match.categoryId = new mongoose.Types.ObjectId(match.categoryId);
  if (typeof match.tagIds === 'string') match.tagIds = new mongoose.Types.ObjectId(match.tagIds);
  return match;
}

function has(body, key) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

async function validateReferences(userId, body) {
  if (body.categoryId && !mongoose.isValidObjectId(body.categoryId)) throw new ApiError(400, 'Invalid category');
  if (body.categoryId && !(await Category.exists({ _id: body.categoryId, userId }))) throw new ApiError(400, 'Category not found');

  if (body.tagIds !== undefined) {
    if (!Array.isArray(body.tagIds) || body.tagIds.length > 20 || body.tagIds.some((id) => !mongoose.isValidObjectId(id))) {
      throw new ApiError(400, 'Choose valid tags');
    }
    const uniqueIds = [...new Set(body.tagIds.map(String))];
    const count = await Tag.countDocuments({ _id: { $in: uniqueIds }, userId });
    if (count !== uniqueIds.length) throw new ApiError(400, 'One or more tags were not found');
    body.tagIds = uniqueIds;
  }
}

function taskFields(body, creating = false) {
  const result = {};
  for (const key of ['title', 'description', 'priority', 'dueDate', 'categoryId', 'tagIds', 'pinned', 'reminderOffsetMinutes', 'subtasks']) {
    if (has(body, key)) result[key] = body[key];
  }
  if (has(body, 'dueDate') && !body.dueDate) result.dueDate = null;
  if (has(body, 'categoryId') && !body.categoryId) result.categoryId = null;
  if (has(body, 'recurrence')) result.recurrence = recurrenceForInput(body.recurrence);
  if (creating) {
    result.priority ??= 'medium';
    result.status = 'pending';
  }
  return result;
}

function occurrenceData(task, dueDate) {
  const id = new mongoose.Types.ObjectId();
  const occurrenceDate = new Date(dueDate);
  return {
    userId: task.userId,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: 'pending',
    categoryId: task.categoryId,
    tagIds: task.tagIds,
    pinned: task.pinned,
    reminderOffsetMinutes: task.reminderOffsetMinutes,
    recurrence: task.recurrence,
    subtasks: task.subtasks.map((subtask) => ({ title: subtask.title, completed: false, completedAt: null })),
    seriesId: task.seriesId || task._id,
    occurrenceDate,
    dueDate,
    _id: id,
  };
}

export async function listTasks(req, res) {
  const userId = req.auth.userId;
  const { view = 'all', search = '', priority, status, categoryId, tagId, dueFrom, dueTo } = req.query;
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
  const filter = { userId };
  const { start: today, end: tomorrow } = userDayRange(req);

  if (view === 'today') Object.assign(filter, { status: 'pending', dueDate: { $gte: today, $lt: tomorrow } });
  else if (view === 'upcoming') Object.assign(filter, { status: 'pending', dueDate: { $gte: tomorrow } });
  else if (view === 'overdue') Object.assign(filter, { status: 'pending', dueDate: { $lt: today } });
  else if (view === 'completed') filter.status = 'completed';
  else if (view === 'important') Object.assign(filter, { pinned: true, status: { $ne: 'archived' } });
  else if (view === 'archived') filter.status = 'archived';
  else filter.status = { $ne: 'archived' };

  if (priority && ['low', 'medium', 'high'].includes(priority)) filter.priority = priority;
  if (status && ['pending', 'completed', 'archived'].includes(status)) filter.status = status;
  if (categoryId && mongoose.isValidObjectId(categoryId)) filter.categoryId = categoryId;
  if (tagId && mongoose.isValidObjectId(tagId)) filter.tagIds = tagId;
  if (dueFrom || dueTo) {
    filter.dueDate = { ...(filter.dueDate || {}) };
    if (dueFrom) {
      const parsed = new Date(dueFrom);
      if (Number.isNaN(parsed.getTime())) throw new ApiError(400, 'Choose a valid start date');
      filter.dueDate.$gte = parsed;
    }
    if (dueTo) {
      const parsed = new Date(dueTo);
      if (Number.isNaN(parsed.getTime())) throw new ApiError(400, 'Choose a valid end date');
      filter.dueDate.$lte = parsed;
    }
  }

  if (search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim().slice(0, 120)), 'i');
    const [categories, tags] = await Promise.all([
      Category.find({ userId, name: regex }).select('_id').lean(),
      Tag.find({ userId, name: regex }).select('_id').lean(),
    ]);
    filter.$or = [
      { title: regex },
      { description: regex },
      ...(categories.length ? [{ categoryId: { $in: categories.map(({ _id }) => _id) } }] : []),
      ...(tags.length ? [{ tagIds: { $in: tags.map(({ _id }) => _id) } }] : []),
    ];
  }

  const sortKey = ['dueDate', 'priority', 'createdAt', 'updatedAt', 'title'].includes(req.query.sort) ? req.query.sort : 'dueDate';
  const direction = req.query.order === 'desc' ? -1 : 1;
  const skip = (page - 1) * limit;
  const [total, tasks] = await Promise.all([
    Task.countDocuments(filter),
    sortKey === 'priority'
      ? Task.aggregate([
        { $match: aggregateFilter(filter) },
        { $addFields: { priorityRank: { $switch: { branches: [
          { case: { $eq: ['$priority', 'high'] }, then: PRIORITY_RANK.high },
          { case: { $eq: ['$priority', 'medium'] }, then: PRIORITY_RANK.medium },
        ], default: PRIORITY_RANK.low } } } },
        { $sort: { priorityRank: direction, dueDate: 1, createdAt: -1 } },
        { $skip: skip }, { $limit: limit }, { $project: { priorityRank: 0 } },
      ]).then((rows) => Task.populate(rows, POPULATE))
      : Task.find(filter).sort({ [sortKey]: direction }).skip(skip).limit(limit).populate(POPULATE),
  ]);

  res.json({ success: true, data: { tasks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
}

export async function createTask(req, res) {
  const userId = req.auth.userId;
  await validateReferences(userId, req.body);
  const fields = taskFields(req.body, true);
  if (!fields.title?.trim()) throw new ApiError(400, 'Task title is required');
  if (fields.recurrence?.frequency && fields.recurrence.frequency !== 'none') {
    const seriesId = new mongoose.Types.ObjectId();
    const occurrenceDate = fields.dueDate ? new Date(fields.dueDate) : new Date();
    fields.seriesId = seriesId;
    fields.occurrenceDate = occurrenceDate;
  }
  const task = await Task.create({ ...fields, userId });
  await task.populate(POPULATE);
  res.status(201).json({ success: true, data: { task } });
}

export async function getTask(req, res) {
  ensureId(req.params.id);
  const task = await Task.findOne({ _id: req.params.id, userId: req.auth.userId }).populate(POPULATE);
  if (!task) throw new ApiError(404, 'Task not found');
  res.json({ success: true, data: { task } });
}

export async function updateTask(req, res) {
  ensureId(req.params.id);
  await validateReferences(req.auth.userId, req.body);
  const task = await Task.findOne({ _id: req.params.id, userId: req.auth.userId });
  if (!task) throw new ApiError(404, 'Task not found');
  const fields = taskFields(req.body);
  if (fields.recurrence) {
    if (fields.recurrence.frequency === 'none') {
      task.seriesId = undefined;
      task.occurrenceDate = undefined;
    } else {
      task.seriesId ||= task._id;
      task.occurrenceDate = fields.dueDate ? new Date(fields.dueDate) : task.occurrenceDate || new Date();
    }
  } else if (fields.dueDate && task.seriesId) {
    task.occurrenceDate = new Date(fields.dueDate);
  }
  Object.assign(task, fields);
  await task.save();
  await task.populate(POPULATE);
  res.json({ success: true, data: { task } });
}

export async function deleteTask(req, res) {
  ensureId(req.params.id);
  const task = await Task.findOne({ _id: req.params.id, userId: req.auth.userId }).select('seriesId');
  if (!task) throw new ApiError(404, 'Task not found');
  if (req.query.scope === 'series' && task.seriesId) {
    const seriesTasks = await Task.find({ userId: req.auth.userId, seriesId: task.seriesId }).distinct('_id');
    await Promise.all([
      Task.deleteMany({ userId: req.auth.userId, seriesId: task.seriesId }),
      Notification.deleteMany({ userId: req.auth.userId, taskId: { $in: seriesTasks } }),
    ]);
  } else {
    await Promise.all([
      Task.deleteOne({ _id: task._id, userId: req.auth.userId }),
      Notification.deleteMany({ userId: req.auth.userId, taskId: task._id }),
    ]);
  }
  res.json({ success: true, data: { message: 'Task deleted' } });
}

export async function completeTask(req, res) {
  ensureId(req.params.id);
  const task = await Task.findOne({ _id: req.params.id, userId: req.auth.userId });
  if (!task) throw new ApiError(404, 'Task not found');
  if (task.status !== 'completed') {
    task.status = 'completed';
    task.completedAt = new Date();
    await task.save();
  }

  let nextTask = null;
  if (task.recurrence?.frequency && task.recurrence.frequency !== 'none') {
    const dueDate = nextOccurrence(task);
    if (dueDate) {
      try {
        nextTask = await Task.create(occurrenceData(task, dueDate));
        await nextTask.populate(POPULATE);
        await Notification.create({
          userId: task.userId,
          taskId: nextTask._id,
          type: 'recurring_task',
          title: 'Next occurrence scheduled',
          message: `${task.title} is scheduled for ${dueDate.toLocaleDateString()}.`,
          dedupeKey: `recurrence:${task._id}:${dueDate.toISOString()}`,
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        nextTask = await Task.findOne({ seriesId: task.seriesId || task._id, occurrenceDate: dueDate, userId: task.userId }).populate(POPULATE);
      }
    }
  }

  await task.populate(POPULATE);
  res.json({ success: true, data: { task, nextTask } });
}

export async function reopenTask(req, res) {
  ensureId(req.params.id);
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.auth.userId, status: 'completed' },
    { $set: { status: 'pending', completedAt: null } },
    { new: true },
  ).populate(POPULATE);
  if (!task) throw new ApiError(404, 'Completed task not found');
  res.json({ success: true, data: { task } });
}

export async function togglePin(req, res) {
  ensureId(req.params.id);
  const query = { _id: req.params.id, userId: req.auth.userId, status: { $ne: 'archived' } };
  const task = await Task.findOne(query);
  if (!task) throw new ApiError(404, 'Task not found');
  task.pinned = typeof req.body.pinned === 'boolean' ? req.body.pinned : !task.pinned;
  await task.save();
  await task.populate(POPULATE);
  res.json({ success: true, data: { task } });
}

export async function archiveTask(req, res) {
  ensureId(req.params.id);
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.auth.userId, status: { $ne: 'archived' } },
    { $set: { status: 'archived' } },
    { new: true },
  ).populate(POPULATE);
  if (!task) throw new ApiError(404, 'Task not found');
  res.json({ success: true, data: { task } });
}

export async function unarchiveTask(req, res) {
  ensureId(req.params.id);
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.auth.userId, status: 'archived' },
    { $set: { status: 'pending' } },
    { new: true },
  ).populate(POPULATE);
  if (!task) throw new ApiError(404, 'Archived task not found');
  res.json({ success: true, data: { task } });
}

export async function getCalendarTasks(req, res) {
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) throw new ApiError(400, 'Choose a valid calendar range');
  const tasks = await Task.find({ userId: req.auth.userId, dueDate: { $gte: from, $lt: to }, status: { $ne: 'archived' } })
    .sort({ dueDate: 1 }).limit(1000).populate(POPULATE);
  res.json({ success: true, data: { tasks } });
}
