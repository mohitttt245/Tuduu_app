import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Task from '../models/Task.js';
import { ApiError } from '../utils/apiError.js';

const DEFAULTS = [
  { name: 'Study', icon: 'GraduationCap', color: '#6c63d9' },
  { name: 'Work', icon: 'BriefcaseBusiness', color: '#5883cb' },
  { name: 'Projects', icon: 'FolderKanban', color: '#c17c5d' },
  { name: 'Personal', icon: 'UserRound', color: '#8a70bf' },
  { name: 'Health', icon: 'HeartPulse', color: '#5c9b7f' },
  { name: 'Finance', icon: 'Wallet', color: '#bc944f' },
  { name: 'Other', icon: 'Folder', color: '#7a8498' },
];

function ensureId(id) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid category id');
}

export async function listCategories(req, res) {
  await Category.bulkWrite(DEFAULTS.map((category) => ({
    updateOne: { filter: { userId: req.auth.userId, name: category.name }, update: { $setOnInsert: { ...category, userId: req.auth.userId } }, upsert: true },
  })), { ordered: false });
  const categories = await Category.find({ userId: req.auth.userId }).sort({ name: 1 });
  res.json({ success: true, data: { categories } });
}

export async function createCategory(req, res) {
  const category = await Category.create({ userId: req.auth.userId, name: req.body.name, icon: req.body.icon || 'Folder', color: req.body.color || '#7465e8' });
  res.status(201).json({ success: true, data: { category } });
}

export async function updateCategory(req, res) {
  ensureId(req.params.id);
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, userId: req.auth.userId },
    { $set: { name: req.body.name, ...(req.body.icon ? { icon: req.body.icon } : {}), ...(req.body.color ? { color: req.body.color } : {}) } },
    { new: true, runValidators: true },
  );
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, data: { category } });
}

export async function deleteCategory(req, res) {
  ensureId(req.params.id);
  const category = await Category.findOneAndDelete({ _id: req.params.id, userId: req.auth.userId });
  if (!category) throw new ApiError(404, 'Category not found');
  await Task.updateMany({ userId: req.auth.userId, categoryId: category._id }, { $set: { categoryId: null } });
  res.json({ success: true, data: { message: 'Category deleted' } });
}
