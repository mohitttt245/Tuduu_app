import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', default: null },
  type: { type: String, enum: ['task_reminder', 'task_overdue', 'recurring_task', 'milestone', 'system'], required: true },
  title: { type: String, required: true, maxlength: 160 },
  message: { type: String, required: true, maxlength: 500 },
  isRead: { type: Boolean, default: false },
  dedupeKey: { type: String, default: null },
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } });

export default mongoose.model('Notification', notificationSchema);
