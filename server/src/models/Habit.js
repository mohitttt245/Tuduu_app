import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 300, default: '' },
  weekdays: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
  targetPerWeek: { type: Number, min: 1, max: 7, default: 7 },
  reminderTime: { type: String, match: /^(?:|([01]\d|2[0-3]):[0-5]\d)$/, default: '' },
  timezoneOffsetMinutes: { type: Number, min: -840, max: 840, default: 0 },
  archived: { type: Boolean, default: false },
}, { timestamps: true });

habitSchema.index({ userId: 1, archived: 1, createdAt: -1 });

export default mongoose.model('Habit', habitSchema);
