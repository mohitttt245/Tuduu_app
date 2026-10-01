import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, lowercase: true, minlength: 1, maxlength: 32 },
}, { timestamps: true });

tagSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model('Tag', tagSchema);
