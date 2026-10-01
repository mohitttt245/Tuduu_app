import { Router } from 'express';
import { param } from 'express-validator';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { deleteNotification, listNotifications, markAllRead, markNotificationRead } from '../controllers/notificationsController.js';

const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(listNotifications));
router.put('/read-all', asyncHandler(markAllRead));
router.put('/:id/read', param('id').isMongoId(), validate, asyncHandler(markNotificationRead));
router.delete('/:id', param('id').isMongoId(), validate, asyncHandler(deleteNotification));

export default router;
