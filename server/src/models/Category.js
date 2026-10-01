import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 40 },
  icon: { type: String, trim: true, maxlength: 32, default: 'Folder' },
  color: { type: String, match: /^#[0-9A-Fa-f]{6}$/, default: '#7465e8' },
}, { timestamps: true });

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);
