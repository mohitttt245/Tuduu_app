import mongoose from 'mongoose';

const habitCompletionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  dateKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

habitCompletionSchema.index({ userId: 1, habitId: 1, dateKey: 1 }, { unique: true });
habitCompletionSchema.index({ userId: 1, dateKey: -1 });

export default mongoose.model('HabitCompletion', habitCompletionSchema);
