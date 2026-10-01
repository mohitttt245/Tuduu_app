import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { completeHabit, createHabit, deleteHabit, listHabits, undoHabitCompletion, updateHabit } from '../controllers/habitsController.js';

const router = Router();
router.use(requireAuth);
router.get('/', query('today').optional().matches(/^\d{4}-\d{2}-\d{2}$/), validate, asyncHandler(listHabits));
router.post('/', body('name').trim().isLength({ min: 1, max: 80 }), body('description').optional().isLength({ max: 300 }), body('weekdays').optional().isArray({ min: 1, max: 7 }), body('targetPerWeek').optional().isInt({ min: 1, max: 7 }), body('reminderTime').optional({ checkFalsy: true }).matches(/^([01]\d|2[0-3]):[0-5]\d$/), validate, asyncHandler(createHabit));
router.put('/:id', param('id').isMongoId(), body('name').optional().trim().isLength({ min: 1, max: 80 }), body('description').optional().isLength({ max: 300 }), body('weekdays').optional().isArray({ min: 1, max: 7 }), body('targetPerWeek').optional().isInt({ min: 1, max: 7 }), body('reminderTime').optional({ checkFalsy: true }).matches(/^([01]\d|2[0-3]):[0-5]\d$/), validate, asyncHandler(updateHabit));
router.delete('/:id', param('id').isMongoId(), validate, asyncHandler(deleteHabit));
router.post('/:id/complete', param('id').isMongoId(), body('dateKey').optional().matches(/^\d{4}-\d{2}-\d{2}$/), validate, asyncHandler(completeHabit));
router.delete('/:id/completion', param('id').isMongoId(), query('dateKey').optional().matches(/^\d{4}-\d{2}-\d{2}$/), validate, asyncHandler(undoHabitCompletion));

export default router;
