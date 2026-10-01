import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createPomodoroSession, listPomodoroSessions } from '../controllers/pomodoroController.js';

const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(listPomodoroSessions));
router.post('/', body('focusMinutes').isInt({ min: 1, max: 180 }).withMessage('Focus time must be between 1 and 180 minutes'), body('breakMinutes').optional().isInt({ min: 0, max: 60 }), body('taskId').optional({ nullable: true }).isMongoId(), validate, asyncHandler(createPomodoroSession));

export default router;
