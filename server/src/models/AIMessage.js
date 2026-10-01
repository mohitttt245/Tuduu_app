import mongoose from 'mongoose';

const aiMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIConversation', required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true, maxlength: 6000 },
  kind: { type: String, enum: ['chat', 'breakdown', 'plan', 'priority'], default: 'chat' },
}, { timestamps: true });

aiMessageSchema.index({ userId: 1, conversationId: 1, createdAt: 1 });

export default mongoose.model('AIMessage', aiMessageSchema);
