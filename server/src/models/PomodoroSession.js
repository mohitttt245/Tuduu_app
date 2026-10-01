import mongoose from 'mongoose';

const pomodoroSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  focusMinutes: { type: Number, min: 1, max: 180, required: true },
  breakMinutes: { type: Number, min: 0, max: 60, default: 5 },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

pomodoroSessionSchema.index({ userId: 1, completedAt: -1 });

export default mongoose.model('PomodoroSession', pomodoroSessionSchema);
