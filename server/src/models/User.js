import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  sessionVersion: { type: Number, default: 0, select: false },
  resetPasswordTokenHash: { type: String, default: null, select: false },
  resetPasswordExpiresAt: { type: Date, default: null, select: false },
}, { timestamps: true });

userSchema.index({ resetPasswordTokenHash: 1 });

export default mongoose.model('User', userSchema);
