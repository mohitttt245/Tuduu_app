import { Router } from 'express';
import { body, param } from 'express-validator';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { breakTask, deleteConversation, getConversationMessages, listConversations, planDay, sendChatMessage, suggestPriorities } from '../controllers/aiController.js';

const router = Router();
const aiLimiter = rateLimit({ windowMs: 60_000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'You are sending requests too quickly. Please wait a moment.' } });
router.use(requireAuth);
router.use(aiLimiter);
router.get('/conversations', asyncHandler(listConversations));
router.get('/conversations/:id/messages', param('id').isMongoId(), validate, asyncHandler(getConversationMessages));
router.delete('/conversations/:id', param('id').isMongoId(), validate, asyncHandler(deleteConversation));
router.post('/chat', body('content').trim().isLength({ min: 1, max: 4000 }), body('conversationId').optional({ checkFalsy: true }).isMongoId(), validate, asyncHandler(sendChatMessage));
router.post('/break-task', body('task').trim().isLength({ min: 1, max: 500 }), body('context').optional().isString().isLength({ max: 1000 }), validate, asyncHandler(breakTask));
router.post('/plan-day', asyncHandler(planDay));
router.post('/prioritize', asyncHandler(suggestPriorities));

export default router;
