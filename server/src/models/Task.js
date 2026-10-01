import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 5000, default: '' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['pending', 'completed', 'archived'], default: 'pending', index: true },
  dueDate: { type: Date, default: null, index: true },
  completedAt: { type: Date, default: null },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  tagIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  pinned: { type: Boolean, default: false },
  reminderOffsetMinutes: { type: Number, min: 0, max: 43200, default: 0 },
  recurrence: {
    frequency: { type: String, enum: ['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom'], default: 'none' },
    interval: { type: Number, min: 1, max: 365, default: 1 },
    weekdays: { type: [Number], default: [] },
    endDate: { type: Date, default: null },
  },
  seriesId: { type: mongoose.Schema.Types.ObjectId, default: undefined },
  occurrenceDate: { type: Date, default: undefined },
  subtasks: [{
    _id: false,
    title: { type: String, required: true, trim: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  }],
}, { timestamps: true });

taskSchema.index({ userId: 1, dueDate: 1, status: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ seriesId: 1, occurrenceDate: 1 }, { unique: true, sparse: true });
taskSchema.index({ userId: 1, pinned: 1, status: 1 });

export default mongoose.model('Task', taskSchema);
