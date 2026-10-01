import mongoose from 'mongoose';

const aiConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

aiConversationSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('AIConversation', aiConversationSchema);
