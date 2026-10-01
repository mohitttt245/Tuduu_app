import mongoose from 'mongoose';
import Tag from '../models/Tag.js';
import Task from '../models/Task.js';
import { ApiError } from '../utils/apiError.js';

export async function listTags(req, res) {
  const tags = await Tag.find({ userId: req.auth.userId }).sort({ name: 1 });
  res.json({ success: true, data: { tags } });
}

export async function createTag(req, res) {
  const tag = await Tag.findOneAndUpdate(
    { userId: req.auth.userId, name: req.body.name.toLowerCase().trim() },
    { $setOnInsert: { userId: req.auth.userId, name: req.body.name.toLowerCase().trim() } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  res.status(201).json({ success: true, data: { tag } });
}

export async function deleteTag(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid tag id');
  const tag = await Tag.findOneAndDelete({ _id: req.params.id, userId: req.auth.userId });
  if (!tag) throw new ApiError(404, 'Tag not found');
  await Task.updateMany({ userId: req.auth.userId, tagIds: tag._id }, { $pull: { tagIds: tag._id } });
  res.json({ success: true, data: { message: 'Tag deleted' } });
}
