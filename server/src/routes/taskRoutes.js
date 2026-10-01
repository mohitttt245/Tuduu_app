import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { archiveTask, completeTask, createTask, deleteTask, getCalendarTasks, getTask, listTasks, reopenTask, togglePin, unarchiveTask, updateTask } from '../controllers/tasksController.js';

const router = Router();
const taskRules = [
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Task title must be between 1 and 200 characters'),
  body('description').optional().isString().isLength({ max: 5000 }).withMessage('Description is too long'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Choose a valid priority'),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Choose a valid due date'),
  body('pinned').optional().isBoolean().withMessage('Pinned must be true or false'),
  body('reminderOffsetMinutes').optional().isInt({ min: 0, max: 43200 }).withMessage('Choose a valid reminder'),
  body('tagIds').optional().isArray({ max: 20 }).withMessage('Choose up to 20 tags'),
  body('subtasks').optional().isArray({ max: 50 }).withMessage('Add up to 50 subtasks'),
  body('recurrence.frequency').optional().isIn(['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom']).withMessage('Choose a valid repeat pattern'),
  body('recurrence.interval').optional().isInt({ min: 1, max: 365 }).withMessage('Repeat interval must be between 1 and 365'),
];

router.use(requireAuth);
router.get('/calendar', asyncHandler(getCalendarTasks));
router.get('/', asyncHandler(listTasks));
router.post('/', taskRules, body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Task title is required'), validate, asyncHandler(createTask));
router.get('/:id', param('id').isMongoId().withMessage('Invalid task id'), validate, asyncHandler(getTask));
router.put('/:id', param('id').isMongoId().withMessage('Invalid task id'), taskRules, validate, asyncHandler(updateTask));
router.delete('/:id', param('id').isMongoId().withMessage('Invalid task id'), validate, asyncHandler(deleteTask));
router.post('/:id/complete', param('id').isMongoId().withMessage('Invalid task id'), validate, asyncHandler(completeTask));
router.post('/:id/reopen', param('id').isMongoId().withMessage('Invalid task id'), validate, asyncHandler(reopenTask));
router.post('/:id/pin', param('id').isMongoId().withMessage('Invalid task id'), body('pinned').optional().isBoolean(), validate, asyncHandler(togglePin));
router.post('/:id/archive', param('id').isMongoId().withMessage('Invalid task id'), validate, asyncHandler(archiveTask));
router.post('/:id/unarchive', param('id').isMongoId().withMessage('Invalid task id'), validate, asyncHandler(unarchiveTask));

export default router;
